export type LightRagPathEnv = {
  HOME?: string;
  LIGHT_RAG_WORKING_DIR?: string;
};

export function getLightRagWorkingDir(env: LightRagPathEnv = process.env): string {
  if (env.LIGHT_RAG_WORKING_DIR?.trim()) {
    return env.LIGHT_RAG_WORKING_DIR;
  }
  if (env.HOME?.trim()) {
    return `${env.HOME}/Library/Application Support/MineEcho/lightrag`;
  }
  return ".mineecho/lightrag";
}
