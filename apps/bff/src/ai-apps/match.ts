import { chatSend } from "../gateway/client.js";
import { loadApps, type AiApp } from "./store.js";

const MATCH_SESSION = "match";

/**
 * 用主模型做意图识别：用户问题 + 应用描述列表 → 返回最相关的 app 或 null。
 * 使用独立 session（mineecho:match）避免污染主对话。
 */
export async function matchAppByIntent(userMessage: string): Promise<AiApp | null> {
  const apps = (await loadApps()).filter((a) => a.enabled);
  if (apps.length === 0) return null;

  const listText = apps.map((a) => `- ${a.id}（${a.name}）：${a.description}`).join("\n");
  const prompt = `你是一个路由助手。用户问题：「${userMessage}」
以下是可以调用的应用，每行格式为：id（应用名称）：描述。请只回复最相关的一个应用的 **id**（即每行开头的 id，如 app-xxx）；如果没有相关应用就只回复 none。不要回复应用名称，只回复 id 或 none。
应用列表：
${listText}

只回复一个 id 或 none：`;

  try {
    const result = await chatSend(MATCH_SESSION, prompt);
    const raw = (result.content ?? "").trim();
    const firstLine = raw.split(/\r?\n/)[0].trim();
    if (!firstLine || firstLine.toLowerCase() === "none") return null;
    // 先按 id 精确或包含匹配
    let matched = apps.find((a) => a.id === firstLine || firstLine.includes(a.id));
    // 若模型返回了名称而非 id，则按名称或描述匹配
    if (!matched) {
      matched = apps.find(
        (a) =>
          firstLine.includes(a.name) ||
          a.name.includes(firstLine) ||
          (a.description && (firstLine.includes(a.description.slice(0, 20)) || a.description.includes(firstLine)))
      );
    }
    return matched ?? null;
  } catch {
    return null;
  }
}
