import { useState, useCallback } from "react";
import { apiFetch } from "../utils/api";

const SESSIONS_STORAGE_KEY = "mineecho_sessions";
const CURRENT_SESSION_STORAGE_KEY = "mineecho_current_session";

const DEFAULT_SESSIONS: { id: string; label: string }[] = [{ id: "main", label: "Default" }];

function loadSessionsFromStorage(): { list: { id: string; label: string }[]; current: string } {
  try {
    const list = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || "null");
    const current = localStorage.getItem(CURRENT_SESSION_STORAGE_KEY) || "main";
    if (Array.isArray(list) && list.length > 0) {
      const curExists = list.some((s) => s.id === current);
      return { list, current: curExists ? current : list[0].id };
    }
  } catch {}
  return { list: DEFAULT_SESSIONS, current: "main" };
}

interface UseChatSessionsProps {
  sessionList?: { id: string; label: string }[];
  currentSessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onNewSession?: () => void;
}

export function useChatSessions(props: UseChatSessionsProps) {
  const [sessionListState, setSessionListState] = useState<{ id: string; label: string }[]>(() =>
    loadSessionsFromStorage().list
  );
  const [currentSessionIdState, setCurrentSessionIdState] = useState<string>(() =>
    loadSessionsFromStorage().current
  );

  const sessionList = props.sessionList ?? sessionListState;
  const currentSessionId = props.currentSessionId ?? currentSessionIdState;

  const setCurrentSessionId = useCallback(
    (id: string) => {
      if (props.onSessionChange) {
        props.onSessionChange(id);
      } else {
        setCurrentSessionIdState(id);
        localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, id);
      }
    },
    [props]
  );

  const switchSession = useCallback(
    (id: string) => {
      setCurrentSessionId(id);
    },
    [setCurrentSessionId]
  );

  const newConversation = useCallback(() => {
    // 如果父组件提供了 onNewSession，委托给父组件统一管理 session
    if (props.onNewSession) {
      props.onNewSession();
      return;
    }
    // fallback: 自己管理 session（独立使用 useChatSessions 时）
    const id = `s-${Date.now()}`;
    const label = `Chat ${sessionList.length + 1}`;
    const newList = [...sessionList, { id, label }];
    setSessionListState(newList);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newList));
    setCurrentSessionId(id);
  }, [sessionList, props.onNewSession, setCurrentSessionId]);

  const clearSession = useCallback(async () => {
    try {
      await apiFetch(`/api/chat/history?sessionId=${encodeURIComponent(currentSessionId)}`, {
        method: "DELETE",
      });
    } catch {}
    // 本地也清空：通过触发父组件重新加载
    window.dispatchEvent(new CustomEvent("mineecho:clear-session", { detail: { sessionId: currentSessionId } }));
  }, [currentSessionId]);

  return {
    sessionList,
    currentSessionId,
    switchSession,
    newConversation,
    clearSession,
  };
}
