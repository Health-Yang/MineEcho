//#region src/infra/diagnostic-llm-content.d.ts
type DiagnosticModelContentCapturePolicy = {
  inputMessages: boolean;
  outputMessages: boolean;
  toolInputs: boolean;
  toolOutputs: boolean;
  systemPrompt: boolean;
  toolDefinitions: boolean;
  anyModelContent: boolean;
};
declare function resolveDiagnosticModelContentCapturePolicy(config: unknown): DiagnosticModelContentCapturePolicy;
//#endregion
export { resolveDiagnosticModelContentCapturePolicy as n, DiagnosticModelContentCapturePolicy as t };