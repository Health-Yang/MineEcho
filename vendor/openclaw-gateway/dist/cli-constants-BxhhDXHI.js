//#region extensions/anthropic/cli-constants.ts
const CLAUDE_CLI_BACKEND_ID = "claude-cli";
const CLAUDE_CLI_DEFAULT_MODEL_REF = `${CLAUDE_CLI_BACKEND_ID}/claude-opus-4-7`;
const CLAUDE_CLI_DEFAULT_ALLOWLIST_REFS = [
	CLAUDE_CLI_DEFAULT_MODEL_REF,
	`${CLAUDE_CLI_BACKEND_ID}/claude-sonnet-4-6`,
	`${CLAUDE_CLI_BACKEND_ID}/claude-opus-4-6`
];
const CLAUDE_CLI_MODEL_ALIASES = {
	opus: "opus",
	"opus-4.7": "opus",
	"opus-4.6": "opus",
	"claude-opus-4-7": "opus",
	"claude-opus-4-6": "opus",
	sonnet: "sonnet",
	"sonnet-4.6": "sonnet",
	"claude-sonnet-4-6": "sonnet",
	haiku: "haiku"
};
const CLAUDE_CLI_SESSION_ID_FIELDS = [
	"session_id",
	"sessionId",
	"conversation_id",
	"conversationId"
];
//#endregion
export { CLAUDE_CLI_SESSION_ID_FIELDS as a, CLAUDE_CLI_MODEL_ALIASES as i, CLAUDE_CLI_DEFAULT_ALLOWLIST_REFS as n, CLAUDE_CLI_DEFAULT_MODEL_REF as r, CLAUDE_CLI_BACKEND_ID as t };
