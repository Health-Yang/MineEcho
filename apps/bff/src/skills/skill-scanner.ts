/**
 * 内置轻量 skill 安全扫描（进程内、无子进程），用于导入/安装时在内存中检查。
 * 策略：允许含脚本的技能包（.js/.py/.sh 等），仅禁止二进制与对文本做轻量危险模式检测；
 * 深度检测依赖可选集成的 cisco-ai-defense/skill-scanner，见 runExternalSkillScanner()。
 *
 * @see https://skills.sh/cisco-ai-defense/skill-scanner
 * @see https://github.com/cisco-ai-defense/skill-scanner
 */

export interface ScanEntry {
  /** 条目路径（zip 内相对路径） */
  name: string;
  /** 是否为目录 */
  isDir: boolean;
  /** 文件内容（目录可空）；仅对需检测的文本文件传入 */
  data?: Buffer;
}

export interface ScanFinding {
  code: string;
  message: string;
  file?: string;
}

export interface ScanResult {
  pass: boolean;
  findings: ScanFinding[];
}

/** 允许的扩展名（小写），含常见脚本类型以支持需执行脚本的技能 */
const ALLOWED_EXT = new Set([
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".txt",
  ".csv",
  ".xml",
  ".html",
  ".htm",
  ".svg",
  ".mdx",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".py",
  ".sh",
  ".bash",
  ".bat",
  ".cmd",
  ".ps1",
]);

/** 仅禁止二进制/原生可执行，避免误放恶意程序；脚本由内容或外部 scanner 判定 */
const BLOCKED_EXT = new Set([".exe", ".bin", ".dll", ".so", ".dylib"]);

/** 仅对非脚本类文本做轻量危险模式检测，避免对合法脚本（如含 child_process 的工具）误报 */
const CONTENT_SCAN_EXT = new Set([".md", ".txt", ".json", ".yaml", ".yml"]);

/** 单文件最大内容扫描大小（字节），避免大文件拖慢 */
const MAX_CONTENT_SCAN_BYTES = 500 * 1024;

/** 危险模式：正则与说明 */
const DANGER_PATTERNS: { pattern: RegExp; code: string; message: string }[] = [
  { pattern: /\beval\s*\(/i, code: "DANGER_EVAL", message: "检测到 eval() 调用" },
  { pattern: /\bFunction\s*\(/i, code: "DANGER_FUNCTION_CTOR", message: "检测到 Function 构造器" },
  { pattern: /\brequire\s*\(\s*["']child_process["']\)/i, code: "DANGER_CHILD_PROCESS", message: "检测到 child_process 引用" },
  { pattern: /\bexec\s*\(|execSync\s*\(|spawn\s*\(/i, code: "DANGER_EXEC", message: "检测到 exec/spawn 等执行类调用" },
  { pattern: /\b__proto__\b/i, code: "DANGER_PROTO", message: "检测到 __proto__ 使用" },
  { pattern: /\bprocess\.env\b.*\b(?:API_KEY|SECRET|PASSWORD|TOKEN)\b/i, code: "DANGER_ENV_LEAK", message: "检测到可能的环境变量泄露模式" },
  { pattern: /https?:\/\/[^\s"')\]]+\.(?:php|asp|jsp|cgi)(?:\?|$|\s)/i, code: "DANGER_REMOTE_SCRIPT", message: "检测到可疑远程脚本 URL" },
];

function getExt(name: string): string {
  const base = name.replace(/\/$/, "").split("/").pop() || "";
  const i = base.lastIndexOf(".");
  if (i <= 0) return "";
  return base.slice(i).toLowerCase();
}

/**
 * 对一组条目做内置安全扫描（扩展名 + 内容模式）。
 * 可在解压前基于 zip entries 调用，传入 name + isDir + 可选 data，全部在内存中完成。
 */
export function scanSkillEntries(entries: ScanEntry[]): ScanResult {
  const findings: ScanFinding[] = [];

  for (const e of entries) {
    if (e.isDir) continue;
    const ext = getExt(e.name);
    if (BLOCKED_EXT.has(ext)) {
      findings.push({ code: "BLOCKED_EXT", message: `不允许的脚本/可执行类型: ${ext}`, file: e.name });
      continue;
    }
    if (ext && !ALLOWED_EXT.has(ext)) {
      findings.push({ code: "EXT_NOT_ALLOWED", message: `文件类型不在白名单: ${ext}`, file: e.name });
      continue;
    }

    if (!CONTENT_SCAN_EXT.has(ext) || !e.data || e.data.length > MAX_CONTENT_SCAN_BYTES) continue;
    const text = e.data.toString("utf8");
    for (const { pattern, code, message } of DANGER_PATTERNS) {
      if (pattern.test(text)) {
        findings.push({ code, message, file: e.name });
        break;
      }
    }
  }

  return {
    pass: findings.length === 0,
    findings,
  };
}

/** 可选：在解压目录上运行 cisco-ai-defense/skill-scanner，用于含脚本技能的深度检测 */
export interface ExternalScanResult {
  ran: boolean;
  pass: boolean;
  message?: string;
  raw?: string;
}

const EXTERNAL_SCANNER_CLI = process.env.MINECHO_SKILL_SCANNER_CLI || "skill-scanner";

export async function runExternalSkillScanner(dirPath: string): Promise<ExternalScanResult> {
  const { spawn } = await import("node:child_process");
  const { platform } = await import("node:os");
  const cmd = EXTERNAL_SCANNER_CLI.trim();
  if (!cmd) return { ran: false, pass: true };

  const useShell = cmd.includes(" ") || platform() === "win32";
  const child = useShell
    ? spawn(`${cmd} scan ${JSON.stringify(dirPath)}`, [], { shell: true, cwd: dirPath, timeout: 120000 })
    : spawn(cmd, ["scan", dirPath], { cwd: dirPath, shell: false, timeout: 120000 });

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (c) => { stdout += c.toString(); });
    child.stderr?.on("data", (c) => { stderr += c.toString(); });
    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT")
        resolve({ ran: false, pass: true, message: "未找到 skill-scanner 命令，已跳过深度扫描" });
      else resolve({ ran: true, pass: true, message: String(err) });
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ ran: true, pass: true });
      else
        resolve({
          ran: true,
          pass: false,
          message: `skill-scanner 发现风险 (exit ${code})`,
          raw: (stdout || stderr).slice(0, 1000),
        });
    });
  });
}
