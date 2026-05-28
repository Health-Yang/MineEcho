import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../utils/api";

let inFlightPromise: Promise<{ connected?: boolean; configured?: boolean }> | null = null;

async function fetchGatewayStatus() {
  if (inFlightPromise) {
    return inFlightPromise;
  }
  inFlightPromise = apiFetch("/api/chat/gateway-status")
    .then(async (r) => {
      if (!r.ok) {
        const err = new Error(`HTTP ${r.status}`);
        (err as any).status = r.status;
        throw err;
      }
      return r.json();
    })
    .finally(() => {
      inFlightPromise = null;
    });
  return inFlightPromise;
}

export function useGatewayStatus() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const check = () => {
      lastCheckRef.current = Date.now();
      fetchGatewayStatus()
        .then((d) =>
          setConfigured(d.connected === true || (d.connected === undefined && d.configured === true))
        )
        .catch((err) => {
          // 非网络错误（如 429）不视为断开，保持已有状态
          if (err && typeof err.status === "number") {
            return;
          }
          setConfigured(false);
        });
    };

    check();

    // 清理旧定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 根据状态动态设置间隔
    const intervalMs = configured === false ? 5000 : 20000;
    intervalRef.current = setInterval(check, intervalMs);

    // 页面可见性变化处理：切回页面时立即检查
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 如果超过5秒没有检查，立即检查
        if (Date.now() - lastCheckRef.current > 5000) {
          check();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [configured]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch("/api/init/gateway/refresh", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setConfigured(true);
      }
    } catch (e) {
      console.error("[gateway] refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    configured,
    refreshing,
    refresh,
  };
}
