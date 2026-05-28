import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../utils/api";

export interface SkillUpdateStatus {
  hasUpdates: boolean;
  totalSkills: number;
  updatableSkills: number;
  newSkills: number;
  removedSkills: number;
  checkedAt: number;
  nextCheckAt: number;
}

const CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟

export function useSkillsUpdateCheck() {
  const [status, setStatus] = useState<SkillUpdateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkUpdates = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = force
        ? "/api/skills-update/check?force=true"
        : "/api/skills-update/status";

      const response = await apiFetch(url);

      if (!response.ok) {
        throw new Error(`检查更新失败: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "检查更新失败");
      console.error("[useSkillsUpdateCheck] 检查失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 启动定时检查
  useEffect(() => {
    // 立即执行一次检查
    checkUpdates();

    // 设置定时器
    intervalRef.current = setInterval(() => {
      checkUpdates();
    }, CHECK_INTERVAL);

    // 清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkUpdates]);

  return {
    status,
    loading,
    error,
    checkUpdates,
    forceCheck: () => checkUpdates(true),
  };
}
