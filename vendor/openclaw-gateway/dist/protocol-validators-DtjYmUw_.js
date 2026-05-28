import { Compile } from "typebox/compile";
//#region extensions/codex/src/app-server/protocol-generated/json/DynamicToolCallParams.json
var DynamicToolCallParams_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "DynamicToolCallParams",
	type: "object",
	required: [
		"arguments",
		"callId",
		"threadId",
		"tool",
		"turnId"
	],
	properties: {
		"arguments": true,
		"callId": { "type": "string" },
		"namespace": { "type": ["string", "null"] },
		"threadId": { "type": "string" },
		"tool": { "type": "string" },
		"turnId": { "type": "string" }
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-generated/json/v2/ErrorNotification.json
var ErrorNotification_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "ErrorNotification",
	type: "object",
	required: [
		"error",
		"threadId",
		"turnId",
		"willRetry"
	],
	properties: {
		"error": { "$ref": "#/definitions/TurnError" },
		"threadId": { "type": "string" },
		"turnId": { "type": "string" },
		"willRetry": { "type": "boolean" }
	},
	definitions: {
		"CodexErrorInfo": {
			"description": "This translation layer make sure that we expose codex error code in camel case.\n\nWhen an upstream HTTP status is available (for example, from the Responses API or a provider), it is forwarded in `httpStatusCode` on the relevant `codexErrorInfo` variant.",
			"oneOf": [
				{
					"type": "string",
					"enum": [
						"contextWindowExceeded",
						"usageLimitExceeded",
						"serverOverloaded",
						"cyberPolicy",
						"internalServerError",
						"unauthorized",
						"badRequest",
						"threadRollbackFailed",
						"sandboxError",
						"other"
					]
				},
				{
					"type": "object",
					"required": ["httpConnectionFailed"],
					"properties": { "httpConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "HttpConnectionFailedCodexErrorInfo"
				},
				{
					"description": "Failed to connect to the response SSE stream.",
					"type": "object",
					"required": ["responseStreamConnectionFailed"],
					"properties": { "responseStreamConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamConnectionFailedCodexErrorInfo"
				},
				{
					"description": "The response SSE stream disconnected in the middle of a turn before completion.",
					"type": "object",
					"required": ["responseStreamDisconnected"],
					"properties": { "responseStreamDisconnected": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamDisconnectedCodexErrorInfo"
				},
				{
					"description": "Reached the retry limit for responses.",
					"type": "object",
					"required": ["responseTooManyFailedAttempts"],
					"properties": { "responseTooManyFailedAttempts": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseTooManyFailedAttemptsCodexErrorInfo"
				},
				{
					"description": "Returned when `turn/start` or `turn/steer` is submitted while the current active turn cannot accept same-turn steering, for example `/review` or manual `/compact`.",
					"type": "object",
					"required": ["activeTurnNotSteerable"],
					"properties": { "activeTurnNotSteerable": {
						"type": "object",
						"required": ["turnKind"],
						"properties": { "turnKind": { "$ref": "#/definitions/NonSteerableTurnKind" } }
					} },
					"additionalProperties": false,
					"title": "ActiveTurnNotSteerableCodexErrorInfo"
				}
			]
		},
		"NonSteerableTurnKind": {
			"type": "string",
			"enum": ["review", "compact"]
		},
		"TurnError": {
			"type": "object",
			"required": ["message"],
			"properties": {
				"additionalDetails": {
					"default": null,
					"type": ["string", "null"]
				},
				"codexErrorInfo": { "anyOf": [{ "$ref": "#/definitions/CodexErrorInfo" }, { "type": "null" }] },
				"message": { "type": "string" }
			}
		}
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-generated/json/v2/ModelListResponse.json
var ModelListResponse_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "ModelListResponse",
	type: "object",
	required: ["data"],
	properties: {
		"data": {
			"type": "array",
			"items": { "$ref": "#/definitions/Model" }
		},
		"nextCursor": {
			"description": "Opaque cursor to pass to the next call to continue after the last item. If None, there are no more items to return.",
			"type": ["string", "null"]
		}
	},
	definitions: {
		"InputModality": {
			"description": "Canonical user-input modality tags advertised by a model.",
			"oneOf": [{
				"description": "Plain text turns and tool payloads.",
				"type": "string",
				"enum": ["text"]
			}, {
				"description": "Image attachments included in user turns.",
				"type": "string",
				"enum": ["image"]
			}]
		},
		"Model": {
			"type": "object",
			"required": [
				"defaultReasoningEffort",
				"description",
				"displayName",
				"hidden",
				"id",
				"isDefault",
				"model",
				"supportedReasoningEfforts"
			],
			"properties": {
				"additionalSpeedTiers": {
					"description": "Deprecated: use `serviceTiers` instead.",
					"default": [],
					"type": "array",
					"items": { "type": "string" }
				},
				"availabilityNux": { "anyOf": [{ "$ref": "#/definitions/ModelAvailabilityNux" }, { "type": "null" }] },
				"defaultReasoningEffort": { "$ref": "#/definitions/ReasoningEffort" },
				"description": { "type": "string" },
				"displayName": { "type": "string" },
				"hidden": { "type": "boolean" },
				"id": { "type": "string" },
				"inputModalities": {
					"default": ["text", "image"],
					"type": "array",
					"items": { "$ref": "#/definitions/InputModality" }
				},
				"isDefault": { "type": "boolean" },
				"model": { "type": "string" },
				"serviceTiers": {
					"default": [],
					"type": "array",
					"items": { "$ref": "#/definitions/ModelServiceTier" }
				},
				"supportedReasoningEfforts": {
					"type": "array",
					"items": { "$ref": "#/definitions/ReasoningEffortOption" }
				},
				"supportsPersonality": {
					"default": false,
					"type": "boolean"
				},
				"upgrade": { "type": ["string", "null"] },
				"upgradeInfo": { "anyOf": [{ "$ref": "#/definitions/ModelUpgradeInfo" }, { "type": "null" }] }
			}
		},
		"ModelAvailabilityNux": {
			"type": "object",
			"required": ["message"],
			"properties": { "message": { "type": "string" } }
		},
		"ModelServiceTier": {
			"type": "object",
			"required": [
				"description",
				"id",
				"name"
			],
			"properties": {
				"description": { "type": "string" },
				"id": { "type": "string" },
				"name": { "type": "string" }
			}
		},
		"ModelUpgradeInfo": {
			"type": "object",
			"required": ["model"],
			"properties": {
				"migrationMarkdown": { "type": ["string", "null"] },
				"model": { "type": "string" },
				"modelLink": { "type": ["string", "null"] },
				"upgradeCopy": { "type": ["string", "null"] }
			}
		},
		"ReasoningEffort": {
			"description": "See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#get-started-with-reasoning",
			"type": "string",
			"enum": [
				"none",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh"
			]
		},
		"ReasoningEffortOption": {
			"type": "object",
			"required": ["description", "reasoningEffort"],
			"properties": {
				"description": { "type": "string" },
				"reasoningEffort": { "$ref": "#/definitions/ReasoningEffort" }
			}
		}
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-generated/json/v2/ThreadResumeResponse.json
var ThreadResumeResponse_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "ThreadResumeResponse",
	type: "object",
	required: [
		"approvalPolicy",
		"approvalsReviewer",
		"cwd",
		"model",
		"modelProvider",
		"sandbox",
		"thread"
	],
	properties: {
		"activePermissionProfile": {
			"description": "Named or implicit built-in profile that produced the active permissions, when known.",
			"default": null,
			"anyOf": [{ "$ref": "#/definitions/ActivePermissionProfile" }, { "type": "null" }]
		},
		"approvalPolicy": { "$ref": "#/definitions/AskForApproval" },
		"approvalsReviewer": {
			"description": "Reviewer currently used for approval requests on this thread.",
			"allOf": [{ "$ref": "#/definitions/ApprovalsReviewer" }]
		},
		"cwd": { "$ref": "#/definitions/AbsolutePathBuf" },
		"instructionSources": {
			"description": "Instruction source files currently loaded for this thread.",
			"default": [],
			"type": "array",
			"items": { "$ref": "#/definitions/AbsolutePathBuf" }
		},
		"model": { "type": "string" },
		"modelProvider": { "type": "string" },
		"reasoningEffort": { "anyOf": [{ "$ref": "#/definitions/ReasoningEffort" }, { "type": "null" }] },
		"runtimeWorkspaceRoots": {
			"description": "Thread-scoped runtime workspace roots used to materialize `:workspace_roots`.",
			"default": [],
			"type": "array",
			"items": { "$ref": "#/definitions/AbsolutePathBuf" }
		},
		"sandbox": {
			"description": "Legacy sandbox policy retained for compatibility. Experimental clients should prefer `activePermissionProfile` for profile provenance.",
			"allOf": [{ "$ref": "#/definitions/SandboxPolicy" }]
		},
		"serviceTier": { "type": ["string", "null"] },
		"thread": { "$ref": "#/definitions/Thread" }
	},
	definitions: {
		"AbsolutePathBuf": {
			"description": "A path that is guaranteed to be absolute and normalized (though it is not guaranteed to be canonicalized or exist on the filesystem).\n\nIMPORTANT: When deserializing an `AbsolutePathBuf`, a base path must be set using [AbsolutePathBufGuard::new]. If no base path is set, the deserialization will fail unless the path being deserialized is already absolute.",
			"type": "string"
		},
		"ActivePermissionProfile": {
			"type": "object",
			"required": ["id"],
			"properties": {
				"extends": {
					"description": "Parent profile identifier once permissions profiles support inheritance. This is currently always `null`.",
					"default": null,
					"type": ["string", "null"]
				},
				"id": {
					"description": "Identifier from `default_permissions` or the implicit built-in default, such as `:workspace` or a user-defined `[permissions.<id>]` profile.",
					"type": "string"
				}
			}
		},
		"AgentPath": { "type": "string" },
		"ApprovalsReviewer": {
			"description": "Configures who approval requests are routed to for review. Examples include sandbox escapes, blocked network access, MCP approval prompts, and ARC escalations. Defaults to `user`. `auto_review` uses a carefully prompted subagent to gather relevant context and apply a risk-based decision framework before approving or denying the request. The legacy value `guardian_subagent` is accepted for compatibility.",
			"type": "string",
			"enum": [
				"user",
				"auto_review",
				"guardian_subagent"
			]
		},
		"AskForApproval": { "oneOf": [{
			"type": "string",
			"enum": [
				"untrusted",
				"on-failure",
				"on-request",
				"never"
			]
		}, {
			"type": "object",
			"required": ["granular"],
			"properties": { "granular": {
				"type": "object",
				"required": [
					"mcp_elicitations",
					"rules",
					"sandbox_approval"
				],
				"properties": {
					"mcp_elicitations": { "type": "boolean" },
					"request_permissions": {
						"default": false,
						"type": "boolean"
					},
					"rules": { "type": "boolean" },
					"sandbox_approval": { "type": "boolean" },
					"skill_approval": {
						"default": false,
						"type": "boolean"
					}
				}
			} },
			"additionalProperties": false,
			"title": "GranularAskForApproval"
		}] },
		"ByteRange": {
			"type": "object",
			"required": ["end", "start"],
			"properties": {
				"end": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				},
				"start": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				}
			}
		},
		"CodexErrorInfo": {
			"description": "This translation layer make sure that we expose codex error code in camel case.\n\nWhen an upstream HTTP status is available (for example, from the Responses API or a provider), it is forwarded in `httpStatusCode` on the relevant `codexErrorInfo` variant.",
			"oneOf": [
				{
					"type": "string",
					"enum": [
						"contextWindowExceeded",
						"usageLimitExceeded",
						"serverOverloaded",
						"cyberPolicy",
						"internalServerError",
						"unauthorized",
						"badRequest",
						"threadRollbackFailed",
						"sandboxError",
						"other"
					]
				},
				{
					"type": "object",
					"required": ["httpConnectionFailed"],
					"properties": { "httpConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "HttpConnectionFailedCodexErrorInfo"
				},
				{
					"description": "Failed to connect to the response SSE stream.",
					"type": "object",
					"required": ["responseStreamConnectionFailed"],
					"properties": { "responseStreamConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamConnectionFailedCodexErrorInfo"
				},
				{
					"description": "The response SSE stream disconnected in the middle of a turn before completion.",
					"type": "object",
					"required": ["responseStreamDisconnected"],
					"properties": { "responseStreamDisconnected": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamDisconnectedCodexErrorInfo"
				},
				{
					"description": "Reached the retry limit for responses.",
					"type": "object",
					"required": ["responseTooManyFailedAttempts"],
					"properties": { "responseTooManyFailedAttempts": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseTooManyFailedAttemptsCodexErrorInfo"
				},
				{
					"description": "Returned when `turn/start` or `turn/steer` is submitted while the current active turn cannot accept same-turn steering, for example `/review` or manual `/compact`.",
					"type": "object",
					"required": ["activeTurnNotSteerable"],
					"properties": { "activeTurnNotSteerable": {
						"type": "object",
						"required": ["turnKind"],
						"properties": { "turnKind": { "$ref": "#/definitions/NonSteerableTurnKind" } }
					} },
					"additionalProperties": false,
					"title": "ActiveTurnNotSteerableCodexErrorInfo"
				}
			]
		},
		"CollabAgentState": {
			"type": "object",
			"required": ["status"],
			"properties": {
				"message": { "type": ["string", "null"] },
				"status": { "$ref": "#/definitions/CollabAgentStatus" }
			}
		},
		"CollabAgentStatus": {
			"type": "string",
			"enum": [
				"pendingInit",
				"running",
				"interrupted",
				"completed",
				"errored",
				"shutdown",
				"notFound"
			]
		},
		"CollabAgentTool": {
			"type": "string",
			"enum": [
				"spawnAgent",
				"sendInput",
				"resumeAgent",
				"wait",
				"closeAgent"
			]
		},
		"CollabAgentToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"CommandAction": { "oneOf": [
			{
				"type": "object",
				"required": [
					"command",
					"name",
					"path",
					"type"
				],
				"properties": {
					"command": { "type": "string" },
					"name": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["read"],
						"title": "ReadCommandActionType"
					}
				},
				"title": "ReadCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["listFiles"],
						"title": "ListFilesCommandActionType"
					}
				},
				"title": "ListFilesCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchCommandActionType"
					}
				},
				"title": "SearchCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["unknown"],
						"title": "UnknownCommandActionType"
					}
				},
				"title": "UnknownCommandAction"
			}
		] },
		"CommandExecutionSource": {
			"type": "string",
			"enum": [
				"agent",
				"userShell",
				"unifiedExecStartup",
				"unifiedExecInteraction"
			]
		},
		"CommandExecutionStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"DynamicToolCallOutputContentItem": { "oneOf": [{
			"type": "object",
			"required": ["text", "type"],
			"properties": {
				"text": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputText"],
					"title": "InputTextDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputTextDynamicToolCallOutputContentItem"
		}, {
			"type": "object",
			"required": ["imageUrl", "type"],
			"properties": {
				"imageUrl": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputImage"],
					"title": "InputImageDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputImageDynamicToolCallOutputContentItem"
		}] },
		"DynamicToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"FileUpdateChange": {
			"type": "object",
			"required": [
				"diff",
				"kind",
				"path"
			],
			"properties": {
				"diff": { "type": "string" },
				"kind": { "$ref": "#/definitions/PatchChangeKind" },
				"path": { "type": "string" }
			}
		},
		"GitInfo": {
			"type": "object",
			"properties": {
				"branch": { "type": ["string", "null"] },
				"originUrl": { "type": ["string", "null"] },
				"sha": { "type": ["string", "null"] }
			}
		},
		"HookPromptFragment": {
			"type": "object",
			"required": ["hookRunId", "text"],
			"properties": {
				"hookRunId": { "type": "string" },
				"text": { "type": "string" }
			}
		},
		"ImageDetail": {
			"type": "string",
			"enum": ["high", "original"]
		},
		"McpToolCallError": {
			"type": "object",
			"required": ["message"],
			"properties": { "message": { "type": "string" } }
		},
		"McpToolCallResult": {
			"type": "object",
			"required": ["content"],
			"properties": {
				"_meta": true,
				"content": {
					"type": "array",
					"items": true
				},
				"structuredContent": true
			}
		},
		"McpToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"MemoryCitation": {
			"type": "object",
			"required": ["entries", "threadIds"],
			"properties": {
				"entries": {
					"type": "array",
					"items": { "$ref": "#/definitions/MemoryCitationEntry" }
				},
				"threadIds": {
					"type": "array",
					"items": { "type": "string" }
				}
			}
		},
		"MemoryCitationEntry": {
			"type": "object",
			"required": [
				"lineEnd",
				"lineStart",
				"note",
				"path"
			],
			"properties": {
				"lineEnd": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"lineStart": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"note": { "type": "string" },
				"path": { "type": "string" }
			}
		},
		"MessagePhase": {
			"description": "Classifies an assistant message as interim commentary or final answer text.\n\nProviders do not emit this consistently, so callers must treat `None` as \"phase unknown\" and keep compatibility behavior for legacy models.",
			"oneOf": [{
				"description": "Mid-turn assistant text (for example preamble/progress narration).\n\nAdditional tool calls or assistant output may follow before turn completion.",
				"type": "string",
				"enum": ["commentary"]
			}, {
				"description": "The assistant's terminal answer text for the current turn.",
				"type": "string",
				"enum": ["final_answer"]
			}]
		},
		"NetworkAccess": {
			"type": "string",
			"enum": ["restricted", "enabled"]
		},
		"NonSteerableTurnKind": {
			"type": "string",
			"enum": ["review", "compact"]
		},
		"PatchApplyStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"PatchChangeKind": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["add"],
					"title": "AddPatchChangeKindType"
				} },
				"title": "AddPatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["delete"],
					"title": "DeletePatchChangeKindType"
				} },
				"title": "DeletePatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"move_path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["update"],
						"title": "UpdatePatchChangeKindType"
					}
				},
				"title": "UpdatePatchChangeKind"
			}
		] },
		"ReasoningEffort": {
			"description": "See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#get-started-with-reasoning",
			"type": "string",
			"enum": [
				"none",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh"
			]
		},
		"SandboxPolicy": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["dangerFullAccess"],
					"title": "DangerFullAccessSandboxPolicyType"
				} },
				"title": "DangerFullAccessSandboxPolicy"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"networkAccess": {
						"default": false,
						"type": "boolean"
					},
					"type": {
						"type": "string",
						"enum": ["readOnly"],
						"title": "ReadOnlySandboxPolicyType"
					}
				},
				"title": "ReadOnlySandboxPolicy"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"networkAccess": {
						"default": "restricted",
						"allOf": [{ "$ref": "#/definitions/NetworkAccess" }]
					},
					"type": {
						"type": "string",
						"enum": ["externalSandbox"],
						"title": "ExternalSandboxSandboxPolicyType"
					}
				},
				"title": "ExternalSandboxSandboxPolicy"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"excludeSlashTmp": {
						"default": false,
						"type": "boolean"
					},
					"excludeTmpdirEnvVar": {
						"default": false,
						"type": "boolean"
					},
					"networkAccess": {
						"default": false,
						"type": "boolean"
					},
					"type": {
						"type": "string",
						"enum": ["workspaceWrite"],
						"title": "WorkspaceWriteSandboxPolicyType"
					},
					"writableRoots": {
						"default": [],
						"type": "array",
						"items": { "$ref": "#/definitions/AbsolutePathBuf" }
					}
				},
				"title": "WorkspaceWriteSandboxPolicy"
			}
		] },
		"SessionSource": { "oneOf": [
			{
				"type": "string",
				"enum": [
					"cli",
					"vscode",
					"exec",
					"appServer",
					"unknown"
				]
			},
			{
				"type": "object",
				"required": ["custom"],
				"properties": { "custom": { "type": "string" } },
				"additionalProperties": false,
				"title": "CustomSessionSource"
			},
			{
				"type": "object",
				"required": ["subAgent"],
				"properties": { "subAgent": { "$ref": "#/definitions/SubAgentSource" } },
				"additionalProperties": false,
				"title": "SubAgentSessionSource"
			}
		] },
		"SubAgentSource": { "oneOf": [
			{
				"type": "string",
				"enum": [
					"review",
					"compact",
					"memory_consolidation"
				]
			},
			{
				"type": "object",
				"required": ["thread_spawn"],
				"properties": { "thread_spawn": {
					"type": "object",
					"required": ["depth", "parent_thread_id"],
					"properties": {
						"agent_nickname": {
							"default": null,
							"type": ["string", "null"]
						},
						"agent_path": {
							"default": null,
							"anyOf": [{ "$ref": "#/definitions/AgentPath" }, { "type": "null" }]
						},
						"agent_role": {
							"default": null,
							"type": ["string", "null"]
						},
						"depth": {
							"type": "integer",
							"format": "int32"
						},
						"parent_thread_id": { "$ref": "#/definitions/ThreadId" }
					}
				} },
				"additionalProperties": false,
				"title": "ThreadSpawnSubAgentSource"
			},
			{
				"type": "object",
				"required": ["other"],
				"properties": { "other": { "type": "string" } },
				"additionalProperties": false,
				"title": "OtherSubAgentSource"
			}
		] },
		"TextElement": {
			"type": "object",
			"required": ["byteRange"],
			"properties": {
				"byteRange": {
					"description": "Byte range in the parent `text` buffer that this element occupies.",
					"allOf": [{ "$ref": "#/definitions/ByteRange" }]
				},
				"placeholder": {
					"description": "Optional human-readable placeholder for the element, displayed in the UI.",
					"type": ["string", "null"]
				}
			}
		},
		"Thread": {
			"type": "object",
			"required": [
				"cliVersion",
				"createdAt",
				"cwd",
				"ephemeral",
				"id",
				"modelProvider",
				"preview",
				"sessionId",
				"source",
				"status",
				"turns",
				"updatedAt"
			],
			"properties": {
				"agentNickname": {
					"description": "Optional random unique nickname assigned to an AgentControl-spawned sub-agent.",
					"type": ["string", "null"]
				},
				"agentRole": {
					"description": "Optional role (agent_role) assigned to an AgentControl-spawned sub-agent.",
					"type": ["string", "null"]
				},
				"cliVersion": {
					"description": "Version of the CLI that created the thread.",
					"type": "string"
				},
				"createdAt": {
					"description": "Unix timestamp (in seconds) when the thread was created.",
					"type": "integer",
					"format": "int64"
				},
				"cwd": {
					"description": "Working directory captured for the thread.",
					"allOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }]
				},
				"ephemeral": {
					"description": "Whether the thread is ephemeral and should not be materialized on disk.",
					"type": "boolean"
				},
				"forkedFromId": {
					"description": "Source thread id when this thread was created by forking another thread.",
					"type": ["string", "null"]
				},
				"gitInfo": {
					"description": "Optional Git metadata captured when the thread was created.",
					"anyOf": [{ "$ref": "#/definitions/GitInfo" }, { "type": "null" }]
				},
				"id": { "type": "string" },
				"modelProvider": {
					"description": "Model provider used for this thread (for example, 'openai').",
					"type": "string"
				},
				"name": {
					"description": "Optional user-facing thread title.",
					"type": ["string", "null"]
				},
				"path": {
					"description": "[UNSTABLE] Path to the thread on disk.",
					"type": ["string", "null"]
				},
				"preview": {
					"description": "Usually the first user message in the thread, if available.",
					"type": "string"
				},
				"sessionId": {
					"description": "Session id shared by threads that belong to the same session tree.",
					"type": "string"
				},
				"source": {
					"description": "Origin of the thread (CLI, VSCode, codex exec, codex app-server, etc.).",
					"allOf": [{ "$ref": "#/definitions/SessionSource" }]
				},
				"status": {
					"description": "Current runtime status for the thread.",
					"allOf": [{ "$ref": "#/definitions/ThreadStatus" }]
				},
				"threadSource": {
					"description": "Optional analytics source classification for this thread.",
					"anyOf": [{ "$ref": "#/definitions/ThreadSource" }, { "type": "null" }]
				},
				"turns": {
					"description": "Only populated on `thread/resume`, `thread/rollback`, `thread/fork`, and `thread/read` (when `includeTurns` is true) responses. For all other responses and notifications returning a Thread, the turns field will be an empty list.",
					"type": "array",
					"items": { "$ref": "#/definitions/Turn" }
				},
				"updatedAt": {
					"description": "Unix timestamp (in seconds) when the thread was last updated.",
					"type": "integer",
					"format": "int64"
				}
			}
		},
		"ThreadActiveFlag": {
			"type": "string",
			"enum": ["waitingOnApproval", "waitingOnUserInput"]
		},
		"ThreadId": { "type": "string" },
		"ThreadItem": { "oneOf": [
			{
				"type": "object",
				"required": [
					"content",
					"id",
					"type"
				],
				"properties": {
					"content": {
						"type": "array",
						"items": { "$ref": "#/definitions/UserInput" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["userMessage"],
						"title": "UserMessageThreadItemType"
					}
				},
				"title": "UserMessageThreadItem"
			},
			{
				"type": "object",
				"required": [
					"fragments",
					"id",
					"type"
				],
				"properties": {
					"fragments": {
						"type": "array",
						"items": { "$ref": "#/definitions/HookPromptFragment" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["hookPrompt"],
						"title": "HookPromptThreadItemType"
					}
				},
				"title": "HookPromptThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"memoryCitation": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MemoryCitation" }, { "type": "null" }]
					},
					"phase": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MessagePhase" }, { "type": "null" }]
					},
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["agentMessage"],
						"title": "AgentMessageThreadItemType"
					}
				},
				"title": "AgentMessageThreadItem"
			},
			{
				"description": "EXPERIMENTAL - proposed plan item content. The completed plan item is authoritative and may not match the concatenation of `PlanDelta` text.",
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["plan"],
						"title": "PlanThreadItemType"
					}
				},
				"title": "PlanThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"content": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"id": { "type": "string" },
					"summary": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"type": {
						"type": "string",
						"enum": ["reasoning"],
						"title": "ReasoningThreadItemType"
					}
				},
				"title": "ReasoningThreadItem"
			},
			{
				"type": "object",
				"required": [
					"command",
					"commandActions",
					"cwd",
					"id",
					"status",
					"type"
				],
				"properties": {
					"aggregatedOutput": {
						"description": "The command's output, aggregated from stdout and stderr.",
						"type": ["string", "null"]
					},
					"command": {
						"description": "The command to be executed.",
						"type": "string"
					},
					"commandActions": {
						"description": "A best-effort parsing of the command to understand the action(s) it will perform. This returns a list of CommandAction objects because a single shell command may be composed of many commands piped together.",
						"type": "array",
						"items": { "$ref": "#/definitions/CommandAction" }
					},
					"cwd": {
						"description": "The command's working directory.",
						"allOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }]
					},
					"durationMs": {
						"description": "The duration of the command execution in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"exitCode": {
						"description": "The command's exit code.",
						"type": ["integer", "null"],
						"format": "int32"
					},
					"id": { "type": "string" },
					"processId": {
						"description": "Identifier for the underlying PTY process (when available).",
						"type": ["string", "null"]
					},
					"source": {
						"default": "agent",
						"allOf": [{ "$ref": "#/definitions/CommandExecutionSource" }]
					},
					"status": { "$ref": "#/definitions/CommandExecutionStatus" },
					"type": {
						"type": "string",
						"enum": ["commandExecution"],
						"title": "CommandExecutionThreadItemType"
					}
				},
				"title": "CommandExecutionThreadItem"
			},
			{
				"type": "object",
				"required": [
					"changes",
					"id",
					"status",
					"type"
				],
				"properties": {
					"changes": {
						"type": "array",
						"items": { "$ref": "#/definitions/FileUpdateChange" }
					},
					"id": { "type": "string" },
					"status": { "$ref": "#/definitions/PatchApplyStatus" },
					"type": {
						"type": "string",
						"enum": ["fileChange"],
						"title": "FileChangeThreadItemType"
					}
				},
				"title": "FileChangeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"server",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"durationMs": {
						"description": "The duration of the MCP tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"error": { "anyOf": [{ "$ref": "#/definitions/McpToolCallError" }, { "type": "null" }] },
					"id": { "type": "string" },
					"mcpAppResourceUri": { "type": ["string", "null"] },
					"result": { "anyOf": [{ "$ref": "#/definitions/McpToolCallResult" }, { "type": "null" }] },
					"server": { "type": "string" },
					"status": { "$ref": "#/definitions/McpToolCallStatus" },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mcpToolCall"],
						"title": "McpToolCallThreadItemType"
					}
				},
				"title": "McpToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"contentItems": {
						"type": ["array", "null"],
						"items": { "$ref": "#/definitions/DynamicToolCallOutputContentItem" }
					},
					"durationMs": {
						"description": "The duration of the dynamic tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"id": { "type": "string" },
					"namespace": { "type": ["string", "null"] },
					"status": { "$ref": "#/definitions/DynamicToolCallStatus" },
					"success": { "type": ["boolean", "null"] },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["dynamicToolCall"],
						"title": "DynamicToolCallThreadItemType"
					}
				},
				"title": "DynamicToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"agentsStates",
					"id",
					"receiverThreadIds",
					"senderThreadId",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"agentsStates": {
						"description": "Last known status of the target agents, when available.",
						"type": "object",
						"additionalProperties": { "$ref": "#/definitions/CollabAgentState" }
					},
					"id": {
						"description": "Unique identifier for this collab tool call.",
						"type": "string"
					},
					"model": {
						"description": "Model requested for the spawned agent, when applicable.",
						"type": ["string", "null"]
					},
					"prompt": {
						"description": "Prompt text sent as part of the collab tool call, when available.",
						"type": ["string", "null"]
					},
					"reasoningEffort": {
						"description": "Reasoning effort requested for the spawned agent, when applicable.",
						"anyOf": [{ "$ref": "#/definitions/ReasoningEffort" }, { "type": "null" }]
					},
					"receiverThreadIds": {
						"description": "Thread ID of the receiving agent, when applicable. In case of spawn operation, this corresponds to the newly spawned agent.",
						"type": "array",
						"items": { "type": "string" }
					},
					"senderThreadId": {
						"description": "Thread ID of the agent issuing the collab request.",
						"type": "string"
					},
					"status": {
						"description": "Current status of the collab tool call.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentToolCallStatus" }]
					},
					"tool": {
						"description": "Name of the collab tool that was invoked.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentTool" }]
					},
					"type": {
						"type": "string",
						"enum": ["collabAgentToolCall"],
						"title": "CollabAgentToolCallThreadItemType"
					}
				},
				"title": "CollabAgentToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"query",
					"type"
				],
				"properties": {
					"action": { "anyOf": [{ "$ref": "#/definitions/WebSearchAction" }, { "type": "null" }] },
					"id": { "type": "string" },
					"query": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["webSearch"],
						"title": "WebSearchThreadItemType"
					}
				},
				"title": "WebSearchThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"path",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["imageView"],
						"title": "ImageViewThreadItemType"
					}
				},
				"title": "ImageViewThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"result",
					"status",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"result": { "type": "string" },
					"revisedPrompt": { "type": ["string", "null"] },
					"savedPath": { "anyOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }, { "type": "null" }] },
					"status": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["imageGeneration"],
						"title": "ImageGenerationThreadItemType"
					}
				},
				"title": "ImageGenerationThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["enteredReviewMode"],
						"title": "EnteredReviewModeThreadItemType"
					}
				},
				"title": "EnteredReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["exitedReviewMode"],
						"title": "ExitedReviewModeThreadItemType"
					}
				},
				"title": "ExitedReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["contextCompaction"],
						"title": "ContextCompactionThreadItemType"
					}
				},
				"title": "ContextCompactionThreadItem"
			}
		] },
		"ThreadSource": {
			"type": "string",
			"enum": [
				"user",
				"subagent",
				"memory_consolidation"
			]
		},
		"ThreadStatus": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["notLoaded"],
					"title": "NotLoadedThreadStatusType"
				} },
				"title": "NotLoadedThreadStatus"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["idle"],
					"title": "IdleThreadStatusType"
				} },
				"title": "IdleThreadStatus"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["systemError"],
					"title": "SystemErrorThreadStatusType"
				} },
				"title": "SystemErrorThreadStatus"
			},
			{
				"type": "object",
				"required": ["activeFlags", "type"],
				"properties": {
					"activeFlags": {
						"type": "array",
						"items": { "$ref": "#/definitions/ThreadActiveFlag" }
					},
					"type": {
						"type": "string",
						"enum": ["active"],
						"title": "ActiveThreadStatusType"
					}
				},
				"title": "ActiveThreadStatus"
			}
		] },
		"Turn": {
			"type": "object",
			"required": [
				"id",
				"items",
				"status"
			],
			"properties": {
				"completedAt": {
					"description": "Unix timestamp (in seconds) when the turn completed.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"durationMs": {
					"description": "Duration between turn start and completion in milliseconds, if known.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"error": {
					"description": "Only populated when the Turn's status is failed.",
					"anyOf": [{ "$ref": "#/definitions/TurnError" }, { "type": "null" }]
				},
				"id": { "type": "string" },
				"items": {
					"description": "Thread items currently included in this turn payload.",
					"type": "array",
					"items": { "$ref": "#/definitions/ThreadItem" }
				},
				"itemsView": {
					"description": "Describes how much of `items` has been loaded for this turn.",
					"default": "full",
					"allOf": [{ "$ref": "#/definitions/TurnItemsView" }]
				},
				"startedAt": {
					"description": "Unix timestamp (in seconds) when the turn started.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"status": { "$ref": "#/definitions/TurnStatus" }
			}
		},
		"TurnError": {
			"type": "object",
			"required": ["message"],
			"properties": {
				"additionalDetails": {
					"default": null,
					"type": ["string", "null"]
				},
				"codexErrorInfo": { "anyOf": [{ "$ref": "#/definitions/CodexErrorInfo" }, { "type": "null" }] },
				"message": { "type": "string" }
			}
		},
		"TurnItemsView": { "oneOf": [
			{
				"description": "`items` was not loaded for this turn. The field is intentionally empty.",
				"type": "string",
				"enum": ["notLoaded"]
			},
			{
				"description": "`items` contains only a display summary for this turn.",
				"type": "string",
				"enum": ["summary"]
			},
			{
				"description": "`items` contains every ThreadItem available from persisted app-server history for this turn.",
				"type": "string",
				"enum": ["full"]
			}
		] },
		"TurnStatus": {
			"type": "string",
			"enum": [
				"completed",
				"interrupted",
				"failed",
				"inProgress"
			]
		},
		"UserInput": { "oneOf": [
			{
				"type": "object",
				"required": ["text", "type"],
				"properties": {
					"text": { "type": "string" },
					"text_elements": {
						"description": "UI-defined spans within `text` used to render or persist special elements.",
						"default": [],
						"type": "array",
						"items": { "$ref": "#/definitions/TextElement" }
					},
					"type": {
						"type": "string",
						"enum": ["text"],
						"title": "TextUserInputType"
					}
				},
				"title": "TextUserInput"
			},
			{
				"type": "object",
				"required": ["type", "url"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"type": {
						"type": "string",
						"enum": ["image"],
						"title": "ImageUserInputType"
					},
					"url": { "type": "string" }
				},
				"title": "ImageUserInput"
			},
			{
				"type": "object",
				"required": ["path", "type"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["localImage"],
						"title": "LocalImageUserInputType"
					}
				},
				"title": "LocalImageUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["skill"],
						"title": "SkillUserInputType"
					}
				},
				"title": "SkillUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mention"],
						"title": "MentionUserInputType"
					}
				},
				"title": "MentionUserInput"
			}
		] },
		"WebSearchAction": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"queries": {
						"type": ["array", "null"],
						"items": { "type": "string" }
					},
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchWebSearchActionType"
					}
				},
				"title": "SearchWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"type": {
						"type": "string",
						"enum": ["openPage"],
						"title": "OpenPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "OpenPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"pattern": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["findInPage"],
						"title": "FindInPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "FindInPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["other"],
					"title": "OtherWebSearchActionType"
				} },
				"title": "OtherWebSearchAction"
			}
		] }
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-generated/json/v2/ThreadStartResponse.json
var ThreadStartResponse_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "ThreadStartResponse",
	type: "object",
	required: [
		"approvalPolicy",
		"approvalsReviewer",
		"cwd",
		"model",
		"modelProvider",
		"sandbox",
		"thread"
	],
	properties: {
		"activePermissionProfile": {
			"description": "Named or implicit built-in profile that produced the active permissions, when known.",
			"default": null,
			"anyOf": [{ "$ref": "#/definitions/ActivePermissionProfile" }, { "type": "null" }]
		},
		"approvalPolicy": { "$ref": "#/definitions/AskForApproval" },
		"approvalsReviewer": {
			"description": "Reviewer currently used for approval requests on this thread.",
			"allOf": [{ "$ref": "#/definitions/ApprovalsReviewer" }]
		},
		"cwd": { "$ref": "#/definitions/AbsolutePathBuf" },
		"instructionSources": {
			"description": "Instruction source files currently loaded for this thread.",
			"default": [],
			"type": "array",
			"items": { "$ref": "#/definitions/AbsolutePathBuf" }
		},
		"model": { "type": "string" },
		"modelProvider": { "type": "string" },
		"reasoningEffort": { "anyOf": [{ "$ref": "#/definitions/ReasoningEffort" }, { "type": "null" }] },
		"runtimeWorkspaceRoots": {
			"description": "Thread-scoped runtime workspace roots used to materialize `:workspace_roots`.",
			"default": [],
			"type": "array",
			"items": { "$ref": "#/definitions/AbsolutePathBuf" }
		},
		"sandbox": {
			"description": "Legacy sandbox policy retained for compatibility. Experimental clients should prefer `activePermissionProfile` for profile provenance.",
			"allOf": [{ "$ref": "#/definitions/SandboxPolicy" }]
		},
		"serviceTier": { "type": ["string", "null"] },
		"thread": { "$ref": "#/definitions/Thread" }
	},
	definitions: {
		"AbsolutePathBuf": {
			"description": "A path that is guaranteed to be absolute and normalized (though it is not guaranteed to be canonicalized or exist on the filesystem).\n\nIMPORTANT: When deserializing an `AbsolutePathBuf`, a base path must be set using [AbsolutePathBufGuard::new]. If no base path is set, the deserialization will fail unless the path being deserialized is already absolute.",
			"type": "string"
		},
		"ActivePermissionProfile": {
			"type": "object",
			"required": ["id"],
			"properties": {
				"extends": {
					"description": "Parent profile identifier once permissions profiles support inheritance. This is currently always `null`.",
					"default": null,
					"type": ["string", "null"]
				},
				"id": {
					"description": "Identifier from `default_permissions` or the implicit built-in default, such as `:workspace` or a user-defined `[permissions.<id>]` profile.",
					"type": "string"
				}
			}
		},
		"AgentPath": { "type": "string" },
		"ApprovalsReviewer": {
			"description": "Configures who approval requests are routed to for review. Examples include sandbox escapes, blocked network access, MCP approval prompts, and ARC escalations. Defaults to `user`. `auto_review` uses a carefully prompted subagent to gather relevant context and apply a risk-based decision framework before approving or denying the request. The legacy value `guardian_subagent` is accepted for compatibility.",
			"type": "string",
			"enum": [
				"user",
				"auto_review",
				"guardian_subagent"
			]
		},
		"AskForApproval": { "oneOf": [{
			"type": "string",
			"enum": [
				"untrusted",
				"on-failure",
				"on-request",
				"never"
			]
		}, {
			"type": "object",
			"required": ["granular"],
			"properties": { "granular": {
				"type": "object",
				"required": [
					"mcp_elicitations",
					"rules",
					"sandbox_approval"
				],
				"properties": {
					"mcp_elicitations": { "type": "boolean" },
					"request_permissions": {
						"default": false,
						"type": "boolean"
					},
					"rules": { "type": "boolean" },
					"sandbox_approval": { "type": "boolean" },
					"skill_approval": {
						"default": false,
						"type": "boolean"
					}
				}
			} },
			"additionalProperties": false,
			"title": "GranularAskForApproval"
		}] },
		"ByteRange": {
			"type": "object",
			"required": ["end", "start"],
			"properties": {
				"end": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				},
				"start": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				}
			}
		},
		"CodexErrorInfo": {
			"description": "This translation layer make sure that we expose codex error code in camel case.\n\nWhen an upstream HTTP status is available (for example, from the Responses API or a provider), it is forwarded in `httpStatusCode` on the relevant `codexErrorInfo` variant.",
			"oneOf": [
				{
					"type": "string",
					"enum": [
						"contextWindowExceeded",
						"usageLimitExceeded",
						"serverOverloaded",
						"cyberPolicy",
						"internalServerError",
						"unauthorized",
						"badRequest",
						"threadRollbackFailed",
						"sandboxError",
						"other"
					]
				},
				{
					"type": "object",
					"required": ["httpConnectionFailed"],
					"properties": { "httpConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "HttpConnectionFailedCodexErrorInfo"
				},
				{
					"description": "Failed to connect to the response SSE stream.",
					"type": "object",
					"required": ["responseStreamConnectionFailed"],
					"properties": { "responseStreamConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamConnectionFailedCodexErrorInfo"
				},
				{
					"description": "The response SSE stream disconnected in the middle of a turn before completion.",
					"type": "object",
					"required": ["responseStreamDisconnected"],
					"properties": { "responseStreamDisconnected": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamDisconnectedCodexErrorInfo"
				},
				{
					"description": "Reached the retry limit for responses.",
					"type": "object",
					"required": ["responseTooManyFailedAttempts"],
					"properties": { "responseTooManyFailedAttempts": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseTooManyFailedAttemptsCodexErrorInfo"
				},
				{
					"description": "Returned when `turn/start` or `turn/steer` is submitted while the current active turn cannot accept same-turn steering, for example `/review` or manual `/compact`.",
					"type": "object",
					"required": ["activeTurnNotSteerable"],
					"properties": { "activeTurnNotSteerable": {
						"type": "object",
						"required": ["turnKind"],
						"properties": { "turnKind": { "$ref": "#/definitions/NonSteerableTurnKind" } }
					} },
					"additionalProperties": false,
					"title": "ActiveTurnNotSteerableCodexErrorInfo"
				}
			]
		},
		"CollabAgentState": {
			"type": "object",
			"required": ["status"],
			"properties": {
				"message": { "type": ["string", "null"] },
				"status": { "$ref": "#/definitions/CollabAgentStatus" }
			}
		},
		"CollabAgentStatus": {
			"type": "string",
			"enum": [
				"pendingInit",
				"running",
				"interrupted",
				"completed",
				"errored",
				"shutdown",
				"notFound"
			]
		},
		"CollabAgentTool": {
			"type": "string",
			"enum": [
				"spawnAgent",
				"sendInput",
				"resumeAgent",
				"wait",
				"closeAgent"
			]
		},
		"CollabAgentToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"CommandAction": { "oneOf": [
			{
				"type": "object",
				"required": [
					"command",
					"name",
					"path",
					"type"
				],
				"properties": {
					"command": { "type": "string" },
					"name": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["read"],
						"title": "ReadCommandActionType"
					}
				},
				"title": "ReadCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["listFiles"],
						"title": "ListFilesCommandActionType"
					}
				},
				"title": "ListFilesCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchCommandActionType"
					}
				},
				"title": "SearchCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["unknown"],
						"title": "UnknownCommandActionType"
					}
				},
				"title": "UnknownCommandAction"
			}
		] },
		"CommandExecutionSource": {
			"type": "string",
			"enum": [
				"agent",
				"userShell",
				"unifiedExecStartup",
				"unifiedExecInteraction"
			]
		},
		"CommandExecutionStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"DynamicToolCallOutputContentItem": { "oneOf": [{
			"type": "object",
			"required": ["text", "type"],
			"properties": {
				"text": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputText"],
					"title": "InputTextDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputTextDynamicToolCallOutputContentItem"
		}, {
			"type": "object",
			"required": ["imageUrl", "type"],
			"properties": {
				"imageUrl": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputImage"],
					"title": "InputImageDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputImageDynamicToolCallOutputContentItem"
		}] },
		"DynamicToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"FileUpdateChange": {
			"type": "object",
			"required": [
				"diff",
				"kind",
				"path"
			],
			"properties": {
				"diff": { "type": "string" },
				"kind": { "$ref": "#/definitions/PatchChangeKind" },
				"path": { "type": "string" }
			}
		},
		"GitInfo": {
			"type": "object",
			"properties": {
				"branch": { "type": ["string", "null"] },
				"originUrl": { "type": ["string", "null"] },
				"sha": { "type": ["string", "null"] }
			}
		},
		"HookPromptFragment": {
			"type": "object",
			"required": ["hookRunId", "text"],
			"properties": {
				"hookRunId": { "type": "string" },
				"text": { "type": "string" }
			}
		},
		"ImageDetail": {
			"type": "string",
			"enum": ["high", "original"]
		},
		"McpToolCallError": {
			"type": "object",
			"required": ["message"],
			"properties": { "message": { "type": "string" } }
		},
		"McpToolCallResult": {
			"type": "object",
			"required": ["content"],
			"properties": {
				"_meta": true,
				"content": {
					"type": "array",
					"items": true
				},
				"structuredContent": true
			}
		},
		"McpToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"MemoryCitation": {
			"type": "object",
			"required": ["entries", "threadIds"],
			"properties": {
				"entries": {
					"type": "array",
					"items": { "$ref": "#/definitions/MemoryCitationEntry" }
				},
				"threadIds": {
					"type": "array",
					"items": { "type": "string" }
				}
			}
		},
		"MemoryCitationEntry": {
			"type": "object",
			"required": [
				"lineEnd",
				"lineStart",
				"note",
				"path"
			],
			"properties": {
				"lineEnd": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"lineStart": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"note": { "type": "string" },
				"path": { "type": "string" }
			}
		},
		"MessagePhase": {
			"description": "Classifies an assistant message as interim commentary or final answer text.\n\nProviders do not emit this consistently, so callers must treat `None` as \"phase unknown\" and keep compatibility behavior for legacy models.",
			"oneOf": [{
				"description": "Mid-turn assistant text (for example preamble/progress narration).\n\nAdditional tool calls or assistant output may follow before turn completion.",
				"type": "string",
				"enum": ["commentary"]
			}, {
				"description": "The assistant's terminal answer text for the current turn.",
				"type": "string",
				"enum": ["final_answer"]
			}]
		},
		"NetworkAccess": {
			"type": "string",
			"enum": ["restricted", "enabled"]
		},
		"NonSteerableTurnKind": {
			"type": "string",
			"enum": ["review", "compact"]
		},
		"PatchApplyStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"PatchChangeKind": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["add"],
					"title": "AddPatchChangeKindType"
				} },
				"title": "AddPatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["delete"],
					"title": "DeletePatchChangeKindType"
				} },
				"title": "DeletePatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"move_path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["update"],
						"title": "UpdatePatchChangeKindType"
					}
				},
				"title": "UpdatePatchChangeKind"
			}
		] },
		"ReasoningEffort": {
			"description": "See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#get-started-with-reasoning",
			"type": "string",
			"enum": [
				"none",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh"
			]
		},
		"SandboxPolicy": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["dangerFullAccess"],
					"title": "DangerFullAccessSandboxPolicyType"
				} },
				"title": "DangerFullAccessSandboxPolicy"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"networkAccess": {
						"default": false,
						"type": "boolean"
					},
					"type": {
						"type": "string",
						"enum": ["readOnly"],
						"title": "ReadOnlySandboxPolicyType"
					}
				},
				"title": "ReadOnlySandboxPolicy"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"networkAccess": {
						"default": "restricted",
						"allOf": [{ "$ref": "#/definitions/NetworkAccess" }]
					},
					"type": {
						"type": "string",
						"enum": ["externalSandbox"],
						"title": "ExternalSandboxSandboxPolicyType"
					}
				},
				"title": "ExternalSandboxSandboxPolicy"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"excludeSlashTmp": {
						"default": false,
						"type": "boolean"
					},
					"excludeTmpdirEnvVar": {
						"default": false,
						"type": "boolean"
					},
					"networkAccess": {
						"default": false,
						"type": "boolean"
					},
					"type": {
						"type": "string",
						"enum": ["workspaceWrite"],
						"title": "WorkspaceWriteSandboxPolicyType"
					},
					"writableRoots": {
						"default": [],
						"type": "array",
						"items": { "$ref": "#/definitions/AbsolutePathBuf" }
					}
				},
				"title": "WorkspaceWriteSandboxPolicy"
			}
		] },
		"SessionSource": { "oneOf": [
			{
				"type": "string",
				"enum": [
					"cli",
					"vscode",
					"exec",
					"appServer",
					"unknown"
				]
			},
			{
				"type": "object",
				"required": ["custom"],
				"properties": { "custom": { "type": "string" } },
				"additionalProperties": false,
				"title": "CustomSessionSource"
			},
			{
				"type": "object",
				"required": ["subAgent"],
				"properties": { "subAgent": { "$ref": "#/definitions/SubAgentSource" } },
				"additionalProperties": false,
				"title": "SubAgentSessionSource"
			}
		] },
		"SubAgentSource": { "oneOf": [
			{
				"type": "string",
				"enum": [
					"review",
					"compact",
					"memory_consolidation"
				]
			},
			{
				"type": "object",
				"required": ["thread_spawn"],
				"properties": { "thread_spawn": {
					"type": "object",
					"required": ["depth", "parent_thread_id"],
					"properties": {
						"agent_nickname": {
							"default": null,
							"type": ["string", "null"]
						},
						"agent_path": {
							"default": null,
							"anyOf": [{ "$ref": "#/definitions/AgentPath" }, { "type": "null" }]
						},
						"agent_role": {
							"default": null,
							"type": ["string", "null"]
						},
						"depth": {
							"type": "integer",
							"format": "int32"
						},
						"parent_thread_id": { "$ref": "#/definitions/ThreadId" }
					}
				} },
				"additionalProperties": false,
				"title": "ThreadSpawnSubAgentSource"
			},
			{
				"type": "object",
				"required": ["other"],
				"properties": { "other": { "type": "string" } },
				"additionalProperties": false,
				"title": "OtherSubAgentSource"
			}
		] },
		"TextElement": {
			"type": "object",
			"required": ["byteRange"],
			"properties": {
				"byteRange": {
					"description": "Byte range in the parent `text` buffer that this element occupies.",
					"allOf": [{ "$ref": "#/definitions/ByteRange" }]
				},
				"placeholder": {
					"description": "Optional human-readable placeholder for the element, displayed in the UI.",
					"type": ["string", "null"]
				}
			}
		},
		"Thread": {
			"type": "object",
			"required": [
				"cliVersion",
				"createdAt",
				"cwd",
				"ephemeral",
				"id",
				"modelProvider",
				"preview",
				"sessionId",
				"source",
				"status",
				"turns",
				"updatedAt"
			],
			"properties": {
				"agentNickname": {
					"description": "Optional random unique nickname assigned to an AgentControl-spawned sub-agent.",
					"type": ["string", "null"]
				},
				"agentRole": {
					"description": "Optional role (agent_role) assigned to an AgentControl-spawned sub-agent.",
					"type": ["string", "null"]
				},
				"cliVersion": {
					"description": "Version of the CLI that created the thread.",
					"type": "string"
				},
				"createdAt": {
					"description": "Unix timestamp (in seconds) when the thread was created.",
					"type": "integer",
					"format": "int64"
				},
				"cwd": {
					"description": "Working directory captured for the thread.",
					"allOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }]
				},
				"ephemeral": {
					"description": "Whether the thread is ephemeral and should not be materialized on disk.",
					"type": "boolean"
				},
				"forkedFromId": {
					"description": "Source thread id when this thread was created by forking another thread.",
					"type": ["string", "null"]
				},
				"gitInfo": {
					"description": "Optional Git metadata captured when the thread was created.",
					"anyOf": [{ "$ref": "#/definitions/GitInfo" }, { "type": "null" }]
				},
				"id": { "type": "string" },
				"modelProvider": {
					"description": "Model provider used for this thread (for example, 'openai').",
					"type": "string"
				},
				"name": {
					"description": "Optional user-facing thread title.",
					"type": ["string", "null"]
				},
				"path": {
					"description": "[UNSTABLE] Path to the thread on disk.",
					"type": ["string", "null"]
				},
				"preview": {
					"description": "Usually the first user message in the thread, if available.",
					"type": "string"
				},
				"sessionId": {
					"description": "Session id shared by threads that belong to the same session tree.",
					"type": "string"
				},
				"source": {
					"description": "Origin of the thread (CLI, VSCode, codex exec, codex app-server, etc.).",
					"allOf": [{ "$ref": "#/definitions/SessionSource" }]
				},
				"status": {
					"description": "Current runtime status for the thread.",
					"allOf": [{ "$ref": "#/definitions/ThreadStatus" }]
				},
				"threadSource": {
					"description": "Optional analytics source classification for this thread.",
					"anyOf": [{ "$ref": "#/definitions/ThreadSource" }, { "type": "null" }]
				},
				"turns": {
					"description": "Only populated on `thread/resume`, `thread/rollback`, `thread/fork`, and `thread/read` (when `includeTurns` is true) responses. For all other responses and notifications returning a Thread, the turns field will be an empty list.",
					"type": "array",
					"items": { "$ref": "#/definitions/Turn" }
				},
				"updatedAt": {
					"description": "Unix timestamp (in seconds) when the thread was last updated.",
					"type": "integer",
					"format": "int64"
				}
			}
		},
		"ThreadActiveFlag": {
			"type": "string",
			"enum": ["waitingOnApproval", "waitingOnUserInput"]
		},
		"ThreadId": { "type": "string" },
		"ThreadItem": { "oneOf": [
			{
				"type": "object",
				"required": [
					"content",
					"id",
					"type"
				],
				"properties": {
					"content": {
						"type": "array",
						"items": { "$ref": "#/definitions/UserInput" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["userMessage"],
						"title": "UserMessageThreadItemType"
					}
				},
				"title": "UserMessageThreadItem"
			},
			{
				"type": "object",
				"required": [
					"fragments",
					"id",
					"type"
				],
				"properties": {
					"fragments": {
						"type": "array",
						"items": { "$ref": "#/definitions/HookPromptFragment" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["hookPrompt"],
						"title": "HookPromptThreadItemType"
					}
				},
				"title": "HookPromptThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"memoryCitation": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MemoryCitation" }, { "type": "null" }]
					},
					"phase": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MessagePhase" }, { "type": "null" }]
					},
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["agentMessage"],
						"title": "AgentMessageThreadItemType"
					}
				},
				"title": "AgentMessageThreadItem"
			},
			{
				"description": "EXPERIMENTAL - proposed plan item content. The completed plan item is authoritative and may not match the concatenation of `PlanDelta` text.",
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["plan"],
						"title": "PlanThreadItemType"
					}
				},
				"title": "PlanThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"content": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"id": { "type": "string" },
					"summary": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"type": {
						"type": "string",
						"enum": ["reasoning"],
						"title": "ReasoningThreadItemType"
					}
				},
				"title": "ReasoningThreadItem"
			},
			{
				"type": "object",
				"required": [
					"command",
					"commandActions",
					"cwd",
					"id",
					"status",
					"type"
				],
				"properties": {
					"aggregatedOutput": {
						"description": "The command's output, aggregated from stdout and stderr.",
						"type": ["string", "null"]
					},
					"command": {
						"description": "The command to be executed.",
						"type": "string"
					},
					"commandActions": {
						"description": "A best-effort parsing of the command to understand the action(s) it will perform. This returns a list of CommandAction objects because a single shell command may be composed of many commands piped together.",
						"type": "array",
						"items": { "$ref": "#/definitions/CommandAction" }
					},
					"cwd": {
						"description": "The command's working directory.",
						"allOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }]
					},
					"durationMs": {
						"description": "The duration of the command execution in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"exitCode": {
						"description": "The command's exit code.",
						"type": ["integer", "null"],
						"format": "int32"
					},
					"id": { "type": "string" },
					"processId": {
						"description": "Identifier for the underlying PTY process (when available).",
						"type": ["string", "null"]
					},
					"source": {
						"default": "agent",
						"allOf": [{ "$ref": "#/definitions/CommandExecutionSource" }]
					},
					"status": { "$ref": "#/definitions/CommandExecutionStatus" },
					"type": {
						"type": "string",
						"enum": ["commandExecution"],
						"title": "CommandExecutionThreadItemType"
					}
				},
				"title": "CommandExecutionThreadItem"
			},
			{
				"type": "object",
				"required": [
					"changes",
					"id",
					"status",
					"type"
				],
				"properties": {
					"changes": {
						"type": "array",
						"items": { "$ref": "#/definitions/FileUpdateChange" }
					},
					"id": { "type": "string" },
					"status": { "$ref": "#/definitions/PatchApplyStatus" },
					"type": {
						"type": "string",
						"enum": ["fileChange"],
						"title": "FileChangeThreadItemType"
					}
				},
				"title": "FileChangeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"server",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"durationMs": {
						"description": "The duration of the MCP tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"error": { "anyOf": [{ "$ref": "#/definitions/McpToolCallError" }, { "type": "null" }] },
					"id": { "type": "string" },
					"mcpAppResourceUri": { "type": ["string", "null"] },
					"result": { "anyOf": [{ "$ref": "#/definitions/McpToolCallResult" }, { "type": "null" }] },
					"server": { "type": "string" },
					"status": { "$ref": "#/definitions/McpToolCallStatus" },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mcpToolCall"],
						"title": "McpToolCallThreadItemType"
					}
				},
				"title": "McpToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"contentItems": {
						"type": ["array", "null"],
						"items": { "$ref": "#/definitions/DynamicToolCallOutputContentItem" }
					},
					"durationMs": {
						"description": "The duration of the dynamic tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"id": { "type": "string" },
					"namespace": { "type": ["string", "null"] },
					"status": { "$ref": "#/definitions/DynamicToolCallStatus" },
					"success": { "type": ["boolean", "null"] },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["dynamicToolCall"],
						"title": "DynamicToolCallThreadItemType"
					}
				},
				"title": "DynamicToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"agentsStates",
					"id",
					"receiverThreadIds",
					"senderThreadId",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"agentsStates": {
						"description": "Last known status of the target agents, when available.",
						"type": "object",
						"additionalProperties": { "$ref": "#/definitions/CollabAgentState" }
					},
					"id": {
						"description": "Unique identifier for this collab tool call.",
						"type": "string"
					},
					"model": {
						"description": "Model requested for the spawned agent, when applicable.",
						"type": ["string", "null"]
					},
					"prompt": {
						"description": "Prompt text sent as part of the collab tool call, when available.",
						"type": ["string", "null"]
					},
					"reasoningEffort": {
						"description": "Reasoning effort requested for the spawned agent, when applicable.",
						"anyOf": [{ "$ref": "#/definitions/ReasoningEffort" }, { "type": "null" }]
					},
					"receiverThreadIds": {
						"description": "Thread ID of the receiving agent, when applicable. In case of spawn operation, this corresponds to the newly spawned agent.",
						"type": "array",
						"items": { "type": "string" }
					},
					"senderThreadId": {
						"description": "Thread ID of the agent issuing the collab request.",
						"type": "string"
					},
					"status": {
						"description": "Current status of the collab tool call.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentToolCallStatus" }]
					},
					"tool": {
						"description": "Name of the collab tool that was invoked.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentTool" }]
					},
					"type": {
						"type": "string",
						"enum": ["collabAgentToolCall"],
						"title": "CollabAgentToolCallThreadItemType"
					}
				},
				"title": "CollabAgentToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"query",
					"type"
				],
				"properties": {
					"action": { "anyOf": [{ "$ref": "#/definitions/WebSearchAction" }, { "type": "null" }] },
					"id": { "type": "string" },
					"query": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["webSearch"],
						"title": "WebSearchThreadItemType"
					}
				},
				"title": "WebSearchThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"path",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["imageView"],
						"title": "ImageViewThreadItemType"
					}
				},
				"title": "ImageViewThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"result",
					"status",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"result": { "type": "string" },
					"revisedPrompt": { "type": ["string", "null"] },
					"savedPath": { "anyOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }, { "type": "null" }] },
					"status": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["imageGeneration"],
						"title": "ImageGenerationThreadItemType"
					}
				},
				"title": "ImageGenerationThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["enteredReviewMode"],
						"title": "EnteredReviewModeThreadItemType"
					}
				},
				"title": "EnteredReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["exitedReviewMode"],
						"title": "ExitedReviewModeThreadItemType"
					}
				},
				"title": "ExitedReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["contextCompaction"],
						"title": "ContextCompactionThreadItemType"
					}
				},
				"title": "ContextCompactionThreadItem"
			}
		] },
		"ThreadSource": {
			"type": "string",
			"enum": [
				"user",
				"subagent",
				"memory_consolidation"
			]
		},
		"ThreadStatus": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["notLoaded"],
					"title": "NotLoadedThreadStatusType"
				} },
				"title": "NotLoadedThreadStatus"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["idle"],
					"title": "IdleThreadStatusType"
				} },
				"title": "IdleThreadStatus"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["systemError"],
					"title": "SystemErrorThreadStatusType"
				} },
				"title": "SystemErrorThreadStatus"
			},
			{
				"type": "object",
				"required": ["activeFlags", "type"],
				"properties": {
					"activeFlags": {
						"type": "array",
						"items": { "$ref": "#/definitions/ThreadActiveFlag" }
					},
					"type": {
						"type": "string",
						"enum": ["active"],
						"title": "ActiveThreadStatusType"
					}
				},
				"title": "ActiveThreadStatus"
			}
		] },
		"Turn": {
			"type": "object",
			"required": [
				"id",
				"items",
				"status"
			],
			"properties": {
				"completedAt": {
					"description": "Unix timestamp (in seconds) when the turn completed.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"durationMs": {
					"description": "Duration between turn start and completion in milliseconds, if known.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"error": {
					"description": "Only populated when the Turn's status is failed.",
					"anyOf": [{ "$ref": "#/definitions/TurnError" }, { "type": "null" }]
				},
				"id": { "type": "string" },
				"items": {
					"description": "Thread items currently included in this turn payload.",
					"type": "array",
					"items": { "$ref": "#/definitions/ThreadItem" }
				},
				"itemsView": {
					"description": "Describes how much of `items` has been loaded for this turn.",
					"default": "full",
					"allOf": [{ "$ref": "#/definitions/TurnItemsView" }]
				},
				"startedAt": {
					"description": "Unix timestamp (in seconds) when the turn started.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"status": { "$ref": "#/definitions/TurnStatus" }
			}
		},
		"TurnError": {
			"type": "object",
			"required": ["message"],
			"properties": {
				"additionalDetails": {
					"default": null,
					"type": ["string", "null"]
				},
				"codexErrorInfo": { "anyOf": [{ "$ref": "#/definitions/CodexErrorInfo" }, { "type": "null" }] },
				"message": { "type": "string" }
			}
		},
		"TurnItemsView": { "oneOf": [
			{
				"description": "`items` was not loaded for this turn. The field is intentionally empty.",
				"type": "string",
				"enum": ["notLoaded"]
			},
			{
				"description": "`items` contains only a display summary for this turn.",
				"type": "string",
				"enum": ["summary"]
			},
			{
				"description": "`items` contains every ThreadItem available from persisted app-server history for this turn.",
				"type": "string",
				"enum": ["full"]
			}
		] },
		"TurnStatus": {
			"type": "string",
			"enum": [
				"completed",
				"interrupted",
				"failed",
				"inProgress"
			]
		},
		"UserInput": { "oneOf": [
			{
				"type": "object",
				"required": ["text", "type"],
				"properties": {
					"text": { "type": "string" },
					"text_elements": {
						"description": "UI-defined spans within `text` used to render or persist special elements.",
						"default": [],
						"type": "array",
						"items": { "$ref": "#/definitions/TextElement" }
					},
					"type": {
						"type": "string",
						"enum": ["text"],
						"title": "TextUserInputType"
					}
				},
				"title": "TextUserInput"
			},
			{
				"type": "object",
				"required": ["type", "url"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"type": {
						"type": "string",
						"enum": ["image"],
						"title": "ImageUserInputType"
					},
					"url": { "type": "string" }
				},
				"title": "ImageUserInput"
			},
			{
				"type": "object",
				"required": ["path", "type"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["localImage"],
						"title": "LocalImageUserInputType"
					}
				},
				"title": "LocalImageUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["skill"],
						"title": "SkillUserInputType"
					}
				},
				"title": "SkillUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mention"],
						"title": "MentionUserInputType"
					}
				},
				"title": "MentionUserInput"
			}
		] },
		"WebSearchAction": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"queries": {
						"type": ["array", "null"],
						"items": { "type": "string" }
					},
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchWebSearchActionType"
					}
				},
				"title": "SearchWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"type": {
						"type": "string",
						"enum": ["openPage"],
						"title": "OpenPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "OpenPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"pattern": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["findInPage"],
						"title": "FindInPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "FindInPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["other"],
					"title": "OtherWebSearchActionType"
				} },
				"title": "OtherWebSearchAction"
			}
		] }
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-generated/json/v2/TurnCompletedNotification.json
var TurnCompletedNotification_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "TurnCompletedNotification",
	type: "object",
	required: ["threadId", "turn"],
	properties: {
		"threadId": { "type": "string" },
		"turn": { "$ref": "#/definitions/Turn" }
	},
	definitions: {
		"AbsolutePathBuf": {
			"description": "A path that is guaranteed to be absolute and normalized (though it is not guaranteed to be canonicalized or exist on the filesystem).\n\nIMPORTANT: When deserializing an `AbsolutePathBuf`, a base path must be set using [AbsolutePathBufGuard::new]. If no base path is set, the deserialization will fail unless the path being deserialized is already absolute.",
			"type": "string"
		},
		"ByteRange": {
			"type": "object",
			"required": ["end", "start"],
			"properties": {
				"end": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				},
				"start": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				}
			}
		},
		"CodexErrorInfo": {
			"description": "This translation layer make sure that we expose codex error code in camel case.\n\nWhen an upstream HTTP status is available (for example, from the Responses API or a provider), it is forwarded in `httpStatusCode` on the relevant `codexErrorInfo` variant.",
			"oneOf": [
				{
					"type": "string",
					"enum": [
						"contextWindowExceeded",
						"usageLimitExceeded",
						"serverOverloaded",
						"cyberPolicy",
						"internalServerError",
						"unauthorized",
						"badRequest",
						"threadRollbackFailed",
						"sandboxError",
						"other"
					]
				},
				{
					"type": "object",
					"required": ["httpConnectionFailed"],
					"properties": { "httpConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "HttpConnectionFailedCodexErrorInfo"
				},
				{
					"description": "Failed to connect to the response SSE stream.",
					"type": "object",
					"required": ["responseStreamConnectionFailed"],
					"properties": { "responseStreamConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamConnectionFailedCodexErrorInfo"
				},
				{
					"description": "The response SSE stream disconnected in the middle of a turn before completion.",
					"type": "object",
					"required": ["responseStreamDisconnected"],
					"properties": { "responseStreamDisconnected": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamDisconnectedCodexErrorInfo"
				},
				{
					"description": "Reached the retry limit for responses.",
					"type": "object",
					"required": ["responseTooManyFailedAttempts"],
					"properties": { "responseTooManyFailedAttempts": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseTooManyFailedAttemptsCodexErrorInfo"
				},
				{
					"description": "Returned when `turn/start` or `turn/steer` is submitted while the current active turn cannot accept same-turn steering, for example `/review` or manual `/compact`.",
					"type": "object",
					"required": ["activeTurnNotSteerable"],
					"properties": { "activeTurnNotSteerable": {
						"type": "object",
						"required": ["turnKind"],
						"properties": { "turnKind": { "$ref": "#/definitions/NonSteerableTurnKind" } }
					} },
					"additionalProperties": false,
					"title": "ActiveTurnNotSteerableCodexErrorInfo"
				}
			]
		},
		"CollabAgentState": {
			"type": "object",
			"required": ["status"],
			"properties": {
				"message": { "type": ["string", "null"] },
				"status": { "$ref": "#/definitions/CollabAgentStatus" }
			}
		},
		"CollabAgentStatus": {
			"type": "string",
			"enum": [
				"pendingInit",
				"running",
				"interrupted",
				"completed",
				"errored",
				"shutdown",
				"notFound"
			]
		},
		"CollabAgentTool": {
			"type": "string",
			"enum": [
				"spawnAgent",
				"sendInput",
				"resumeAgent",
				"wait",
				"closeAgent"
			]
		},
		"CollabAgentToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"CommandAction": { "oneOf": [
			{
				"type": "object",
				"required": [
					"command",
					"name",
					"path",
					"type"
				],
				"properties": {
					"command": { "type": "string" },
					"name": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["read"],
						"title": "ReadCommandActionType"
					}
				},
				"title": "ReadCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["listFiles"],
						"title": "ListFilesCommandActionType"
					}
				},
				"title": "ListFilesCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchCommandActionType"
					}
				},
				"title": "SearchCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["unknown"],
						"title": "UnknownCommandActionType"
					}
				},
				"title": "UnknownCommandAction"
			}
		] },
		"CommandExecutionSource": {
			"type": "string",
			"enum": [
				"agent",
				"userShell",
				"unifiedExecStartup",
				"unifiedExecInteraction"
			]
		},
		"CommandExecutionStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"DynamicToolCallOutputContentItem": { "oneOf": [{
			"type": "object",
			"required": ["text", "type"],
			"properties": {
				"text": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputText"],
					"title": "InputTextDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputTextDynamicToolCallOutputContentItem"
		}, {
			"type": "object",
			"required": ["imageUrl", "type"],
			"properties": {
				"imageUrl": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputImage"],
					"title": "InputImageDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputImageDynamicToolCallOutputContentItem"
		}] },
		"DynamicToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"FileUpdateChange": {
			"type": "object",
			"required": [
				"diff",
				"kind",
				"path"
			],
			"properties": {
				"diff": { "type": "string" },
				"kind": { "$ref": "#/definitions/PatchChangeKind" },
				"path": { "type": "string" }
			}
		},
		"HookPromptFragment": {
			"type": "object",
			"required": ["hookRunId", "text"],
			"properties": {
				"hookRunId": { "type": "string" },
				"text": { "type": "string" }
			}
		},
		"ImageDetail": {
			"type": "string",
			"enum": ["high", "original"]
		},
		"McpToolCallError": {
			"type": "object",
			"required": ["message"],
			"properties": { "message": { "type": "string" } }
		},
		"McpToolCallResult": {
			"type": "object",
			"required": ["content"],
			"properties": {
				"_meta": true,
				"content": {
					"type": "array",
					"items": true
				},
				"structuredContent": true
			}
		},
		"McpToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"MemoryCitation": {
			"type": "object",
			"required": ["entries", "threadIds"],
			"properties": {
				"entries": {
					"type": "array",
					"items": { "$ref": "#/definitions/MemoryCitationEntry" }
				},
				"threadIds": {
					"type": "array",
					"items": { "type": "string" }
				}
			}
		},
		"MemoryCitationEntry": {
			"type": "object",
			"required": [
				"lineEnd",
				"lineStart",
				"note",
				"path"
			],
			"properties": {
				"lineEnd": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"lineStart": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"note": { "type": "string" },
				"path": { "type": "string" }
			}
		},
		"MessagePhase": {
			"description": "Classifies an assistant message as interim commentary or final answer text.\n\nProviders do not emit this consistently, so callers must treat `None` as \"phase unknown\" and keep compatibility behavior for legacy models.",
			"oneOf": [{
				"description": "Mid-turn assistant text (for example preamble/progress narration).\n\nAdditional tool calls or assistant output may follow before turn completion.",
				"type": "string",
				"enum": ["commentary"]
			}, {
				"description": "The assistant's terminal answer text for the current turn.",
				"type": "string",
				"enum": ["final_answer"]
			}]
		},
		"NonSteerableTurnKind": {
			"type": "string",
			"enum": ["review", "compact"]
		},
		"PatchApplyStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"PatchChangeKind": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["add"],
					"title": "AddPatchChangeKindType"
				} },
				"title": "AddPatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["delete"],
					"title": "DeletePatchChangeKindType"
				} },
				"title": "DeletePatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"move_path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["update"],
						"title": "UpdatePatchChangeKindType"
					}
				},
				"title": "UpdatePatchChangeKind"
			}
		] },
		"ReasoningEffort": {
			"description": "See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#get-started-with-reasoning",
			"type": "string",
			"enum": [
				"none",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh"
			]
		},
		"TextElement": {
			"type": "object",
			"required": ["byteRange"],
			"properties": {
				"byteRange": {
					"description": "Byte range in the parent `text` buffer that this element occupies.",
					"allOf": [{ "$ref": "#/definitions/ByteRange" }]
				},
				"placeholder": {
					"description": "Optional human-readable placeholder for the element, displayed in the UI.",
					"type": ["string", "null"]
				}
			}
		},
		"ThreadItem": { "oneOf": [
			{
				"type": "object",
				"required": [
					"content",
					"id",
					"type"
				],
				"properties": {
					"content": {
						"type": "array",
						"items": { "$ref": "#/definitions/UserInput" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["userMessage"],
						"title": "UserMessageThreadItemType"
					}
				},
				"title": "UserMessageThreadItem"
			},
			{
				"type": "object",
				"required": [
					"fragments",
					"id",
					"type"
				],
				"properties": {
					"fragments": {
						"type": "array",
						"items": { "$ref": "#/definitions/HookPromptFragment" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["hookPrompt"],
						"title": "HookPromptThreadItemType"
					}
				},
				"title": "HookPromptThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"memoryCitation": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MemoryCitation" }, { "type": "null" }]
					},
					"phase": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MessagePhase" }, { "type": "null" }]
					},
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["agentMessage"],
						"title": "AgentMessageThreadItemType"
					}
				},
				"title": "AgentMessageThreadItem"
			},
			{
				"description": "EXPERIMENTAL - proposed plan item content. The completed plan item is authoritative and may not match the concatenation of `PlanDelta` text.",
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["plan"],
						"title": "PlanThreadItemType"
					}
				},
				"title": "PlanThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"content": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"id": { "type": "string" },
					"summary": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"type": {
						"type": "string",
						"enum": ["reasoning"],
						"title": "ReasoningThreadItemType"
					}
				},
				"title": "ReasoningThreadItem"
			},
			{
				"type": "object",
				"required": [
					"command",
					"commandActions",
					"cwd",
					"id",
					"status",
					"type"
				],
				"properties": {
					"aggregatedOutput": {
						"description": "The command's output, aggregated from stdout and stderr.",
						"type": ["string", "null"]
					},
					"command": {
						"description": "The command to be executed.",
						"type": "string"
					},
					"commandActions": {
						"description": "A best-effort parsing of the command to understand the action(s) it will perform. This returns a list of CommandAction objects because a single shell command may be composed of many commands piped together.",
						"type": "array",
						"items": { "$ref": "#/definitions/CommandAction" }
					},
					"cwd": {
						"description": "The command's working directory.",
						"allOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }]
					},
					"durationMs": {
						"description": "The duration of the command execution in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"exitCode": {
						"description": "The command's exit code.",
						"type": ["integer", "null"],
						"format": "int32"
					},
					"id": { "type": "string" },
					"processId": {
						"description": "Identifier for the underlying PTY process (when available).",
						"type": ["string", "null"]
					},
					"source": {
						"default": "agent",
						"allOf": [{ "$ref": "#/definitions/CommandExecutionSource" }]
					},
					"status": { "$ref": "#/definitions/CommandExecutionStatus" },
					"type": {
						"type": "string",
						"enum": ["commandExecution"],
						"title": "CommandExecutionThreadItemType"
					}
				},
				"title": "CommandExecutionThreadItem"
			},
			{
				"type": "object",
				"required": [
					"changes",
					"id",
					"status",
					"type"
				],
				"properties": {
					"changes": {
						"type": "array",
						"items": { "$ref": "#/definitions/FileUpdateChange" }
					},
					"id": { "type": "string" },
					"status": { "$ref": "#/definitions/PatchApplyStatus" },
					"type": {
						"type": "string",
						"enum": ["fileChange"],
						"title": "FileChangeThreadItemType"
					}
				},
				"title": "FileChangeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"server",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"durationMs": {
						"description": "The duration of the MCP tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"error": { "anyOf": [{ "$ref": "#/definitions/McpToolCallError" }, { "type": "null" }] },
					"id": { "type": "string" },
					"mcpAppResourceUri": { "type": ["string", "null"] },
					"result": { "anyOf": [{ "$ref": "#/definitions/McpToolCallResult" }, { "type": "null" }] },
					"server": { "type": "string" },
					"status": { "$ref": "#/definitions/McpToolCallStatus" },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mcpToolCall"],
						"title": "McpToolCallThreadItemType"
					}
				},
				"title": "McpToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"contentItems": {
						"type": ["array", "null"],
						"items": { "$ref": "#/definitions/DynamicToolCallOutputContentItem" }
					},
					"durationMs": {
						"description": "The duration of the dynamic tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"id": { "type": "string" },
					"namespace": { "type": ["string", "null"] },
					"status": { "$ref": "#/definitions/DynamicToolCallStatus" },
					"success": { "type": ["boolean", "null"] },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["dynamicToolCall"],
						"title": "DynamicToolCallThreadItemType"
					}
				},
				"title": "DynamicToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"agentsStates",
					"id",
					"receiverThreadIds",
					"senderThreadId",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"agentsStates": {
						"description": "Last known status of the target agents, when available.",
						"type": "object",
						"additionalProperties": { "$ref": "#/definitions/CollabAgentState" }
					},
					"id": {
						"description": "Unique identifier for this collab tool call.",
						"type": "string"
					},
					"model": {
						"description": "Model requested for the spawned agent, when applicable.",
						"type": ["string", "null"]
					},
					"prompt": {
						"description": "Prompt text sent as part of the collab tool call, when available.",
						"type": ["string", "null"]
					},
					"reasoningEffort": {
						"description": "Reasoning effort requested for the spawned agent, when applicable.",
						"anyOf": [{ "$ref": "#/definitions/ReasoningEffort" }, { "type": "null" }]
					},
					"receiverThreadIds": {
						"description": "Thread ID of the receiving agent, when applicable. In case of spawn operation, this corresponds to the newly spawned agent.",
						"type": "array",
						"items": { "type": "string" }
					},
					"senderThreadId": {
						"description": "Thread ID of the agent issuing the collab request.",
						"type": "string"
					},
					"status": {
						"description": "Current status of the collab tool call.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentToolCallStatus" }]
					},
					"tool": {
						"description": "Name of the collab tool that was invoked.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentTool" }]
					},
					"type": {
						"type": "string",
						"enum": ["collabAgentToolCall"],
						"title": "CollabAgentToolCallThreadItemType"
					}
				},
				"title": "CollabAgentToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"query",
					"type"
				],
				"properties": {
					"action": { "anyOf": [{ "$ref": "#/definitions/WebSearchAction" }, { "type": "null" }] },
					"id": { "type": "string" },
					"query": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["webSearch"],
						"title": "WebSearchThreadItemType"
					}
				},
				"title": "WebSearchThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"path",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["imageView"],
						"title": "ImageViewThreadItemType"
					}
				},
				"title": "ImageViewThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"result",
					"status",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"result": { "type": "string" },
					"revisedPrompt": { "type": ["string", "null"] },
					"savedPath": { "anyOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }, { "type": "null" }] },
					"status": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["imageGeneration"],
						"title": "ImageGenerationThreadItemType"
					}
				},
				"title": "ImageGenerationThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["enteredReviewMode"],
						"title": "EnteredReviewModeThreadItemType"
					}
				},
				"title": "EnteredReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["exitedReviewMode"],
						"title": "ExitedReviewModeThreadItemType"
					}
				},
				"title": "ExitedReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["contextCompaction"],
						"title": "ContextCompactionThreadItemType"
					}
				},
				"title": "ContextCompactionThreadItem"
			}
		] },
		"Turn": {
			"type": "object",
			"required": [
				"id",
				"items",
				"status"
			],
			"properties": {
				"completedAt": {
					"description": "Unix timestamp (in seconds) when the turn completed.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"durationMs": {
					"description": "Duration between turn start and completion in milliseconds, if known.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"error": {
					"description": "Only populated when the Turn's status is failed.",
					"anyOf": [{ "$ref": "#/definitions/TurnError" }, { "type": "null" }]
				},
				"id": { "type": "string" },
				"items": {
					"description": "Thread items currently included in this turn payload.",
					"type": "array",
					"items": { "$ref": "#/definitions/ThreadItem" }
				},
				"itemsView": {
					"description": "Describes how much of `items` has been loaded for this turn.",
					"default": "full",
					"allOf": [{ "$ref": "#/definitions/TurnItemsView" }]
				},
				"startedAt": {
					"description": "Unix timestamp (in seconds) when the turn started.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"status": { "$ref": "#/definitions/TurnStatus" }
			}
		},
		"TurnError": {
			"type": "object",
			"required": ["message"],
			"properties": {
				"additionalDetails": {
					"default": null,
					"type": ["string", "null"]
				},
				"codexErrorInfo": { "anyOf": [{ "$ref": "#/definitions/CodexErrorInfo" }, { "type": "null" }] },
				"message": { "type": "string" }
			}
		},
		"TurnItemsView": { "oneOf": [
			{
				"description": "`items` was not loaded for this turn. The field is intentionally empty.",
				"type": "string",
				"enum": ["notLoaded"]
			},
			{
				"description": "`items` contains only a display summary for this turn.",
				"type": "string",
				"enum": ["summary"]
			},
			{
				"description": "`items` contains every ThreadItem available from persisted app-server history for this turn.",
				"type": "string",
				"enum": ["full"]
			}
		] },
		"TurnStatus": {
			"type": "string",
			"enum": [
				"completed",
				"interrupted",
				"failed",
				"inProgress"
			]
		},
		"UserInput": { "oneOf": [
			{
				"type": "object",
				"required": ["text", "type"],
				"properties": {
					"text": { "type": "string" },
					"text_elements": {
						"description": "UI-defined spans within `text` used to render or persist special elements.",
						"default": [],
						"type": "array",
						"items": { "$ref": "#/definitions/TextElement" }
					},
					"type": {
						"type": "string",
						"enum": ["text"],
						"title": "TextUserInputType"
					}
				},
				"title": "TextUserInput"
			},
			{
				"type": "object",
				"required": ["type", "url"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"type": {
						"type": "string",
						"enum": ["image"],
						"title": "ImageUserInputType"
					},
					"url": { "type": "string" }
				},
				"title": "ImageUserInput"
			},
			{
				"type": "object",
				"required": ["path", "type"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["localImage"],
						"title": "LocalImageUserInputType"
					}
				},
				"title": "LocalImageUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["skill"],
						"title": "SkillUserInputType"
					}
				},
				"title": "SkillUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mention"],
						"title": "MentionUserInputType"
					}
				},
				"title": "MentionUserInput"
			}
		] },
		"WebSearchAction": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"queries": {
						"type": ["array", "null"],
						"items": { "type": "string" }
					},
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchWebSearchActionType"
					}
				},
				"title": "SearchWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"type": {
						"type": "string",
						"enum": ["openPage"],
						"title": "OpenPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "OpenPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"pattern": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["findInPage"],
						"title": "FindInPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "FindInPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["other"],
					"title": "OtherWebSearchActionType"
				} },
				"title": "OtherWebSearchAction"
			}
		] }
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-generated/json/v2/TurnStartResponse.json
var TurnStartResponse_default = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "TurnStartResponse",
	type: "object",
	required: ["turn"],
	properties: { "turn": { "$ref": "#/definitions/Turn" } },
	definitions: {
		"AbsolutePathBuf": {
			"description": "A path that is guaranteed to be absolute and normalized (though it is not guaranteed to be canonicalized or exist on the filesystem).\n\nIMPORTANT: When deserializing an `AbsolutePathBuf`, a base path must be set using [AbsolutePathBufGuard::new]. If no base path is set, the deserialization will fail unless the path being deserialized is already absolute.",
			"type": "string"
		},
		"ByteRange": {
			"type": "object",
			"required": ["end", "start"],
			"properties": {
				"end": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				},
				"start": {
					"type": "integer",
					"format": "uint",
					"minimum": 0
				}
			}
		},
		"CodexErrorInfo": {
			"description": "This translation layer make sure that we expose codex error code in camel case.\n\nWhen an upstream HTTP status is available (for example, from the Responses API or a provider), it is forwarded in `httpStatusCode` on the relevant `codexErrorInfo` variant.",
			"oneOf": [
				{
					"type": "string",
					"enum": [
						"contextWindowExceeded",
						"usageLimitExceeded",
						"serverOverloaded",
						"cyberPolicy",
						"internalServerError",
						"unauthorized",
						"badRequest",
						"threadRollbackFailed",
						"sandboxError",
						"other"
					]
				},
				{
					"type": "object",
					"required": ["httpConnectionFailed"],
					"properties": { "httpConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "HttpConnectionFailedCodexErrorInfo"
				},
				{
					"description": "Failed to connect to the response SSE stream.",
					"type": "object",
					"required": ["responseStreamConnectionFailed"],
					"properties": { "responseStreamConnectionFailed": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamConnectionFailedCodexErrorInfo"
				},
				{
					"description": "The response SSE stream disconnected in the middle of a turn before completion.",
					"type": "object",
					"required": ["responseStreamDisconnected"],
					"properties": { "responseStreamDisconnected": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseStreamDisconnectedCodexErrorInfo"
				},
				{
					"description": "Reached the retry limit for responses.",
					"type": "object",
					"required": ["responseTooManyFailedAttempts"],
					"properties": { "responseTooManyFailedAttempts": {
						"type": "object",
						"properties": { "httpStatusCode": {
							"type": ["integer", "null"],
							"format": "uint16",
							"minimum": 0
						} }
					} },
					"additionalProperties": false,
					"title": "ResponseTooManyFailedAttemptsCodexErrorInfo"
				},
				{
					"description": "Returned when `turn/start` or `turn/steer` is submitted while the current active turn cannot accept same-turn steering, for example `/review` or manual `/compact`.",
					"type": "object",
					"required": ["activeTurnNotSteerable"],
					"properties": { "activeTurnNotSteerable": {
						"type": "object",
						"required": ["turnKind"],
						"properties": { "turnKind": { "$ref": "#/definitions/NonSteerableTurnKind" } }
					} },
					"additionalProperties": false,
					"title": "ActiveTurnNotSteerableCodexErrorInfo"
				}
			]
		},
		"CollabAgentState": {
			"type": "object",
			"required": ["status"],
			"properties": {
				"message": { "type": ["string", "null"] },
				"status": { "$ref": "#/definitions/CollabAgentStatus" }
			}
		},
		"CollabAgentStatus": {
			"type": "string",
			"enum": [
				"pendingInit",
				"running",
				"interrupted",
				"completed",
				"errored",
				"shutdown",
				"notFound"
			]
		},
		"CollabAgentTool": {
			"type": "string",
			"enum": [
				"spawnAgent",
				"sendInput",
				"resumeAgent",
				"wait",
				"closeAgent"
			]
		},
		"CollabAgentToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"CommandAction": { "oneOf": [
			{
				"type": "object",
				"required": [
					"command",
					"name",
					"path",
					"type"
				],
				"properties": {
					"command": { "type": "string" },
					"name": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["read"],
						"title": "ReadCommandActionType"
					}
				},
				"title": "ReadCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["listFiles"],
						"title": "ListFilesCommandActionType"
					}
				},
				"title": "ListFilesCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"path": { "type": ["string", "null"] },
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchCommandActionType"
					}
				},
				"title": "SearchCommandAction"
			},
			{
				"type": "object",
				"required": ["command", "type"],
				"properties": {
					"command": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["unknown"],
						"title": "UnknownCommandActionType"
					}
				},
				"title": "UnknownCommandAction"
			}
		] },
		"CommandExecutionSource": {
			"type": "string",
			"enum": [
				"agent",
				"userShell",
				"unifiedExecStartup",
				"unifiedExecInteraction"
			]
		},
		"CommandExecutionStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"DynamicToolCallOutputContentItem": { "oneOf": [{
			"type": "object",
			"required": ["text", "type"],
			"properties": {
				"text": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputText"],
					"title": "InputTextDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputTextDynamicToolCallOutputContentItem"
		}, {
			"type": "object",
			"required": ["imageUrl", "type"],
			"properties": {
				"imageUrl": { "type": "string" },
				"type": {
					"type": "string",
					"enum": ["inputImage"],
					"title": "InputImageDynamicToolCallOutputContentItemType"
				}
			},
			"title": "InputImageDynamicToolCallOutputContentItem"
		}] },
		"DynamicToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"FileUpdateChange": {
			"type": "object",
			"required": [
				"diff",
				"kind",
				"path"
			],
			"properties": {
				"diff": { "type": "string" },
				"kind": { "$ref": "#/definitions/PatchChangeKind" },
				"path": { "type": "string" }
			}
		},
		"HookPromptFragment": {
			"type": "object",
			"required": ["hookRunId", "text"],
			"properties": {
				"hookRunId": { "type": "string" },
				"text": { "type": "string" }
			}
		},
		"ImageDetail": {
			"type": "string",
			"enum": ["high", "original"]
		},
		"McpToolCallError": {
			"type": "object",
			"required": ["message"],
			"properties": { "message": { "type": "string" } }
		},
		"McpToolCallResult": {
			"type": "object",
			"required": ["content"],
			"properties": {
				"_meta": true,
				"content": {
					"type": "array",
					"items": true
				},
				"structuredContent": true
			}
		},
		"McpToolCallStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed"
			]
		},
		"MemoryCitation": {
			"type": "object",
			"required": ["entries", "threadIds"],
			"properties": {
				"entries": {
					"type": "array",
					"items": { "$ref": "#/definitions/MemoryCitationEntry" }
				},
				"threadIds": {
					"type": "array",
					"items": { "type": "string" }
				}
			}
		},
		"MemoryCitationEntry": {
			"type": "object",
			"required": [
				"lineEnd",
				"lineStart",
				"note",
				"path"
			],
			"properties": {
				"lineEnd": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"lineStart": {
					"type": "integer",
					"format": "uint32",
					"minimum": 0
				},
				"note": { "type": "string" },
				"path": { "type": "string" }
			}
		},
		"MessagePhase": {
			"description": "Classifies an assistant message as interim commentary or final answer text.\n\nProviders do not emit this consistently, so callers must treat `None` as \"phase unknown\" and keep compatibility behavior for legacy models.",
			"oneOf": [{
				"description": "Mid-turn assistant text (for example preamble/progress narration).\n\nAdditional tool calls or assistant output may follow before turn completion.",
				"type": "string",
				"enum": ["commentary"]
			}, {
				"description": "The assistant's terminal answer text for the current turn.",
				"type": "string",
				"enum": ["final_answer"]
			}]
		},
		"NonSteerableTurnKind": {
			"type": "string",
			"enum": ["review", "compact"]
		},
		"PatchApplyStatus": {
			"type": "string",
			"enum": [
				"inProgress",
				"completed",
				"failed",
				"declined"
			]
		},
		"PatchChangeKind": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["add"],
					"title": "AddPatchChangeKindType"
				} },
				"title": "AddPatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["delete"],
					"title": "DeletePatchChangeKindType"
				} },
				"title": "DeletePatchChangeKind"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"move_path": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["update"],
						"title": "UpdatePatchChangeKindType"
					}
				},
				"title": "UpdatePatchChangeKind"
			}
		] },
		"ReasoningEffort": {
			"description": "See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#get-started-with-reasoning",
			"type": "string",
			"enum": [
				"none",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh"
			]
		},
		"TextElement": {
			"type": "object",
			"required": ["byteRange"],
			"properties": {
				"byteRange": {
					"description": "Byte range in the parent `text` buffer that this element occupies.",
					"allOf": [{ "$ref": "#/definitions/ByteRange" }]
				},
				"placeholder": {
					"description": "Optional human-readable placeholder for the element, displayed in the UI.",
					"type": ["string", "null"]
				}
			}
		},
		"ThreadItem": { "oneOf": [
			{
				"type": "object",
				"required": [
					"content",
					"id",
					"type"
				],
				"properties": {
					"content": {
						"type": "array",
						"items": { "$ref": "#/definitions/UserInput" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["userMessage"],
						"title": "UserMessageThreadItemType"
					}
				},
				"title": "UserMessageThreadItem"
			},
			{
				"type": "object",
				"required": [
					"fragments",
					"id",
					"type"
				],
				"properties": {
					"fragments": {
						"type": "array",
						"items": { "$ref": "#/definitions/HookPromptFragment" }
					},
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["hookPrompt"],
						"title": "HookPromptThreadItemType"
					}
				},
				"title": "HookPromptThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"memoryCitation": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MemoryCitation" }, { "type": "null" }]
					},
					"phase": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/MessagePhase" }, { "type": "null" }]
					},
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["agentMessage"],
						"title": "AgentMessageThreadItemType"
					}
				},
				"title": "AgentMessageThreadItem"
			},
			{
				"description": "EXPERIMENTAL - proposed plan item content. The completed plan item is authoritative and may not match the concatenation of `PlanDelta` text.",
				"type": "object",
				"required": [
					"id",
					"text",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"text": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["plan"],
						"title": "PlanThreadItemType"
					}
				},
				"title": "PlanThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"content": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"id": { "type": "string" },
					"summary": {
						"default": [],
						"type": "array",
						"items": { "type": "string" }
					},
					"type": {
						"type": "string",
						"enum": ["reasoning"],
						"title": "ReasoningThreadItemType"
					}
				},
				"title": "ReasoningThreadItem"
			},
			{
				"type": "object",
				"required": [
					"command",
					"commandActions",
					"cwd",
					"id",
					"status",
					"type"
				],
				"properties": {
					"aggregatedOutput": {
						"description": "The command's output, aggregated from stdout and stderr.",
						"type": ["string", "null"]
					},
					"command": {
						"description": "The command to be executed.",
						"type": "string"
					},
					"commandActions": {
						"description": "A best-effort parsing of the command to understand the action(s) it will perform. This returns a list of CommandAction objects because a single shell command may be composed of many commands piped together.",
						"type": "array",
						"items": { "$ref": "#/definitions/CommandAction" }
					},
					"cwd": {
						"description": "The command's working directory.",
						"allOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }]
					},
					"durationMs": {
						"description": "The duration of the command execution in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"exitCode": {
						"description": "The command's exit code.",
						"type": ["integer", "null"],
						"format": "int32"
					},
					"id": { "type": "string" },
					"processId": {
						"description": "Identifier for the underlying PTY process (when available).",
						"type": ["string", "null"]
					},
					"source": {
						"default": "agent",
						"allOf": [{ "$ref": "#/definitions/CommandExecutionSource" }]
					},
					"status": { "$ref": "#/definitions/CommandExecutionStatus" },
					"type": {
						"type": "string",
						"enum": ["commandExecution"],
						"title": "CommandExecutionThreadItemType"
					}
				},
				"title": "CommandExecutionThreadItem"
			},
			{
				"type": "object",
				"required": [
					"changes",
					"id",
					"status",
					"type"
				],
				"properties": {
					"changes": {
						"type": "array",
						"items": { "$ref": "#/definitions/FileUpdateChange" }
					},
					"id": { "type": "string" },
					"status": { "$ref": "#/definitions/PatchApplyStatus" },
					"type": {
						"type": "string",
						"enum": ["fileChange"],
						"title": "FileChangeThreadItemType"
					}
				},
				"title": "FileChangeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"server",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"durationMs": {
						"description": "The duration of the MCP tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"error": { "anyOf": [{ "$ref": "#/definitions/McpToolCallError" }, { "type": "null" }] },
					"id": { "type": "string" },
					"mcpAppResourceUri": { "type": ["string", "null"] },
					"result": { "anyOf": [{ "$ref": "#/definitions/McpToolCallResult" }, { "type": "null" }] },
					"server": { "type": "string" },
					"status": { "$ref": "#/definitions/McpToolCallStatus" },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mcpToolCall"],
						"title": "McpToolCallThreadItemType"
					}
				},
				"title": "McpToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"arguments",
					"id",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"arguments": true,
					"contentItems": {
						"type": ["array", "null"],
						"items": { "$ref": "#/definitions/DynamicToolCallOutputContentItem" }
					},
					"durationMs": {
						"description": "The duration of the dynamic tool call in milliseconds.",
						"type": ["integer", "null"],
						"format": "int64"
					},
					"id": { "type": "string" },
					"namespace": { "type": ["string", "null"] },
					"status": { "$ref": "#/definitions/DynamicToolCallStatus" },
					"success": { "type": ["boolean", "null"] },
					"tool": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["dynamicToolCall"],
						"title": "DynamicToolCallThreadItemType"
					}
				},
				"title": "DynamicToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"agentsStates",
					"id",
					"receiverThreadIds",
					"senderThreadId",
					"status",
					"tool",
					"type"
				],
				"properties": {
					"agentsStates": {
						"description": "Last known status of the target agents, when available.",
						"type": "object",
						"additionalProperties": { "$ref": "#/definitions/CollabAgentState" }
					},
					"id": {
						"description": "Unique identifier for this collab tool call.",
						"type": "string"
					},
					"model": {
						"description": "Model requested for the spawned agent, when applicable.",
						"type": ["string", "null"]
					},
					"prompt": {
						"description": "Prompt text sent as part of the collab tool call, when available.",
						"type": ["string", "null"]
					},
					"reasoningEffort": {
						"description": "Reasoning effort requested for the spawned agent, when applicable.",
						"anyOf": [{ "$ref": "#/definitions/ReasoningEffort" }, { "type": "null" }]
					},
					"receiverThreadIds": {
						"description": "Thread ID of the receiving agent, when applicable. In case of spawn operation, this corresponds to the newly spawned agent.",
						"type": "array",
						"items": { "type": "string" }
					},
					"senderThreadId": {
						"description": "Thread ID of the agent issuing the collab request.",
						"type": "string"
					},
					"status": {
						"description": "Current status of the collab tool call.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentToolCallStatus" }]
					},
					"tool": {
						"description": "Name of the collab tool that was invoked.",
						"allOf": [{ "$ref": "#/definitions/CollabAgentTool" }]
					},
					"type": {
						"type": "string",
						"enum": ["collabAgentToolCall"],
						"title": "CollabAgentToolCallThreadItemType"
					}
				},
				"title": "CollabAgentToolCallThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"query",
					"type"
				],
				"properties": {
					"action": { "anyOf": [{ "$ref": "#/definitions/WebSearchAction" }, { "type": "null" }] },
					"id": { "type": "string" },
					"query": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["webSearch"],
						"title": "WebSearchThreadItemType"
					}
				},
				"title": "WebSearchThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"path",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"path": { "$ref": "#/definitions/AbsolutePathBuf" },
					"type": {
						"type": "string",
						"enum": ["imageView"],
						"title": "ImageViewThreadItemType"
					}
				},
				"title": "ImageViewThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"result",
					"status",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"result": { "type": "string" },
					"revisedPrompt": { "type": ["string", "null"] },
					"savedPath": { "anyOf": [{ "$ref": "#/definitions/AbsolutePathBuf" }, { "type": "null" }] },
					"status": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["imageGeneration"],
						"title": "ImageGenerationThreadItemType"
					}
				},
				"title": "ImageGenerationThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["enteredReviewMode"],
						"title": "EnteredReviewModeThreadItemType"
					}
				},
				"title": "EnteredReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": [
					"id",
					"review",
					"type"
				],
				"properties": {
					"id": { "type": "string" },
					"review": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["exitedReviewMode"],
						"title": "ExitedReviewModeThreadItemType"
					}
				},
				"title": "ExitedReviewModeThreadItem"
			},
			{
				"type": "object",
				"required": ["id", "type"],
				"properties": {
					"id": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["contextCompaction"],
						"title": "ContextCompactionThreadItemType"
					}
				},
				"title": "ContextCompactionThreadItem"
			}
		] },
		"Turn": {
			"type": "object",
			"required": [
				"id",
				"items",
				"status"
			],
			"properties": {
				"completedAt": {
					"description": "Unix timestamp (in seconds) when the turn completed.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"durationMs": {
					"description": "Duration between turn start and completion in milliseconds, if known.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"error": {
					"description": "Only populated when the Turn's status is failed.",
					"anyOf": [{ "$ref": "#/definitions/TurnError" }, { "type": "null" }]
				},
				"id": { "type": "string" },
				"items": {
					"description": "Thread items currently included in this turn payload.",
					"type": "array",
					"items": { "$ref": "#/definitions/ThreadItem" }
				},
				"itemsView": {
					"description": "Describes how much of `items` has been loaded for this turn.",
					"default": "full",
					"allOf": [{ "$ref": "#/definitions/TurnItemsView" }]
				},
				"startedAt": {
					"description": "Unix timestamp (in seconds) when the turn started.",
					"type": ["integer", "null"],
					"format": "int64"
				},
				"status": { "$ref": "#/definitions/TurnStatus" }
			}
		},
		"TurnError": {
			"type": "object",
			"required": ["message"],
			"properties": {
				"additionalDetails": {
					"default": null,
					"type": ["string", "null"]
				},
				"codexErrorInfo": { "anyOf": [{ "$ref": "#/definitions/CodexErrorInfo" }, { "type": "null" }] },
				"message": { "type": "string" }
			}
		},
		"TurnItemsView": { "oneOf": [
			{
				"description": "`items` was not loaded for this turn. The field is intentionally empty.",
				"type": "string",
				"enum": ["notLoaded"]
			},
			{
				"description": "`items` contains only a display summary for this turn.",
				"type": "string",
				"enum": ["summary"]
			},
			{
				"description": "`items` contains every ThreadItem available from persisted app-server history for this turn.",
				"type": "string",
				"enum": ["full"]
			}
		] },
		"TurnStatus": {
			"type": "string",
			"enum": [
				"completed",
				"interrupted",
				"failed",
				"inProgress"
			]
		},
		"UserInput": { "oneOf": [
			{
				"type": "object",
				"required": ["text", "type"],
				"properties": {
					"text": { "type": "string" },
					"text_elements": {
						"description": "UI-defined spans within `text` used to render or persist special elements.",
						"default": [],
						"type": "array",
						"items": { "$ref": "#/definitions/TextElement" }
					},
					"type": {
						"type": "string",
						"enum": ["text"],
						"title": "TextUserInputType"
					}
				},
				"title": "TextUserInput"
			},
			{
				"type": "object",
				"required": ["type", "url"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"type": {
						"type": "string",
						"enum": ["image"],
						"title": "ImageUserInputType"
					},
					"url": { "type": "string" }
				},
				"title": "ImageUserInput"
			},
			{
				"type": "object",
				"required": ["path", "type"],
				"properties": {
					"detail": {
						"default": null,
						"anyOf": [{ "$ref": "#/definitions/ImageDetail" }, { "type": "null" }]
					},
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["localImage"],
						"title": "LocalImageUserInputType"
					}
				},
				"title": "LocalImageUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["skill"],
						"title": "SkillUserInputType"
					}
				},
				"title": "SkillUserInput"
			},
			{
				"type": "object",
				"required": [
					"name",
					"path",
					"type"
				],
				"properties": {
					"name": { "type": "string" },
					"path": { "type": "string" },
					"type": {
						"type": "string",
						"enum": ["mention"],
						"title": "MentionUserInputType"
					}
				},
				"title": "MentionUserInput"
			}
		] },
		"WebSearchAction": { "oneOf": [
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"queries": {
						"type": ["array", "null"],
						"items": { "type": "string" }
					},
					"query": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["search"],
						"title": "SearchWebSearchActionType"
					}
				},
				"title": "SearchWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"type": {
						"type": "string",
						"enum": ["openPage"],
						"title": "OpenPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "OpenPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": {
					"pattern": { "type": ["string", "null"] },
					"type": {
						"type": "string",
						"enum": ["findInPage"],
						"title": "FindInPageWebSearchActionType"
					},
					"url": { "type": ["string", "null"] }
				},
				"title": "FindInPageWebSearchAction"
			},
			{
				"type": "object",
				"required": ["type"],
				"properties": { "type": {
					"type": "string",
					"enum": ["other"],
					"title": "OtherWebSearchActionType"
				} },
				"title": "OtherWebSearchAction"
			}
		] }
	}
};
//#endregion
//#region extensions/codex/src/app-server/protocol-validators.ts
function compileCodexSchema(schema) {
	const validator = Compile(normalizeJsonSchemaNode(schema));
	return {
		check: (value) => validator.Check(value),
		errors: (value) => [...validator.Errors(value)]
	};
}
function isRecord(value) {
	return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
const schemaMapKeywords = new Set([
	"$defs",
	"definitions",
	"dependentSchemas",
	"patternProperties",
	"properties"
]);
const schemaValueKeywords = new Set([
	"additionalItems",
	"additionalProperties",
	"contains",
	"else",
	"if",
	"items",
	"not",
	"propertyNames",
	"then",
	"unevaluatedItems",
	"unevaluatedProperties"
]);
const schemaArrayKeywords = new Set([
	"allOf",
	"anyOf",
	"oneOf",
	"prefixItems"
]);
function schemaTypeIncludes(schema, type) {
	return schema.type === type || Array.isArray(schema.type) && schema.type.includes(type);
}
function normalizeSchemaMap(value) {
	if (!isRecord(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeJsonSchemaNode(entry)]));
}
function expandJsonSchemaTypeArray(schema) {
	const { type, ...rest } = schema;
	if (!Array.isArray(type)) return schema;
	return { anyOf: type.map((entry) => Object.assign({}, rest, { type: entry })) };
}
function normalizeJsonSchemaNode(schema) {
	if (Array.isArray(schema)) return schema.map((entry) => normalizeJsonSchemaNode(entry));
	if (!isRecord(schema)) return schema;
	const normalizedSchema = expandJsonSchemaTypeArray(schema);
	return Object.fromEntries(Object.entries(normalizedSchema).map(([key, value]) => {
		if (schemaMapKeywords.has(key)) return [key, normalizeSchemaMap(value)];
		if (schemaValueKeywords.has(key) || schemaArrayKeywords.has(key)) return [key, normalizeJsonSchemaNode(value)];
		return [key, value];
	}));
}
function readDefault(schema) {
	if (!isRecord(schema) || !Object.prototype.hasOwnProperty.call(schema, "default")) return;
	return structuredClone(schema.default);
}
function decodePointerSegment(segment) {
	return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}
function resolveLocalRef(root, ref) {
	if (ref === "#") return root;
	if (!ref.startsWith("#/")) return;
	let current = root;
	for (const segment of ref.slice(2).split("/").map(decodePointerSegment)) {
		if (!isRecord(current)) return;
		current = current[segment];
	}
	return current;
}
function applySchemaDefaults(schema, value, root = schema, resolvingRefs = /* @__PURE__ */ new Set()) {
	if (value === void 0) {
		const defaultValue = readDefault(schema);
		if (defaultValue !== void 0) return defaultValue;
	}
	if (!isRecord(schema)) return value;
	let nextValue = value;
	if (typeof schema.$ref === "string" && !resolvingRefs.has(schema.$ref)) {
		const target = resolveLocalRef(root, schema.$ref);
		if (target !== void 0) {
			resolvingRefs.add(schema.$ref);
			nextValue = applySchemaDefaults(target, nextValue, root, resolvingRefs);
			resolvingRefs.delete(schema.$ref);
		}
	}
	for (const key of ["allOf"]) {
		const branches = schema[key];
		if (Array.isArray(branches)) for (const branch of branches) nextValue = applySchemaDefaults(branch, nextValue, root, resolvingRefs);
	}
	if (schemaTypeIncludes(schema, "object") && isRecord(nextValue) && isRecord(schema.properties)) {
		for (const [key, propertySchema] of Object.entries(schema.properties)) {
			const currentValue = nextValue[key];
			const defaultedValue = applySchemaDefaults(propertySchema, currentValue, root, resolvingRefs);
			if (defaultedValue !== void 0 && defaultedValue !== currentValue) nextValue[key] = defaultedValue;
		}
		if (isRecord(schema.additionalProperties)) for (const key of Object.keys(nextValue)) {
			if (Object.prototype.hasOwnProperty.call(schema.properties, key)) continue;
			nextValue[key] = applySchemaDefaults(schema.additionalProperties, nextValue[key], root, resolvingRefs);
		}
	}
	if (schemaTypeIncludes(schema, "array") && Array.isArray(nextValue) && isRecord(schema.items)) return nextValue.map((entry) => applySchemaDefaults(schema.items, entry, root, resolvingRefs));
	return nextValue;
}
function normalizeWithDefaults(schema, value) {
	if (value === void 0 || value === null) return value;
	return applySchemaDefaults(schema, structuredClone(value));
}
const validateDynamicToolCallParams = compileCodexSchema(DynamicToolCallParams_default);
const validateErrorNotification = compileCodexSchema(ErrorNotification_default);
const validateModelListResponse = compileCodexSchema(ModelListResponse_default);
const validateThreadResumeResponse = compileCodexSchema(ThreadResumeResponse_default);
const validateThreadStartResponse = compileCodexSchema(ThreadStartResponse_default);
const validateTurnCompletedNotification = compileCodexSchema(TurnCompletedNotification_default);
const validateTurnStartResponse = compileCodexSchema(TurnStartResponse_default);
function assertCodexThreadStartResponse(value) {
	return assertCodexShape(validateThreadStartResponse, normalizeWithDefaults(ThreadStartResponse_default, normalizeThreadResponse(value)), "thread/start response");
}
function assertCodexThreadForkResponse(value) {
	return assertCodexShape(validateThreadStartResponse, normalizeWithDefaults(ThreadStartResponse_default, normalizeThreadResponse(value)), "thread/fork response");
}
function assertCodexThreadResumeResponse(value) {
	return assertCodexShape(validateThreadResumeResponse, normalizeWithDefaults(ThreadResumeResponse_default, normalizeThreadResponse(value)), "thread/resume response");
}
function assertCodexTurnStartResponse(value) {
	return assertCodexShape(validateTurnStartResponse, normalizeWithDefaults(TurnStartResponse_default, normalizeTurnStartResponse(value)), "turn/start response");
}
function readCodexDynamicToolCallParams(value) {
	return readCodexShape(validateDynamicToolCallParams, normalizeWithDefaults(DynamicToolCallParams_default, value));
}
function readCodexErrorNotification(value) {
	return readCodexShape(validateErrorNotification, normalizeWithDefaults(ErrorNotification_default, value));
}
function readCodexModelListResponse(value) {
	return readCodexShape(validateModelListResponse, normalizeWithDefaults(ModelListResponse_default, value));
}
function readCodexTurn(value) {
	return readCodexShape(validateTurnStartResponse, normalizeWithDefaults(TurnStartResponse_default, { turn: normalizeTurn(value) }))?.turn;
}
function readCodexTurnCompletedNotification(value) {
	return readCodexShape(validateTurnCompletedNotification, normalizeWithDefaults(TurnCompletedNotification_default, normalizeTurnCompletedNotification(value)));
}
function assertCodexShape(validate, value, label) {
	if (validate.check(value)) return value;
	throw new Error(`Invalid Codex app-server ${label}: ${formatValidationErrors(validate, value)}`);
}
function readCodexShape(validate, value) {
	return validate.check(value) ? value : void 0;
}
function normalizeTurn(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return value;
	return {
		error: null,
		startedAt: null,
		completedAt: null,
		durationMs: null,
		...value,
		items: Array.isArray(value.items) ? value.items.map(normalizeThreadItem) : []
	};
}
function normalizeThreadItem(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return value;
	switch (value.type) {
		case "agentMessage": return {
			phase: null,
			memoryCitation: null,
			...value
		};
		case "plan": return {
			text: "",
			...value
		};
		case "reasoning": return {
			summary: [],
			content: [],
			...value
		};
		case "dynamicToolCall": return {
			namespace: null,
			arguments: null,
			status: "completed",
			contentItems: null,
			success: null,
			durationMs: null,
			...value
		};
		default: return value;
	}
}
function normalizeThreadResponse(value) {
	if (!value || typeof value !== "object" || Array.isArray(value) || !("thread" in value)) return value;
	const thread = value.thread;
	if (thread && typeof thread === "object" && !Array.isArray(thread)) {
		const t = thread;
		if (typeof t.id === "string" && typeof t.sessionId !== "string") return {
			...value,
			thread: {
				...thread,
				sessionId: t.id
			}
		};
		if (typeof t.sessionId === "string" && typeof t.id !== "string") return {
			...value,
			thread: {
				...thread,
				id: t.sessionId
			}
		};
	}
	return value;
}
function normalizeTurnStartResponse(value) {
	if (!value || typeof value !== "object" || Array.isArray(value) || !("turn" in value)) return value;
	return {
		...value,
		turn: normalizeTurn(value.turn)
	};
}
function normalizeTurnCompletedNotification(value) {
	if (!value || typeof value !== "object" || Array.isArray(value) || !("turn" in value)) return value;
	return {
		...value,
		turn: normalizeTurn(value.turn)
	};
}
function formatValidationErrors(validate, value) {
	const errors = validate.errors(value);
	if (!errors || errors.length === 0) return "schema validation failed";
	return errors.map((error) => {
		const message = error.message?.trim() || "schema validation failed";
		return error.instancePath ? `${error.instancePath} ${message}` : message;
	}).join("; ");
}
//#endregion
export { readCodexDynamicToolCallParams as a, readCodexTurn as c, assertCodexTurnStartResponse as i, readCodexTurnCompletedNotification as l, assertCodexThreadResumeResponse as n, readCodexErrorNotification as o, assertCodexThreadStartResponse as r, readCodexModelListResponse as s, assertCodexThreadForkResponse as t };
