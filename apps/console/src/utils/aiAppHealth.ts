export interface AiAppHealthQueryInput {
  name: string;
  description?: string;
}

export function buildAiAppHealthQuery(app: AiAppHealthQueryInput): string {
  const name = app.name.trim();
  const description = (app.description || "").trim();
  return description ? `${name}：${description}` : name;
}
