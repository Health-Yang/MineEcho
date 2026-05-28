import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Space, message } from "antd";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatInputBar } from "../components/chat/ChatInputBar";
import { MessageList } from "../components/chat/MessageList";
import { ErrorMessage } from "../components/chat/ErrorMessage";
import { useChatSessions } from "../hooks/useChatSessions";
import { useChatAttachments } from "../hooks/useChatAttachments";
import { useGatewayStatus } from "../hooks/useGatewayStatus";
import { useChatContext } from "../contexts/ChatContext";
import { DEFAULT_MODE } from "../modes/modeConfig";
import type { ChatMode } from "../modes/types";
import { fetchSkillRoute, type SkillRouteResult } from "../utils/skillRoute";
import { buildSkillFocusPath } from "../utils/skillNavigation";
import { buildPreferredSkillPayload, type PreferredSkillPayload } from "../utils/preferredSkill";

interface ChatPageProps {
  sessionList?: { id: string; label: string }[];
  currentSessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onNewSession?: () => void;
  onDeleteSession?: (e: React.MouseEvent, sessionId: string) => void;
  hideHeader?: boolean;
  currentMode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
}

export function ChatPage(props: ChatPageProps) {
  const navigate = useNavigate();

  const sessions = useChatSessions(props);
  const gateway = useGatewayStatus();
  const attachments = useChatAttachments();
  const chat = useChatContext();

  const currentMode: ChatMode = props.currentMode ?? DEFAULT_MODE;

  const isLoadingHistoryRef = useRef(false);
  const prevSessionIdRef = useRef(sessions.currentSessionId);
  const [useKb, setUseKb] = useState(() => {
    try {
      return localStorage.getItem("mineecho_useKb") === "true";
    } catch {
      return false;
    }
  });

  // 智能输入建议
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{ text: string; type: string }>>([]);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(() => {
    return localStorage.getItem("smartSuggestionsDismissed") === new Date().toISOString().slice(0, 10);
  });
  const [skillRoute, setSkillRoute] = useState<SkillRouteResult | null>(null);
  const [skillRouteDismissedFor, setSkillRouteDismissedFor] = useState("");
  const [preferredSkill, setPreferredSkill] = useState<PreferredSkillPayload | undefined>();

  // 组件挂载时加载当前 session 的历史记录（刷新页面后需要重新加载）
  useEffect(() => {
    if (sessions.currentSessionId && !isLoadingHistoryRef.current) {
      isLoadingHistoryRef.current = true;
      chat.loadHistory(sessions.currentSessionId, currentMode).finally(() => {
        isLoadingHistoryRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 sessionId 变化，切换会话时清空消息并加载新历史
  useEffect(() => {
    if (sessions.currentSessionId !== prevSessionIdRef.current) {
      // Session 发生变化，清空消息并加载新 session 的历史
      prevSessionIdRef.current = sessions.currentSessionId;
      chat.clearMessages();
      if (!isLoadingHistoryRef.current) {
        isLoadingHistoryRef.current = true;
        chat.loadHistory(sessions.currentSessionId, currentMode).finally(() => {
          isLoadingHistoryRef.current = false;
        });
      }
    }
  }, [sessions.currentSessionId, currentMode, chat]);

  // 检查待发送消息
  useEffect(() => {
    const pending = localStorage.getItem("pending_chat_message");
    const quoteSkill = localStorage.getItem("pending_quote_skill");
    if (pending) {
      localStorage.removeItem("pending_chat_message");
      if (quoteSkill) {
        localStorage.removeItem("pending_quote_skill");
        chat.setInput(`[使用技能: ${quoteSkill}]\n${pending}`);
      } else {
        chat.setInput(pending);
      }
    }
  }, []);

  // 监听清空会话事件
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId === sessions.currentSessionId) {
        chat.clearMessages();
        message.success("对话已清空");
      }
    };
    window.addEventListener("mineecho:clear-session", handler);
    return () => window.removeEventListener("mineecho:clear-session", handler);
  }, [sessions.currentSessionId, chat]);

  // 获取智能输入建议
  useEffect(() => {
    let cancelled = false;
    fetch("/api/chat/smart-suggestions")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data?.suggestions?.length > 0) {
          setSmartSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        // 静默失败
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = useCallback(() => {
    chat.send(
      chat.input,
      attachments.attachments,
      sessions.currentSessionId,
      currentMode,
      chat.setMessages,
      chat.setInput,
      attachments.setAttachments,
      useKb,
      undefined,
      preferredSkill
    );
    setPreferredSkill(undefined);
  }, [chat, attachments, sessions.currentSessionId, currentMode, useKb, preferredSkill]);

  useEffect(() => {
    const query = chat.input.trim();
    if (preferredSkill && !query.includes(preferredSkill.skillName || preferredSkill.skillId)) {
      setPreferredSkill(undefined);
    }
    if (query.length < 4 || query === skillRouteDismissedFor) {
      setSkillRoute(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchSkillRoute(query, { mode: currentMode, limit: 3 })
        .then((route) => {
          if (cancelled) return;
          if (route?.selectedSkillId && route.candidates.length > 0) {
            setSkillRoute(route);
          } else {
            setSkillRoute(null);
          }
        })
        .catch(() => {
          if (!cancelled) setSkillRoute(null);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [chat.input, currentMode, skillRouteDismissedFor, preferredSkill]);

  // Persist useKb toggle to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("mineecho_useKb", String(useKb));
    } catch {
      // Ignore localStorage errors
    }
  }, [useKb]);

  const handleSendExample = useCallback(
    (text: string) => {
      chat.send(text, [], sessions.currentSessionId, currentMode, chat.setMessages, undefined, undefined, useKb);
    },
    [chat, sessions.currentSessionId, currentMode, useKb]
  );

  const quoteMessage = useCallback((content: string) => {
    const quoted = content
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    chat.setInput((prev) => (prev ? `${prev}\n\n${quoted}` : quoted));
  }, [chat]);

  const retrySend = useCallback(() => {
    if (chat.sendError?.lastContent) {
      chat.send(
        chat.sendError.lastContent,
        [],
        sessions.currentSessionId,
        currentMode,
        chat.setMessages,
        undefined,
        undefined,
        useKb
      );
    } else {
      chat.setSendError(null);
    }
  }, [chat, sessions.currentSessionId, currentMode, useKb]);

  return (
    <div className="chat-page">
      {!props.hideHeader && (
        <ChatHeader
          useKb={useKb}
          onUseKbChange={setUseKb}
        />
      )}

      {gateway.configured === false && (
        <Alert
          type="warning"
          message="需要配置模型 API Key"
          description={
            <>
              当前可以保存会话与记忆，但还不能调用真实模型。请先完成模型与 API Key 配置；配置后再启动或刷新 MineEcho Gateway。
              <Space style={{ marginTop: 8 }}>
                <Button type="link" size="small" onClick={() => navigate("/init")}>
                  打开初始化向导
                </Button>
                <Button type="link" size="small" onClick={() => navigate("/config")}>
                  去设置
                </Button>
                <Button
                  type="link"
                  size="small"
                  loading={gateway.refreshing}
                  onClick={gateway.refresh}
                >
                  刷新状态
                </Button>
              </Space>
            </>
          }
          style={{ marginBottom: 12, borderRadius: 8 }}
          closable
          onClose={() => {}}
        />
      )}

      {chat.sendError && (
        <ErrorMessage
          error={chat.sendError.message}
          onRetry={retrySend}
          onClose={() => chat.setSendError(null)}
        />
      )}

      <MessageList
        messages={chat.messages}
        loading={chat.loading}
        streamingRunId={chat.streamingRunId}
        onQuoteMessage={quoteMessage}
        onSendExample={handleSendExample}
        thinkingPhase={chat.thinkingPhase}
        statusMessage={chat.statusMessage}
      />

      {/* 智能输入建议 */}
      {smartSuggestions.length > 0 && !suggestionsDismissed && (
        <div
          style={{
            padding: "8px 16px",
            background: "#fafafa",
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>试试：</span>
          {smartSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                chat.setInput(s.text);
              }}
              style={{
                fontSize: 12,
                color: "#595959",
                background: "#fff",
                border: "1px solid #d9d9d9",
                borderRadius: 12,
                padding: "2px 10px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "#f0f0f0";
                (e.target as HTMLButtonElement).style.borderColor = "#bfbfbf";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "#fff";
                (e.target as HTMLButtonElement).style.borderColor = "#d9d9d9";
              }}
            >
              {s.text}
            </button>
          ))}
          <button
            onClick={() => {
              setSuggestionsDismissed(true);
              localStorage.setItem(
                "smartSuggestionsDismissed",
                new Date().toISOString().slice(0, 10)
              );
            }}
            style={{
              fontSize: 11,
              color: "#bfbfbf",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            关闭
          </button>
        </div>
      )}

      {skillRoute?.selectedSkillName && (
        <div
          style={{
            padding: "8px 16px",
            background: "#fff",
            borderTop: "1px solid #eef1f5",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "#6b7280" }}>将优先使用</span>
          <button
            onClick={() => {
              if (skillRoute.selectedSkillId) {
                navigate(buildSkillFocusPath(skillRoute.selectedSkillId));
              }
            }}
            style={{
              fontSize: 12,
              color: "#1d4ed8",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: "2px 8px",
              cursor: "pointer",
            }}
            title={skillRoute.candidates[0]?.evidence.map((item) => `${item.type}: ${item.value}`).join("；")}
          >
            {skillRoute.selectedSkillName}
          </button>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            置信度 {Math.round((skillRoute.candidates[0]?.score || 0) * 100)}%
          </span>
          <button
            onClick={() => {
              setPreferredSkill(buildPreferredSkillPayload(skillRoute));
              chat.setInput(`[使用技能: ${skillRoute.selectedSkillName}]\n${chat.input}`);
            }}
            style={{
              fontSize: 11,
              color: "#4b5563",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "2px 8px",
              cursor: "pointer",
            }}
          >
            插入
          </button>
          <button
            onClick={() => setSkillRouteDismissedFor(chat.input.trim())}
            style={{
              fontSize: 11,
              color: "#9ca3af",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            忽略
          </button>
        </div>
      )}

      <ChatInputBar
        value={chat.input}
        onChange={chat.setInput}
        onSend={handleSend}
        onStop={() => chat.stop(sessions.currentSessionId)}
        loading={chat.loading}
        streaming={!!chat.streamingRunId}
        disabled={false}
        attachments={attachments.attachments}
        onAttachmentAdd={attachments.handleFileSelect}
        onAttachmentRemove={attachments.removeAttachment}
        uploading={attachments.uploading}
        onPaste={attachments.handlePaste}
      />
    </div>
  );
}
