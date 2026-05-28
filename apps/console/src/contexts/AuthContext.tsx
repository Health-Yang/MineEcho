import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isLocalAuthBypassEnabled } from "../utils/localAuth";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: number;
}

// 多账号存储结构
interface StoredAccount {
  userId: string;
  email: string;
  name: string | null;
  token: string;
  lastLoginAt: number;
}

interface AuthContextType {
  user: User | null;
  accountId: string | null;
  token: string | null;
  isLoading: boolean;
  needsInit: boolean;
  // 多账号相关
  accounts: StoredAccount[];
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => void;
  saveCurrentAccount: () => void;
  // 核心方法
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, invitationCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  logoutAll: () => void;
  isAuthenticated: boolean;
  setNeedsInit: (value: boolean) => void;
}

const ACCOUNTS_STORAGE_KEY = "mineecho_accounts";
const LOCAL_AUTH_USER: User = {
  id: "local-user",
  email: "local@mineecho.dev",
  name: "MineEcho Local",
  role: "本地模式",
  created_at: 0,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authBypassEnabled = isLocalAuthBypassEnabled();
  const [user, setUser] = useState<User | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsInit, setNeedsInit] = useState(false);
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);

  const CURRENT_USER_KEY = "mineecho_current_user_id";

  // 从 localStorage 加载账号列表
  const loadAccounts = (): StoredAccount[] => {
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // 保存账号列表到 localStorage
  const saveAccounts = (accountList: StoredAccount[]) => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accountList));
    } catch {
      // ignore
    }
  };

  // 保存当前账号到账号列表
  const saveCurrentAccount = () => {
    if (!user || !token) return;
    const storedAccounts = loadAccounts();
    const existingIndex = storedAccounts.findIndex(a => a.userId === user.id);

    const newAccount: StoredAccount = {
      userId: user.id,
      email: user.email,
      name: user.name,
      token: token,
      lastLoginAt: Date.now()
    };

    if (existingIndex >= 0) {
      storedAccounts[existingIndex] = newAccount;
    } else {
      storedAccounts.push(newAccount);
    }

    saveAccounts(storedAccounts);
    setAccounts(storedAccounts);
    localStorage.setItem(CURRENT_USER_KEY, user.id);
  };

  // 切换账号
  const switchAccount = async (userId: string) => {
    const storedAccounts = loadAccounts();
    const targetAccount = storedAccounts.find(a => a.userId === userId);

    if (!targetAccount) return;

    // 验证 token 是否有效
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${targetAccount.token}` }
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("mineecho_token", targetAccount.token);
        localStorage.setItem(CURRENT_USER_KEY, targetAccount.userId);

        setToken(targetAccount.token);
        setUser(data.data?.user || null);
        setAccountId(data.data?.account?.id || null);

        // 更新最后登录时间
        targetAccount.lastLoginAt = Date.now();
        saveAccounts(storedAccounts);
        setAccounts(storedAccounts);
      } else {
        // token 无效，移除该账号
        removeAccount(userId);
      }
    } catch {
      removeAccount(userId);
    }
  };

  // 移除账号
  const removeAccount = (userId: string) => {
    const storedAccounts = loadAccounts();
    const filteredAccounts = storedAccounts.filter(a => a.userId !== userId);
    saveAccounts(filteredAccounts);
    setAccounts(filteredAccounts);

    // 如果移除的是当前账号，执行登出
    if (user?.id === userId) {
      logout();
    }
  };

  // 登出所有账号
  const logoutAll = () => {
    localStorage.removeItem("mineecho_token");
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    setToken(null);
    setUser(null);
    setAccountId(null);
    setAccounts([]);
    setNeedsInit(false);
  };

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("mineecho_token");
    // 加载账号列表
    setAccounts(loadAccounts());

    if (storedToken) {
      setToken(storedToken);
      // 立即设置 isLoading 为 false，使用本地缓存的用户信息
      // fetchUserInfo 会异步加载最新用户信息
      fetchUserInfo(storedToken);
    } else if (authBypassEnabled) {
      setUser(LOCAL_AUTH_USER);
      setAccountId("local");
      setNeedsInit(false);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 首次加载时获取用户配置状态
  useEffect(() => {
    if (token && user) {
      checkInitStatus();
    }
  }, [token, user]);

  async function checkInitStatus() {
    try {
      const res = await fetch("/api/init/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // API returns needsInit directly
        setNeedsInit(data.needsInit === true);
      }
    } catch {
      // ignore
    }
  }

  async function fetchUserInfo(t: string) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setUser(data.data?.user || null);
        setAccountId(data.data?.account?.id || null);
        checkInitStatus();
      } else if (res.status === 401) {
        localStorage.removeItem("mineecho_token");
        setToken(null);
        setUser(null);
        setAccountId(null);
      } else {
        localStorage.removeItem("mineecho_token");
        setToken(null);
        setUser(null);
        setAccountId(null);
      }
    } catch (err) {
      console.error("[Auth] fetchUserInfo error:", err);
      localStorage.removeItem("mineecho_token");
      setToken(null);
      setUser(null);
      setAccountId(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        // API returns { success: true, data: { token, user, account } }
        const token = data.data?.token;
        if (token) {
          localStorage.setItem("mineecho_token", token);
          setToken(token);
        }
        setUser(data.data?.user || null);
        setAccountId(data.data?.user?.id || null);

        // 保存到多账号列表
        saveCurrentAccount();

        return { success: true };
      }
      return { success: false, error: data.error || "登录失败" };
    } catch (err) {
      return { success: false, error: "网络错误" };
    }
  }

  async function register(email: string, password: string, name: string, invitationCode: string) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, invitationCode })
      });
      const data = await res.json();
      if (data.success) {
        // API returns { success: true, data: { token, user, account } }
        const token = data.data?.token;
        if (token) {
          localStorage.setItem("mineecho_token", token);
          setToken(token);
        }
        setUser(data.data?.user || null);
        setAccountId(data.data?.user?.id || null);

        // 保存到多账号列表
        saveCurrentAccount();

        return { success: true };
      }
      return { success: false, error: data.error || "注册失败" };
    } catch (err) {
      return { success: false, error: "网络错误" };
    }
  }

  function logout() {
    if (authBypassEnabled) {
      localStorage.removeItem("mineecho_token");
      setToken(null);
      setUser(LOCAL_AUTH_USER);
      setAccountId("local");
      setNeedsInit(false);
      return;
    }

    // 如果有多个账号，只清除当前 token
    const storedAccounts = loadAccounts();
    if (storedAccounts.length > 1) {
      // 多账号模式下，只切换到其他账号
      const currentUserId = user?.id;
      const otherAccount = storedAccounts.find(a => a.userId !== currentUserId);
      if (otherAccount) {
        localStorage.setItem("mineecho_token", otherAccount.token);
        setToken(otherAccount.token);
        // 异步切换到其他账号
        switchAccount(otherAccount.userId);
        return;
      }
    }
    // 单账号或最后一个账号，正常登出
    localStorage.removeItem("mineecho_token");
    setToken(null);
    setUser(null);
    setAccountId(null);
    setNeedsInit(false);
  }

  return (
    <AuthContext.Provider value={{
      user: authBypassEnabled && !user ? LOCAL_AUTH_USER : user,
      accountId: authBypassEnabled && !accountId ? "local" : accountId,
      token,
      isLoading,
      needsInit: authBypassEnabled ? false : needsInit,
      accounts, switchAccount, removeAccount, saveCurrentAccount,
      login, register, logout, logoutAll,
      isAuthenticated: authBypassEnabled || !!token, setNeedsInit
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
