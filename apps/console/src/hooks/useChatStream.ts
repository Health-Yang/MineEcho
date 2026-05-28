import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { apiFetch } from "../utils/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  attachments?: Attachment[];
  ts?: number;
  thinkingContent?: string; // 思考内容（用于分离显示）
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface UseChatStreamOptions {
  sessionId: string;
  mode: string;
}

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

export type ThinkingPhase = "analyzing" | "retrieving" | "reasoning" | "synthesizing" | "thinking";

export function useChatStream({ sessionId, mode }: UseChatStreamOptions) {
  const [loading, setLoading] = useState(false);
  const [streamingRunId, setStreamingRunId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<{ message: string; lastContent?: string } | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase>("thinking");

  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);
  const isSendingRef = useRef(false);
  const lastSentMsgIdRef = useRef<string | null>(null);
  const lastSendTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const currentStreamingIdRef = useRef<string | null>(null); // 当前流式消息ID，用于更新思考内容
  const answerStartedRef = useRef(false); // 标记正文是否已开始生成，用于收起思考气泡
  const thinkingContentRef = useRef(""); // 累计思考内容用于阶段判断

  /** 根据思考内容智能判断当前阶段 */
  const detectThinkingPhase = useCallback((content: string): ThinkingPhase => {
    const lower = content.toLowerCase();
    // 分析阶段关键词
    if (/\b(分析|analyze|understand|理解|break down|分解)\b/i.test(lower) && content.length < 200) {
      return "analyzing";
    }
    // 检索阶段关键词
    if (/\b(搜索|检索|search|retrieve|查询|query|查找|find|知识库|knowledge)\b/i.test(lower)) {
      return "retrieving";
    }
    // 推理阶段关键词
    if (/\b(推理|推断|reason|infer|逻辑|logic|推导|deduce|思考|think)\b/i.test(lower)) {
      return "reasoning";
    }
    // 整合阶段关键词（通常在思考后期）
    if (/\b(整合|综合|synthesize|compile|汇总|summarize|总结|conclude|回答|answer)\b/i.test(lower) || content.length > 500) {
      return "synthesizing";
    }
    return "thinking";
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    const runId = streamingRunId;
    if (runId) {
      apiFetch("/api/chat/abort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, sessionId }),
      }).catch(() => {});
      setStreamingRunId(null);
      setLoading(false);
      setThinkingPhase("thinking");
      isStreamingRef.current = false;
      thinkingContentRef.current = "";
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [streamingRunId, sessionId]);

  const send = useCallback(
    async (
      text: string,
      attachments: Attachment[],
      setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
      setInput?: (value: string) => void,
      setAttachments?: (attachments: Attachment[]) => void,
      useKb?: boolean
    ) => {
      const now = Date.now();
      if (now - lastSendTimeRef.current < 150) return;
      lastSendTimeRef.current = now;

      if (isSendingRef.current) return;

      const trimmedText = text.trim();
      if ((!trimmedText && attachments.length === 0) || loading) return;

      const msgId = `u-${now}-${Math.random().toString(36).slice(2, 7)}`;
      const msgKey = `${msgId}-${trimmedText}`;
      if (lastSentMsgIdRef.current === msgKey) return;
      lastSentMsgIdRef.current = msgKey;

      isSendingRef.current = true;
      thinkingContentRef.current = "";

      try {
        setInput?.("");
        setSendError(null);
        setLoading(true);
        setThinkingPhase("thinking");
        isStreamingRef.current = true;

        const currentAttachments = [...attachments];
        setAttachments?.([]);

        const userMsg: Message = {
          id: msgId,
          role: "user",
          content: trimmedText,
          ts: now,
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        };
        setMessages((prev) => [...prev, userMsg]);

        const assistantId = `a-${userMsg.id}`;
        const streamingId = assistantId;
        currentStreamingIdRef.current = streamingId;

        answerStartedRef.current = false;

        const tryStream = async () => {
          const controller = new AbortController();
          abortControllerRef.current = controller;
          setStreamingRunId(null);

          setMessages((prev) => [...prev, { id: streamingId, role: "assistant", content: "", ts: Date.now(), isStreaming: true }]);

          const r = await apiFetch("/api/chat/send-stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: trimmedText, sessionId, attachments: currentAttachments, mode, useKb }),
            signal: controller.signal,
          });

          if (!r.ok || !r.body) {
            abortControllerRef.current = null;
            return false;
          }

          const reader = r.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let eventType = "";
          let assistantContent = "";
          let streamEnded = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (!mountedRef.current) {
                controller.abort();
                break;
              }

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
                        setStreamingRunId(data.runId);
                        setThinkingPhase("analyzing");
                      } else if (eventType === "thinking" && data.delta) {
                        // 思考内容存储在消息对象中（用于分离显示）
                        // 防御性剥离 <thinking>...</thinking> 标签，保留标签内纯文本
                        const thinkingRaw = data.delta;
                        const thinkingDelta = thinkingRaw
                          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
                          .trim();
                        if ((thinkingDelta || thinkingRaw !== thinkingDelta) && currentStreamingIdRef.current) {
                          // 累计思考内容用于阶段判断
                          thinkingContentRef.current += thinkingDelta;
                          // 智能检测思考阶段
                          const newPhase = detectThinkingPhase(thinkingContentRef.current);
                          setThinkingPhase((prev) => {
                            // 阶段只能向前推进，不能后退
                            const phaseOrder: ThinkingPhase[] = ["analyzing", "retrieving", "reasoning", "synthesizing", "thinking"];
                            const prevIdx = phaseOrder.indexOf(prev);
                            const newIdx = phaseOrder.indexOf(newPhase);
                            return newIdx > prevIdx ? newPhase : prev;
                          });
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === currentStreamingIdRef.current
                                ? {
                                    ...m,
                                    thinkingContent: (m.thinkingContent ?? "") + thinkingDelta,
                                    // 关键：从 msg.content 中剥离 thinking 标签，防止 extractAndStripThinking 二次提取
                                    content: m.content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, ""),
                                  }
                                : m
                            )
                          );
                          // 同步从 assistantContent 中剥离 thinking 标签，防止 thinking 文本在 final 时进入 msg.content
                          assistantContent = assistantContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                        }
                      } else if (eventType === "delta") {
                        if (data.delta != null) {
                          const deltaText = (data.delta as string).replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                          // 首次出现非空正文时，收起思考气泡并进入整合阶段
                          if (deltaText && !answerStartedRef.current) {
                            answerStartedRef.current = true;
                            setThinkingPhase("synthesizing");
                            if (currentStreamingIdRef.current) {
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === currentStreamingIdRef.current
                                    ? { ...m, thinkingContent: "" }
                                    : m
                                )
                              );
                            }
                          }
                          assistantContent += deltaText;
                        } else if (data.content != null && assistantContent === "") {
                          assistantContent = (data.content as string).replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                        }
                        const displayContent = sanitizeContent(assistantContent, false, true);
                        flushSync(() => {
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === streamingId ? { ...m, content: displayContent || m.content || "" } : m
                            )
                          );
                        });
                      } else if (eventType === "final") {
                        streamEnded = true;
                        if (data.content != null) {
                          assistantContent = (data.content as string).replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                        }
                        const finalContent = sanitizeContent(assistantContent, true, true);

                        flushSync(() => {
                          setStreamingRunId(null);
                          setLoading(false);
                          setThinkingPhase("thinking");
                          // 思考内容已存储在消息对象中，无需清空
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === streamingId
                                ? { ...m, content: finalContent || m.content || "", ts: Date.now(), isStreaming: false }
                                : m
                            )
                          );
                        });
                        isStreamingRef.current = false;
                        thinkingContentRef.current = "";
                      } else if (eventType === "error" && data.error) {
                        streamEnded = true;
                        flushSync(() => {
                          setStreamingRunId(null);
                          setLoading(false);
                          setThinkingPhase("thinking");
                          setSendError({ message: data.error || "未知错误", lastContent: trimmedText });
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === streamingId ? { ...m, content: "请求出错，请重试", isStreaming: false } : m
                            )
                          );
                        });
                        isStreamingRef.current = false;
                        thinkingContentRef.current = "";
                      }
                    } catch (_) {}
                  }
                }
              }
            }
          } finally {
            abortControllerRef.current = null;
            if (!streamEnded) {
              isStreamingRef.current = false;
              setStreamingRunId(null);
              setLoading(false);
            }
          }
          return true;
        };

        const streamResult = await tryStream().catch((e) =>
          e?.name === "AbortError" ? "aborted" : false
        );

        if (streamResult === "aborted") {
          setStreamingRunId(null);
          setLoading(false);
          isStreamingRef.current = false;
          isSendingRef.current = false;
          return;
        }

        if (!streamResult) {
          setMessages((prev) => prev.filter((m) => m.id !== streamingId));
          let fallback: { source?: string; message?: Message; error?: string } | null = null;
          try {
            const res = await apiFetch("/api/chat/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: trimmedText, sessionId, attachments: currentAttachments, mode, useKb }),
            });
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            fallback = (await res.json()) as { source?: string; message?: Message; error?: string };
          } catch (fetchErr) {
            console.error("[Chat] Fallback failed:", fetchErr);
            setSendError({ message: "网络连接不稳定，请刷新页面后重试", lastContent: trimmedText });
            setLoading(false);
            return;
          }

          const src = fallback?.source;
          const msg = fallback?.message;
          const errorText = fallback?.error;

          // 判断是否为失败响应（gateway-error、包含错误关键词、或无有效消息）
          const isFailure =
            src === "gateway-error" ||
            !!errorText ||
            !msg?.content ||
            (msg?.content && (
              msg.content.includes("调用失败") ||
              msg.content.includes("Gateway") ||
              msg.content.includes("超时") ||
              msg.content.includes("404") ||
              msg.content.includes("500")
            ));

          if (isFailure) {
            const errMsg = errorText || msg?.content || "请求失败，请稍后重试";
            setSendError({ message: errMsg, lastContent: trimmedText });
          } else if (msg) {
            setMessages((prev) => [...prev, msg]);
          } else {
            setSendError({ message: "未收到有效回复，请重试", lastContent: trimmedText });
          }
        }
        setLoading(false);
      } finally {
        Promise.resolve().then(() => {
          isSendingRef.current = false;
        });
      }
    },
    [sessionId, mode, loading]
  );

  const retry = useCallback(
    (lastContent: string | undefined, setMessages: React.Dispatch<React.SetStateAction<Message[]>>, useKb?: boolean) => {
      if (lastContent) {
        send(lastContent, [], setMessages, undefined, undefined, useKb);
      }
    },
    [send]
  );

  return {
    send,
    stop,
    retry,
    loading,
    streamingRunId,
    sendError,
    setSendError,
    thinkingPhase,
  };
}
