import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { t as EmbeddedContextFile } from "./types-DKoVBm0H.js";
import { t as WorkspaceBootstrapFile } from "./workspace-DY9Fuin-.js";
//#region src/agents/bootstrap-files.d.ts
type BootstrapContextMode = "full" | "lightweight";
type BootstrapContextRunKind = "default" | "heartbeat" | "cron";
declare function resolveBootstrapFilesForRun(params: {
  workspaceDir: string;
  config?: OpenClawConfig;
  sessionKey?: string;
  sessionId?: string;
  agentId?: string;
  warn?: (message: string) => void;
  contextMode?: BootstrapContextMode;
  runKind?: BootstrapContextRunKind;
}): Promise<WorkspaceBootstrapFile[]>;
declare function resolveBootstrapContextForRun(params: {
  workspaceDir: string;
  config?: OpenClawConfig;
  sessionKey?: string;
  sessionId?: string;
  agentId?: string;
  warn?: (message: string) => void;
  contextMode?: BootstrapContextMode;
  runKind?: BootstrapContextRunKind;
}): Promise<{
  bootstrapFiles: WorkspaceBootstrapFile[];
  contextFiles: EmbeddedContextFile[];
}>;
declare function buildBootstrapContextForFiles(bootstrapFiles: WorkspaceBootstrapFile[], params: {
  config?: OpenClawConfig;
  agentId?: string | null;
  warn?: (message: string) => void;
}): EmbeddedContextFile[];
//#endregion
export { resolveBootstrapContextForRun as n, resolveBootstrapFilesForRun as r, buildBootstrapContextForFiles as t };