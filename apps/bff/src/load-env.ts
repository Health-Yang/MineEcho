/**
 * 最先加载：在任意路由/业务模块之前把 .mineecho/.env 读入 process.env，
 * 确保企业模式等配置在 enterprise/client 等模块读取时已生效。
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prepareMineEchoHome } from "./utils/config-path.js";

const mineechoHome = prepareMineEchoHome();
const envPath = join(mineechoHome, ".env");
if (existsSync(envPath)) {
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) {
        const key = m[1].trim();
        // 已存在的环境变量（如 Docker 传入的 OPENCLAW_GATEWAY_URL）不覆盖，避免卷内旧 .env 覆盖容器正确配置
        if (process.env[key] !== undefined && process.env[key] !== "") continue;
        process.env[key] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (_) {}
}
