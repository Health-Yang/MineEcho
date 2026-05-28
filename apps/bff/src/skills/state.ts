import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";

function getSkillsStatePath(): string {
  return join(getMineEchoHome(), "skills-state.json");
}

function getCustomSkillsPath(): string {
  return join(getMineEchoHome(), "custom-skills.json");
}

export interface SkillsState {
  [skillId: string]: boolean;
}

export async function loadSkillsState(): Promise<SkillsState> {
  const path = getSkillsStatePath();
  if (!existsSync(path)) return {};
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

export async function saveSkillsState(state: SkillsState): Promise<void> {
  const dir = getMineEchoHome();
  const path = getSkillsStatePath();
  const tmpPath = path + ".tmp." + Date.now();
  await mkdir(dir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(state, null, 2), "utf8");
  await rename(tmpPath, path);
}

export interface CustomSkill {
  id: string;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
}

export async function loadCustomSkills(): Promise<CustomSkill[]> {
  const path = getCustomSkillsPath();
  if (!existsSync(path)) return [];
  try {
    const raw = await readFile(path, "utf8");
    const data = JSON.parse(raw) as { skills?: unknown };
    const list = Array.isArray(data.skills) ? data.skills : [];
    return list.filter(
      (s): s is CustomSkill =>
        s && typeof s === "object" && typeof (s as CustomSkill).id === "string" && typeof (s as CustomSkill).name === "string"
    );
  } catch {
    return [];
  }
}

export async function saveCustomSkills(skills: CustomSkill[]): Promise<void> {
  const dir = getMineEchoHome();
  const path = getCustomSkillsPath();
  const tmpPath = path + ".tmp." + Date.now();
  await mkdir(dir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify({ skills }, null, 2), "utf8");
  await rename(tmpPath, path);
}
