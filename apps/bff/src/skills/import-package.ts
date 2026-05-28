import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export interface SkillArchiveEntry {
  isDirectory: boolean;
  entryName: string;
  getData: () => Buffer;
}

export interface SkillArchiveFinding {
  code: string;
  message: string;
  file?: string;
}

function normalizeEntryName(name: string): string {
  return name.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isAbsoluteEntryName(name: string): boolean {
  return name.startsWith("/") || /^[a-zA-Z]:\//.test(name);
}

function hasTraversal(name: string): boolean {
  return name.split("/").some((part) => part === "..");
}

export function validateSkillArchiveEntries(entries: SkillArchiveEntry[]): SkillArchiveFinding[] {
  const findings: SkillArchiveFinding[] = [];
  for (const entry of entries) {
    const normalized = normalizeEntryName(entry.entryName);
    if (isAbsoluteEntryName(normalized)) {
      findings.push({
        code: "ZIP_ABSOLUTE_PATH",
        message: `压缩包包含绝对路径: ${entry.entryName}`,
        file: entry.entryName,
      });
      continue;
    }
    if (hasTraversal(normalized)) {
      findings.push({
        code: "ZIP_PATH_TRAVERSAL",
        message: `压缩包包含不安全路径: ${entry.entryName}`,
        file: entry.entryName,
      });
    }
  }
  return findings;
}

export function findSkillPackageRoot(entries: SkillArchiveEntry[]): string | null {
  const skillEntries = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => normalizeEntryName(entry.entryName))
    .filter((name) => !isAbsoluteEntryName(name) && !hasTraversal(name))
    .filter((name) => /^(.+\/)?SKILL\.md$/i.test(name))
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));

  const skillEntry = skillEntries[0];
  if (!skillEntry) return null;
  const slash = skillEntry.lastIndexOf("/");
  return slash >= 0 ? skillEntry.slice(0, slash + 1) : "";
}

function relativeImportedName(entryName: string, rootPrefix: string): string | null {
  const normalized = normalizeEntryName(entryName);
  if (isAbsoluteEntryName(normalized) || hasTraversal(normalized)) return null;
  if (!normalized.startsWith(rootPrefix)) return null;
  const relativeName = normalized.slice(rootPrefix.length);
  if (!relativeName || relativeName === "." || hasTraversal(relativeName)) return null;
  return relativeName;
}

function assertWithinTarget(targetDir: string, targetPath: string): void {
  const base = resolve(targetDir);
  const resolved = resolve(targetPath);
  if (resolved !== base && !resolved.startsWith(base + "/")) {
    throw new Error(`Unsafe extracted path: ${targetPath}`);
  }
}

export async function extractSkillArchiveEntries(
  entries: SkillArchiveEntry[],
  targetDir: string,
  rootPrefix: string
): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  for (const entry of entries) {
    const relativeName = relativeImportedName(entry.entryName, rootPrefix);
    if (!relativeName) continue;

    const targetPath = join(targetDir, relativeName);
    assertWithinTarget(targetDir, targetPath);

    if (entry.isDirectory) {
      await mkdir(targetPath, { recursive: true });
      continue;
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, entry.getData());
  }
}
