type LocalAuthEnv = {
  VITE_MINEECHO_AUTH_REQUIRED?: string | boolean;
};

function readViteEnv(): LocalAuthEnv | undefined {
  return (import.meta as ImportMeta & { env?: LocalAuthEnv }).env;
}

export function isLocalAuthBypassEnabled(env: LocalAuthEnv | undefined = readViteEnv()): boolean {
  return env?.VITE_MINEECHO_AUTH_REQUIRED !== "true" && env?.VITE_MINEECHO_AUTH_REQUIRED !== true;
}

export function getLocalAuthModeLabel(env: LocalAuthEnv | undefined = readViteEnv()): {
  enabled: boolean;
  title: string;
  subtitle: string;
} {
  const enabled = isLocalAuthBypassEnabled(env);
  return {
    enabled,
    title: enabled ? "本地模式" : "账号模式",
    subtitle: enabled ? "未启用强制登录" : "已启用登录认证",
  };
}
