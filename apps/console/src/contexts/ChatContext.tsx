/**
 * ChatContext - 全局聊天状态管理
 * 解决模块切换时 ChatPage 组件卸载导致 SSE 连接中断的问题
 *
 * 重构说明 (2026-04-21):
 * - send/stop 相关状态改为按 sessionId 隔离，解决多会话并发阻塞问题
 * - messages / input 保持全局（切换会话时通过 loadHistory / clearMessages 覆盖）
 * - loading / streamingRunId / thinkingPhase / statusMessage / sendError 按 activeSessionId 派生
 */
import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { flushSync } from "react-dom";
import { apiFetch } from "../utils/api";
import type { PreferredSkillPayload } from "../utils/preferredSkill";
import { normalizeContextEvidence, type ChatContextEvidence } from "../utils/chatContextEvidence";
import { getChatProcessingStatus } from "../utils/chatProcessingStatus";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  attachments?: Attachment[];
  ts?: number;
  thinkingContent?: string;
  toolCalls?: Array<{ name: string; arguments?: string; status: 'running' | 'done' }>;
  contextEvidence?: ChatContextEvidence;
  /** 系统提醒消息（如每日提醒），特殊渲染 */
  isSystemReminder?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export type ThinkingPhase = "analyzing" | "retrieving" | "reasoning" | "synthesizing" | "thinking" | "tool_calling";

interface SessionSendState {
  loading: boolean;
  streamingRunId: string | null;
  thinkingPhase: ThinkingPhase;
  statusMessage: string | null;
  sendError: { message: string; lastContent?: string; traceId?: string } | null;
  abortController: AbortController | null;
  isStreaming: boolean;
  isSending: boolean;
  lastSentMsgId: string | null;
  lastSendTime: number;
  currentStreamingId: string | null;
  answerStarted: boolean;
  thinkingContent: string;
}

function createDefaultSessionState(): SessionSendState {
  return {
    loading: false,
    streamingRunId: null,
    thinkingPhase: "thinking",
    statusMessage: null,
    sendError: null,
    abortController: null,
    isStreaming: false,
    isSending: false,
    lastSentMsgId: null,
    lastSendTime: 0,
    currentStreamingId: null,
    answerStarted: false,
    thinkingContent: "",
  };
}

interface ChatContextValue {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  streamingRunId: string | null;
  thinkingPhase: ThinkingPhase;
  statusMessage: string | null;
  sendError: { message: string; lastContent?: string; traceId?: string } | null;
  send: (
    text: string,
    attachments: Attachment[],
    sessionId: string,
    mode: string,
    setMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
    setInput?: (value: string) => void,
    setAttachments?: (attachments: Attachment[]) => void,
    useKb?: boolean,
    memoryContext?: string,
    preferredSkill?: PreferredSkillPayload
  ) => Promise<void>;
  stop: (sessionId: string) => void;
  setSendError: (error: { message: string; lastContent?: string; traceId?: string } | null) => void;
  loadHistory: (sessionId: string, mode: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function sanitizeContent(content: string, isFinal = false, includeThinking = false): string {
  if (!content) return "";
  let result = content;
  if (isFinal) {
    result = result.replace(/<final>[\s\S]*?<\/final>/gi, "");
    result = result.replace(/<final\s*\/>/gi, "");
  }
  if (!includeThinking) {
    result = result.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  }
  return result.trim();
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const [input, setInput] = useState("");

  // 按 sessionId 隔离的发送状态
  const sessionStatesRef = useRef<Map<string, SessionSendState>>(new Map());

  // 当前活跃会话 ID，用于派生全局 loading / streamingRunId 等 UI 状态
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  // Refs for resource cleanup on unmount
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const fallbackControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.cancel("Component unmounted").catch(() => {});
        readerRef.current = null;
      }
      if (fallbackControllerRef.current) {
        fallbackControllerRef.current.abort("Component unmounted");
        fallbackControllerRef.current = null;
      }
    };
  }, []);

  // forceUpdateTick: 当 sessionStatesRef 内部状态变化时，通过增加 tick 强制 React 重新渲染
  const [forceUpdateTick, setForceUpdateTick] = useState(0);

  // 派生当前活跃会话的状态（供 ChatPage 直接读取）
  // 依赖 forceUpdateTick 确保 ref 内部变化后 UI 能更新
  const activeState = useMemo(() => {
    return activeSessionId
      ? sessionStatesRef.current.get(activeSessionId) ?? createDefaultSessionState()
      : createDefaultSessionState();
  }, [activeSessionId, forceUpdateTick]);

  const loading = activeState.loading;
  const streamingRunId = activeState.streamingRunId;
  const thinkingPhase = activeState.thinkingPhase;
  const statusMessage = activeState.statusMessage;
  const sendError = activeState.sendError;

  /** 获取或创建某会话的状态（mutable ref，不触发重渲染） */
  const getSessionState = useCallback((sessionId: string): SessionSendState => {
    let state = sessionStatesRef.current.get(sessionId);
    if (!state) {
      state = createDefaultSessionState();
      sessionStatesRef.current.set(sessionId, state);
    }
    return state;
  }, []);

  /** 强制触发重渲染以更新派生状态 */
  const bumpActiveSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setForceUpdateTick((t) => t + 1);
  }, []);

  /** 根据思考内容智能判断当前阶段 */
  const detectThinkingPhase = useCallback((content: string): ThinkingPhase => {
    const lower = content.toLowerCase();
    const len = content.length;

    if (len > 400) return "synthesizing";
    if (len > 200) return "reasoning";
    if (len > 80) return "retrieving";

    if (/\b(整合|综合|synthesize|compile|汇总|summarize|总结|conclude|回答|answer)\b/i.test(lower)) {
      return "synthesizing";
    }
    if (/\b(推理|推断|reason|infer|逻辑|logic|推导|deduce)\b/i.test(lower)) {
      return "reasoning";
    }
    if (/\b(搜索|检索|search|retrieve|查询|query|查找|find|知识库|knowledge)\b/i.test(lower)) {
      return "retrieving";
    }

    return "analyzing";
  }, []);

  const stop = useCallback((sessionId: string) => {
    const state = getSessionState(sessionId);
    const runId = state.streamingRunId;
    if (runId) {
      apiFetch("/api/chat/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, sessionId }),
      }).catch(() => {});

      state.streamingRunId = null;
      state.loading = false;
      state.thinkingPhase = "thinking";
      state.statusMessage = null;
      state.isStreaming = false;
      state.thinkingContent = "";
      if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
      }

      bumpActiveSession(sessionId);
    }
  }, [getSessionState, bumpActiveSession]);

  const send = useCallback(async (
    text: string,
    attachments: Attachment[],
    sessionId: string,
    mode: string,
    externalSetMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
    externalSetInput?: (value: string) => void,
    externalSetAttachments?: (attachments: Attachment[]) => void,
    useKb = false,
    memoryContext?: string,
    preferredSkill?: PreferredSkillPayload
  ) => {
    const state = getSessionState(sessionId);

    const now = Date.now();
    if (now - state.lastSendTime < 150) return;
    state.lastSendTime = now;

    if (state.isSending) return;

    const trimmedText = text.trim();
    if ((!trimmedText && attachments.length === 0) || state.loading) return;

    const msgId = `u-${now}-${Math.random().toString(36).slice(2, 7)}`;
    const msgKey = `${msgId}-${trimmedText}`;
    if (state.lastSentMsgId === msgKey) return;
    state.lastSentMsgId = msgKey;

    state.isSending = true;
    state.thinkingContent = "";

    // 激活当前会话，让派生状态指向它
    setActiveSessionId(sessionId);

    const updateMessages = externalSetMessages || setMessages;
    const updateInput = externalSetInput || setInput;
    const updateAttachments = externalSetAttachments;

    try {
      updateInput("");
      state.sendError = null;
      state.loading = true;
      state.thinkingPhase = "thinking";
      state.statusMessage = null;
      state.isStreaming = true;

      const currentAttachments = [...attachments];
      updateAttachments?.([]);

      const userMsg: Message = {
        id: msgId,
        role: "user",
        content: trimmedText,
        ts: now,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      };
      updateMessages((prev) => [...prev, userMsg]);

      const assistantId = `a-${userMsg.id}`;
      const streamingId = assistantId;
      state.currentStreamingId = streamingId;

      state.answerStarted = false;

      const tryStream = async () => {
        const controller = new AbortController();
        state.abortController = controller;
        state.streamingRunId = null;

        updateMessages((prev) => [...prev, { id: streamingId, role: "assistant", content: "", ts: Date.now(), isStreaming: true }]);

        const r = await apiFetch("/api/chat/send-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmedText, sessionId, attachments: currentAttachments, mode, useKb, memoryContext, preferredSkill }),
          signal: controller.signal,
        });

        if (!r.ok || !r.body) {
          state.abortController = null;
          return false;
        }

        const reader = r.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";
        let eventType = "";
        let assistantContent = "";
        let streamEnded = false;

        // Delta 更新节流：避免 flushSync 导致大量 delta 事件卡顿
        // 16ms ≈ 60fps，人眼无法区分，同时有效削减高频重渲染
        const THROTTLE_MS = 16;
        let pendingDisplayContent = "";
        let updateScheduled = false;
        let lastUpdateTime = 0;
        let updateTimeoutId: ReturnType<typeof setTimeout> | null = null;

        const flushPendingContent = () => {
          updateTimeoutId = null;
          updateScheduled = false;
          lastUpdateTime = Date.now();
          if (pendingDisplayContent) {
            updateMessages((prev) =>
              prev.map((m) =>
                m.id === streamingId ? { ...m, content: pendingDisplayContent } : m
              )
            );
          }
        };

        const scheduleUpdate = (content: string) => {
          pendingDisplayContent = content;
          const elapsed = Date.now() - lastUpdateTime;
          if (!updateScheduled) {
            updateScheduled = true;
            const delay = elapsed >= THROTTLE_MS ? 0 : THROTTLE_MS - elapsed;
            updateTimeoutId = setTimeout(flushPendingContent, delay);
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              const lines = part.split("\n");
              for (const line of lines) {
                if (line.startsWith("event: ")) eventType = line.slice(7).trim();
                else if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6)) as {
                      content?: string;
                      error?: string;
                      runId?: string;
                      delta?: string;
                    };

                    if (eventType === "started" && data.runId) {
                      state.streamingRunId = data.runId;
                      state.thinkingPhase = "analyzing";
                      bumpActiveSession(sessionId);
                    } else if (eventType === "thinking" && data.delta) {
                      // BFF sends pure thinking text (no <thinking> tags)
                      const thinkingDelta = String(data.delta);
                      if (thinkingDelta && state.currentStreamingId) {
                        state.thinkingContent += thinkingDelta;
                        const newPhase = detectThinkingPhase(state.thinkingContent);
                        const phaseOrder: ThinkingPhase[] = ["analyzing", "retrieving", "reasoning", "synthesizing", "thinking"];
                        const prevIdx = phaseOrder.indexOf(state.thinkingPhase);
                        const newIdx = phaseOrder.indexOf(newPhase);
                        if (newIdx > prevIdx) {
                          state.thinkingPhase = newPhase;
                        }
                        updateMessages((prev) =>
                          prev.map((m) =>
                            m.id === state.currentStreamingId
                              ? { ...m, thinkingContent: (m.thinkingContent ?? "") + thinkingDelta }
                              : m
                          )
                        );
                        bumpActiveSession(sessionId);
                      }
                    } else if (eventType === "delta") {
                      if (data.delta != null) {
                        const deltaText = String(data.delta).replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                        if (!state.answerStarted && deltaText.trim()) {
                          state.answerStarted = true;
                          state.thinkingPhase = "synthesizing";
                          // 内容开始生成，清除工具状态消息，让 thinkingPhase 接管显示
                          state.statusMessage = null;
                        }
                        assistantContent += deltaText;
                      } else if (data.content != null && assistantContent === "") {
                        assistantContent = (data.content as string).replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                      }
                      const displayContent = sanitizeContent(assistantContent, false, true);
                      // 节流更新：避免 flushSync 在大量 delta 事件时造成 UI 卡顿
                      scheduleUpdate(displayContent);
                    } else if (eventType === "final") {
                      streamEnded = true;
                      // Ensure phase shows synthesizing before ending
                      if (!state.answerStarted) {
                        state.answerStarted = true;
                        state.thinkingPhase = "synthesizing";
                      }
                      if (data.content != null) {
                        assistantContent = (data.content as string).replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                      }
                      const finalContent = sanitizeContent(assistantContent, true, true);

                      flushSync(() => {
                        state.streamingRunId = null;
                        state.loading = false;
                        state.thinkingPhase = "thinking";
                        state.statusMessage = null;
                        updateMessages((prev) =>
                          prev.map((m) =>
                            m.id === streamingId
                              ? {
                                  ...m,
                                  content: finalContent || m.content || "",
                                  ts: Date.now(),
                                  isStreaming: false,
                                  toolCalls: m.toolCalls ? m.toolCalls.map(tc => ({ ...tc, status: 'done' as const })) : undefined,
                                }
                              : m
                          )
                        );
                      });
                      state.isStreaming = false;
                      state.thinkingContent = "";
                      bumpActiveSession(sessionId);
                    } else if (eventType === "metadata") {
                      const metadata = data as { contextEvidence?: unknown };
                      if (metadata.contextEvidence && state.currentStreamingId) {
                        const contextEvidence = normalizeContextEvidence(metadata.contextEvidence);
                        updateMessages((prev) =>
                          prev.map((m) =>
                            m.id === state.currentStreamingId
                              ? { ...m, contextEvidence }
                              : m
                          )
                        );
                        bumpActiveSession(sessionId);
                      }
                    } else if (eventType === "tool_call") {
                      const toolCallData = data as { toolName?: string; arguments?: string };
                      if (toolCallData.toolName && state.currentStreamingId) {
                        state.thinkingPhase = "tool_calling";
                        updateMessages((prev) =>
                          prev.map((m) =>
                            m.id === state.currentStreamingId
                              ? {
                                  ...m,
                                  toolCalls: [...(m.toolCalls || []), {
                                    name: toolCallData.toolName!,
                                    arguments: toolCallData.arguments,
                                    status: 'running' as const,
                                  }],
                                }
                              : m
                          )
                        );
                        bumpActiveSession(sessionId);
                      }
                    } else if (eventType === "status") {
                      const statusData = data as { status?: string; toolName?: string; message?: string };
                      if (statusData.status === 'tool_start' && statusData.toolName) {
                        state.statusMessage = getChatProcessingStatus(statusData);
                      } else if (statusData.status === 'tool_done') {
                        // 工具完成状态由消息列表中的 ToolCallPanel 展示
                        // 底部指示器保持当前 thinkingPhase，避免"已完成"与 ToolCallPanel 重复显示
                        state.statusMessage = null;
                      } else if (!state.answerStarted) {
                        // AI 尚未开始输出内容时，显示中间状态提示
                        state.statusMessage = getChatProcessingStatus({
                          ...statusData,
                          answerStarted: state.answerStarted,
                        });
                      }
                      // 一旦 answerStarted=true，让 thinkingPhase 接管显示，忽略后续 status 事件
                      bumpActiveSession(sessionId);
                    } else if (eventType === "error" && data.error) {
                      if (updateTimeoutId) clearTimeout(updateTimeoutId);
                      streamEnded = true;
                      flushSync(() => {
                        state.streamingRunId = null;
                        state.loading = false;
                        state.thinkingPhase = "thinking";
                        state.statusMessage = null;
                        state.sendError = { message: data.error || "未知错误", lastContent: trimmedText, traceId: (data as { traceId?: string }).traceId };
                        updateMessages((prev) =>
                          prev.map((m) =>
                            m.id === streamingId ? { ...m, content: "请求出错，请重试", isStreaming: false } : m
                          )
                        );
                      });
                      state.isStreaming = false;
                      state.thinkingContent = "";
                      bumpActiveSession(sessionId);
                    }
                  } catch (_) {}
                }
              }
            }
          }
        } finally {
          if (updateTimeoutId) {
            clearTimeout(updateTimeoutId);
            updateTimeoutId = null;
          }
          // 确保所有 pending 内容在流结束前被 flush，避免最后一批 delta 被节流延迟
          // 注意：如果 streamEnded=true（已收到 final 事件），final 事件已设置了完整内容，
          // 此处不再 flush pendingDisplayContent，避免用过时的节流内容覆盖完整回复
          if (pendingDisplayContent && !streamEnded) {
            updateMessages((prev) =>
              prev.map((m) =>
                m.id === streamingId ? { ...m, content: pendingDisplayContent } : m
              )
            );
          }
          state.abortController = null;
          readerRef.current = null;
          if (!streamEnded) {
            state.isStreaming = false;
            state.streamingRunId = null;
            state.loading = false;
            state.statusMessage = null;

            // Detect abnormal interruption (no final/error event received)
            // Use functional updater to avoid stale closure on messages
            updateMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant' && lastMsg.id === streamingId && (!lastMsg.content || lastMsg.content === '')) {
                state.sendError = { message: "连接中断，请重试", lastContent: trimmedText };
                return prev.map((m) =>
                  m.id === streamingId
                    ? { ...m, content: "连接中断，请重试", isStreaming: false }
                    : m
                );
              }
              return prev;
            });
            bumpActiveSession(sessionId);
          }
        }
        return true;
      };

      const streamResult = await tryStream().catch((e) =>
        e?.name === "AbortError" ? "aborted" : false
      );

      if (streamResult === "aborted") {
        state.streamingRunId = null;
        state.loading = false;
        state.statusMessage = null;
        state.isStreaming = false;
        state.isSending = false;
        bumpActiveSession(sessionId);
        return;
      }

      if (!streamResult) {
        state.statusMessage = null;
        updateMessages((prev) => prev.filter((m) => m.id !== streamingId));
        const fallbackController = new AbortController();
        fallbackControllerRef.current = fallbackController;
        try {
          const fallback = await apiFetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: trimmedText, sessionId, attachments: currentAttachments, mode, useKb, memoryContext, preferredSkill }),
            signal: fallbackController.signal,
          }).then((res) => res.json());

          const src = fallback.source as string;
          const msg = fallback.message as Message | undefined;
          const isFailure =
            src === "mock" &&
            msg?.content &&
            (msg.content.includes("调用失败") || msg.content.includes("Gateway") || msg.content.includes("超时"));

          if (isFailure) {
            state.sendError = { message: msg?.content ?? "请求失败", lastContent: trimmedText };
          } else if (msg) {
            updateMessages((prev) => [...prev, {
              ...msg,
              contextEvidence: normalizeContextEvidence((fallback as { contextEvidence?: unknown }).contextEvidence),
            }]);
          }
        } finally {
          fallbackControllerRef.current = null;
        }
      }
      state.loading = false;
    } finally {
      Promise.resolve().then(() => {
        state.isSending = false;
        bumpActiveSession(sessionId);
      });
    }
  }, [getSessionState, bumpActiveSession, detectThinkingPhase]);

  const loadHistory = useCallback(async (sessionId: string, mode: string) => {
    // 切换活跃会话，让派生状态指向新会话
    setActiveSessionId(sessionId);
    try {
      const r = await apiFetch(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}&mode=${encodeURIComponent(mode)}`);
      if (!r.ok) {
        console.error("[ChatContext] loadHistory failed:", r.status, sessionId);
        return;
      }
      const d = await r.json();
      const historyMessages = (d.messages || []).map((m: Message) => ({
        ...m,
        content: m.role === "assistant" ? sanitizeContent(m.content, true, true) : m.content,
      }));
      setMessages(historyMessages);
    } catch (e) {
      console.error("[ChatContext] loadHistory error:", e);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        input,
        setInput,
        loading,
        streamingRunId,
        thinkingPhase,
        statusMessage,
        sendError,
        send,
        stop,
        setSendError: (error) => {
          // 更新当前活跃会话的错误状态
          if (activeSessionId) {
            const state = sessionStatesRef.current.get(activeSessionId);
            if (state) {
              state.sendError = error;
              bumpActiveSession(activeSessionId);
            }
          }
        },
        loadHistory,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
