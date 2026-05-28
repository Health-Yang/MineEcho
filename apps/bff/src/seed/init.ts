/**
 * Seed Initialization
 * 自动在 BFF 启动时调用 /api/seed/init 确保预制邀请码存在
 */

import { logger } from "../utils/logger.js";
import { getLocalBffUrl } from "../utils/bff-url.js";

export async function seedInit(): Promise<void> {
  try {
    const response = await fetch(getLocalBffUrl("/api/seed/init"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Seed init failed: ${response.status}`);
    }

    const result = await response.json() as { success: boolean; newCodes?: string[] };

    if (result.success) {
      logger.info("[Seed] 初始化完成", {
        seeded: result.success,
        newCodes: result.newCodes?.length || 0
      });
    }
  } catch (error) {
    // 忽略网络错误（可能 BFF 还没完全启动）
    logger.debug("[Seed] 初始化跳过:", { error: String(error) });
  }
}
