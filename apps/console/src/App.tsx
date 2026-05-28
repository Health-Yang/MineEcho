import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { isLocalAuthBypassEnabled } from "./utils/localAuth";

const InitWizardPage = lazy(() => import("./pages/InitWizardPage").then((module) => ({ default: module.InitWizardPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const AccountPage = lazy(() => import("./pages/AccountPage").then((module) => ({ default: module.AccountPage })));

function PageSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>{children}</Suspense>;
}

// 路由守卫组件
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, needsInit } = useAuth();
  const location = useLocation();
  const authBypassEnabled = isLocalAuthBypassEnabled();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
        <h2>加载中...</h2>
      </div>
    );
  }

  if (authBypassEnabled) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    // 未登录，跳转到登录页，携带当前路径以便登录后返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录但需要初始化
  if (needsInit && !location.pathname.startsWith("/init")) {
    return <Navigate to="/init" replace />;
  }

  return <>{children}</>;
}

// Init 页面专属守卫：仅已登录但未配置的用户可访问
function InitRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, needsInit } = useAuth();
  const location = useLocation();
  const authBypassEnabled = isLocalAuthBypassEnabled();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
        <h2>加载中...</h2>
      </div>
    );
  }

  if (authBypassEnabled) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已配置完成，不需要初始化
  if (!needsInit) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}

// Login 页面专属守卫：已登录用户直接跳转
function LoginRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, needsInit } = useAuth();
  const authBypassEnabled = isLocalAuthBypassEnabled();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
        <h2>加载中...</h2>
      </div>
    );
  }

  if (authBypassEnabled) {
    return <Navigate to="/chat" replace />;
  }

  if (isAuthenticated) {
    // 已登录用户访问登录页，如果有 from 路径则返回，否则根据是否需要初始化跳转
    return <Navigate to={needsInit ? "/init" : "/chat"} replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      {/* 登录页 - 未登录用户可访问，已登录用户跳转 */}
      <Route path="/login" element={<LoginRoute><PageSuspense><LoginPage /></PageSuspense></LoginRoute>} />

      {/* 初始化向导 — 仅已登录但未配置的用户可访问 */}
      <Route path="/init" element={<InitRoute><PageSuspense><InitWizardPage /></PageSuspense></InitRoute>} />

      {/* 账号管理页 */}
      <Route path="/account" element={
        <ProtectedRoute><PageSuspense><AccountPage /></PageSuspense></ProtectedRoute>
      } />

      {/* 主应用路由 — 全部需要登录 */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="chat" element={null} />
        <Route path="skills" element={null} />
        <Route path="knowledge/*" element={null} />
        <Route path="meeting" element={null} />
        <Route path="memory" element={null} />
        <Route path="calendar" element={<Navigate to="/meeting" replace />} />
        <Route path="cron" element={null} />
        <Route path="config" element={null} />
        {/* 兼容旧路由 */}
        <Route path="settings" element={<Navigate to="/config" replace />} />
      </Route>

      {/* 捕获所有未匹配路由，重定向到 /chat */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
