import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout as AntLayout, Typography, Button, Select, Avatar, Dropdown, message, Spin } from "antd";
import { PlusOutlined, CloseOutlined, UserOutlined, LogoutOutlined, TeamOutlined } from "@ant-design/icons";
import { FoxLogo } from "../components/FoxLogo";
import type { ChatMode } from "../modes/types";
import { DEFAULT_MODE } from "../modes/modeConfig";
import { useSkillsUpdateCheck } from "../hooks/useSkillsUpdateCheck";
import { useAuth } from "../contexts/AuthContext";
import { getLocalAuthModeLabel } from "../utils/localAuth";
import { getMainTabFromPath, type MainTabKey } from "../utils/navigationTabs";

const { Sider, Content } = AntLayout;
const SIDER_WIDTH = 200;

const SESSIONS_STORAGE_KEY = "mineecho_sessions";
const CURRENT_SESSION_STORAGE_KEY = "mineecho_current_session";

const DEFAULT_SESSIONS: { id: string; label: string; mode: ChatMode }[] = [{ id: "main", label: "Default", mode: DEFAULT_MODE }];
const TAB_PATHS: Record<MainTabKey, string> = {
  chat: "/chat",
  skills: "/skills",
  knowledge: "/knowledge",
  memory: "/memory",
  meeting: "/meeting",
  cron: "/cron",
  config: "/config",
};

const ChatPage = lazy(() => import("../pages/ChatPage").then((module) => ({ default: module.ChatPage })));
const SkillsPage = lazy(() => import("../pages/SkillsPage").then((module) => ({ default: module.SkillsPage })));
const CronPage = lazy(() => import("../pages/CronPage").then((module) => ({ default: module.CronPage })));
const UnifiedConfigPage = lazy(() => import("../pages/UnifiedConfigPage").then((module) => ({ default: module.UnifiedConfigPage })));
const KnowledgeBasePage = lazy(() => import("../pages/KnowledgeBasePage").then((module) => ({ default: module.KnowledgeBasePage })));
const MeetingPage = lazy(() => import("../pages/MeetingPage").then((module) => ({ default: module.MeetingPage })));
const MemoryPage = lazy(() => import("../pages/MemoryPage").then((module) => ({ default: module.MemoryPage })));

function PageFallback() {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin />
    </div>
  );
}

function loadSessionsFromStorage(): { list: { id: string; label: string; mode: ChatMode }[]; current: string } {
  try {
    const list = JSON.parse(localStorage.getItem(SESSIONS_STORAGE_KEY) || "null");
    const current = localStorage.getItem(CURRENT_SESSION_STORAGE_KEY) || "main";
    if (Array.isArray(list) && list.length > 0) {
      // 向后兼容：补全缺少 mode 字段的旧数据
      const normalized = list.map((s) => ({ ...s, mode: s.mode ?? DEFAULT_MODE }));
      const curExists = normalized.some((s) => s.id === current);
      return { list: normalized, current: curExists ? current : normalized[0].id };
    }
  } catch (_) {}
  return { list: [...DEFAULT_SESSIONS], current: "main" };
}

function saveSessionsToStorage(list: { id: string; label: string }[], current: string) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(CURRENT_SESSION_STORAGE_KEY, current);
  } catch (_) {}
}

const GATEWAY_POLL_INTERVAL_MS = 20000;
const GATEWAY_POLL_WHEN_DISCONNECTED_MS = 5000;

export function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const authMode = getLocalAuthModeLabel();
  const [gatewayOk, setGatewayOk] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    return getMainTabFromPath(window.location.pathname);
  });

  // 技能更新检查
  const { status: updateStatus } = useSkillsUpdateCheck();
  const updateCount = (updateStatus?.updatableSkills || 0) + (updateStatus?.newSkills || 0);

  // 会话管理
  const [sessionList, setSessionList] = useState<{ id: string; label: string; mode: ChatMode }[]>(() => loadSessionsFromStorage().list);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => loadSessionsFromStorage().current);
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);

  const location = useLocation();

  // 动态生成菜单项（带红点提示）
  const tabItems: Array<{ key: MainTabKey; label: React.ReactNode; icon: React.ReactNode }> = [
    { key: "chat", label: "聊天", icon: <span style={{ fontSize: 16 }}>💬</span> },
    {
      key: "skills",
      label: updateCount > 0 ? (
        <span style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <span>技能中心</span>
          <span style={{ marginLeft: "auto", background: "#0066ff", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: 500 }}>{updateCount}</span>
        </span>
      ) : "技能中心",
      icon: <span style={{ fontSize: 16 }}>🌳</span>
    },
    { key: "knowledge", label: "知识库", icon: <span style={{ fontSize: 16 }}>📚</span> },
    { key: "memory", label: "我的记忆", icon: <span style={{ fontSize: 16 }}>🧠</span> },
    { key: "meeting", label: "我的会议", icon: <span style={{ fontSize: 16 }}>🎙️</span> },
    { key: "config", label: "设置", icon: <span style={{ fontSize: 16 }}>⚙️</span> },
  ];

  // 监听路由变化，同步更新 activeTab
  useEffect(() => {
    const path = location.pathname;
    const configMode = localStorage.getItem("mineecho_config_mode");
    const configStep = localStorage.getItem("mineecho_config_step");
    const isConfiguring = localStorage.getItem("mineecho_configuring") === "true";

    if (process.env.NODE_ENV === 'development') {
      console.log("[Layout] Route change:", { path, configMode, configStep, isConfiguring, activeTab });
    }

    // 如果在向导配置模式下或正在配置中，不根据路由切换 tab
    if ((configMode === "wizard" && configStep) || isConfiguring) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[Layout] In wizard mode or configuring, ignoring route change");
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("[Layout] Processing route change");
    }
    setActiveTab(getMainTabFromPath(path));
  }, [location.pathname]);

  useEffect(() => {
    const check = () => {
      fetch("/api/chat/gateway-status")
        .then(async (r) => {
          if (!r.ok) {
            const err = new Error(`HTTP ${r.status}`);
            (err as any).status = r.status;
            throw err;
          }
          return r.json();
        })
        .then((d) => setGatewayOk(d.connected === true || (d.connected === undefined && d.configured === true)))
        .catch((err) => {
          // 非网络错误（如 429）不视为断开，保持已有状态
          if (err && typeof err.status === "number") {
            return;
          }
          setGatewayOk(false);
        });
    };
    check();
    const intervalMs = gatewayOk === false ? GATEWAY_POLL_WHEN_DISCONNECTED_MS : GATEWAY_POLL_INTERVAL_MS;
    const t = setInterval(check, intervalMs);
    return () => clearInterval(t);
  }, [gatewayOk]);

  // 保存会话到 localStorage
  useEffect(() => {
    saveSessionsToStorage(sessionList, currentSessionId);
  }, [sessionList, currentSessionId]);

  // 检查是否需要切换到聊天页面（从技能广场跳转）
  useEffect(() => {
    const checkSwitchToChat = () => {
      const shouldSwitch = localStorage.getItem("mineecho_switch_to_chat");
      const isConfiguring = localStorage.getItem("mineecho_configuring") === "true";

      if (shouldSwitch && !isConfiguring) {
        if (process.env.NODE_ENV === 'development') {
          console.log("[Layout] Executing mineecho_switch_to_chat");
        }
        localStorage.removeItem("mineecho_switch_to_chat");
        setActiveTab("chat");
        navigate("/chat");
      } else if (shouldSwitch) {
        if (process.env.NODE_ENV === 'development') {
          console.log("[Layout] mineecho_switch_to_chat blocked by config state");
        }
        localStorage.removeItem("mineecho_switch_to_chat");
      }
    };

    checkSwitchToChat();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mineecho_switch_to_chat") {
        checkSwitchToChat();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 处理 Tab 切换
  const handleTabChange = (key: MainTabKey) => {
    setActiveTab(key);
    const path = TAB_PATHS[key];
    if (path && location.pathname !== path) {
      navigate(path);
    }
  };

  // 新建会话
  const handleNewSession = () => {
    const newId = `session-${Date.now()}`;
    // 统计现有会话数，自动递增命名
    const existingCount = sessionList.length;
    const newLabel = existingCount === 0 ? "Default" : `会话 ${existingCount + 1}`;
    const newSession = { id: newId, label: newLabel, mode: DEFAULT_MODE };
    setSessionList([...sessionList, newSession]);
    setCurrentSessionId(newId);
    setActiveTab("chat");
    navigate("/chat");
  };

  // 删除会话
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (sessionList.length <= 1) return;
    const newList = sessionList.filter((s) => s.id !== sessionId);
    setSessionList(newList);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(newList[0].id);
    }
  };

  // 切换会话
  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
    navigate("/chat");
    setSessionDropdownOpen(false);
  };

  // 切换当前会话的模式
  const handleModeChange = (mode: ChatMode) => {
    setSessionList((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, mode } : s))
    );
  };

  // 获取当前会话的模式
  const currentMode: ChatMode = sessionList.find((s) => s.id === currentSessionId)?.mode ?? DEFAULT_MODE;

  const siderWidth = SIDER_WIDTH;

  // 根据当前 tab 渲染对应的页面组件
  const renderContent = () => {
    // 聊天页面需要传入会话相关的 props
    if (activeTab === "chat") {
      return (
        <ChatPage
          sessionList={sessionList}
          currentSessionId={currentSessionId}
          onSessionChange={handleSessionChange}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
      );
    }

    switch (activeTab) {
      case "skills":
        return <SkillsPage />;
      case "knowledge":
        return <KnowledgeBasePage />;
      case "meeting":
        return <MeetingPage />;
      case "memory":
        return <MemoryPage />;
      case "cron":
        return <CronPage />;
      case "config":
        return <UnifiedConfigPage />;
      default:
        return <ChatPage
          sessionList={sessionList}
          currentSessionId={currentSessionId}
          onSessionChange={handleSessionChange}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />;
    }
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        theme="light"
        width={SIDER_WIDTH}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          overflow: "hidden",
          zIndex: 100,
          background: "#fff",
          borderRight: "1px solid #e8ecf1",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* 顶部：Logo + 会话选择 */}
        <div className="sidebar-header" style={{ flexShrink: 0 }}>
          <div style={{ height: 56, display: "flex", alignItems: "center", paddingLeft: 16, gap: 10 }}>
            <FoxLogo size={28} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <Typography.Text strong style={{ fontSize: 16, color: "#1f2329" }}>MineEcho</Typography.Text>
              <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00b365" }} />
                <span style={{ fontSize: 10, color: "#00b365" }}>在线</span>
              </span>
            </div>
          </div>

          {/* 会话选择器 */}
          <div style={{ padding: "8px 12px 12px" }}>
            <div className="sf-card" style={{ padding: 8 }}>
              <Select
                value={currentSessionId}
                onChange={handleSessionChange}
                style={{ width: "100%" }}
                open={sessionDropdownOpen}
                onOpenChange={setSessionDropdownOpen}
                suffixIcon={null}
                placeholder="选择会话"
                options={sessionList.map(s => ({
                  value: s.id,
                  label: (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span>{s.label}</span>
                      {sessionList.length > 1 && (
                        <CloseOutlined
                          style={{ fontSize: 10, opacity: 0.5 }}
                          onClick={(e) => handleDeleteSession(e, s.id)}
                        />
                      )}
                    </div>
                  ),
                }))}
              />
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleNewSession}
                style={{
                  width: "100%",
                  marginTop: 8,
                  border: "1px dashed #e8ecf1",
                  color: "#8c8c8c",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#0066ff";
                  (e.currentTarget as HTMLElement).style.color = "#0066ff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#e8ecf1";
                  (e.currentTarget as HTMLElement).style.color = "#8c8c8c";
                }}
              >
                新建会话
              </Button>
            </div>
          </div>
        </div>

        {/* 中间：功能 Tab 列表（可滚动） */}
        <div className="sidebar-tabs" style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
          {tabItems.map((item) => (
            <div
              key={item.key}
              className={activeTab === item.key ? "nav-item active" : "nav-item"}
              onClick={() => handleTabChange(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* 左侧栏底部状态信息 */}
        <div className="sidebar-footer" style={{ padding: "12px", marginTop: "auto", flexShrink: 0 }}>
          <div className="sf-card" style={{ padding: 12, borderRadius: 12, background: "#fff", border: "1px solid #e8ecf1" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Gateway 状态 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11, minWidth: 50 }}>Gateway</Typography.Text>
                {gatewayOk === true && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#00b365" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00b365" }} />
                    已连接
                  </span>
                )}
                {gatewayOk === false && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#fa8c16", cursor: "pointer" }}
                    onClick={() => handleTabChange("config")}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fa8c16" }} />
                    未连接
                  </span>
                )}
              </div>
              {/* 进度条装饰 */}
              <div style={{ width: "100%", height: 2, background: "#f0f0f0", borderRadius: 1, overflow: "hidden" }}>
                <div style={{ width: gatewayOk === true ? "100%" : gatewayOk === false ? "30%" : "60%", height: "100%", background: gatewayOk === true ? "#00b365" : gatewayOk === false ? "#fa8c16" : "#bfbfbf", borderRadius: 1, transition: "all 0.3s ease" }} />
              </div>

              {/* 用户信息 / 登录入口 */}
              {authMode.enabled ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 0",
                  }}
                >
                  <Avatar size={24} icon={<UserOutlined />} style={{ background: "#00b365" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text style={{ fontSize: 12, display: "block" }} ellipsis>
                      {authMode.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                      {authMode.subtitle}
                    </Typography.Text>
                  </div>
                </div>
              ) : isAuthenticated ? (
                user ? (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "account",
                        icon: <TeamOutlined />,
                        label: "账号管理",
                        onClick: () => navigate("/account"),
                      },
                      {
                        key: "logout",
                        icon: <LogoutOutlined />,
                        label: "退出登录",
                        danger: true,
                        onClick: () => {
                          logout();
                          message.success("已退出登录");
                          navigate("/login");
                        },
                      },
                    ],
                  }}
                  trigger={["click"]}
                  placement="topLeft"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    <Avatar size={24} icon={<UserOutlined />} style={{ background: "#0066ff" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text style={{ fontSize: 12, display: "block" }} ellipsis>
                        {user.name || user.email}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                        {user.role || "用户"}
                      </Typography.Text>
                    </div>
                  </div>
                </Dropdown>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                    <Spin size="small" />
                  </div>
                )
              ) : (
                <Button
                  type="primary"
                  ghost
                  size="small"
                  icon={<UserOutlined />}
                  onClick={() => navigate("/login")}
                  style={{ width: "100%" }}
                >
                  登录 / 注册
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </Sider>

      {/* 页面左下角状态栏（删除，移至左侧栏内） */}
      {/* </删除> */}

      <Content
        style={{
          marginLeft: siderWidth,
          height: "100vh",
          overflow: "auto",
          background: "#f5f7fa",
          padding: 0,
        }}
      >
        <Suspense fallback={<PageFallback />}>{renderContent()}</Suspense>
      </Content>
    </AntLayout>
  );
}
