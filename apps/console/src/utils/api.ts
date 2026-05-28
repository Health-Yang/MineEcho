const USER_ID_KEY = 'mineecho_user_id';

// Electron 生产环境使用 localhost，开发/浏览器环境使用相对路径
function getBaseUrl(): string {
  // @ts-ignore — electronAPI 由 Electron preload 脚本注入
  if (typeof window !== 'undefined' && (window as any).electronAPI?.bffUrl) {
    // @ts-ignore
    return (window as any).electronAPI.bffUrl;
  }
  return '';
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
}

export async function fetchUserId(): Promise<string | null> {
  try {
    const res = await apiFetch('/api/init/status');
    if (res.ok) {
      const data = await res.json();
      if (data.userId) {
        setUserId(data.userId);
        return data.userId;
      }
    }
  } catch {
    // ignore
  }
  return getUserId();
}

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userId = getUserId();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  // 生产环境 Electron 下拼接完整 URL
  const baseUrl = getBaseUrl();
  const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
  return fetch(fullUrl, { ...options, headers });
}
