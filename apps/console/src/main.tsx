import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import { ChatProvider } from "./contexts/ChatContext";
import "./index.css";
import "./styles/chat.css";

// 性能监控 - Phase 1 优化
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        console.log('[Performance] FCP:', Math.round(perfData.domContentLoadedEventEnd), 'ms');
        console.log('[Performance] LCP:', Math.round(perfData.loadEventEnd), 'ms');
        console.log('[Performance] TTFB:', Math.round(perfData.responseStart), 'ms');

        // 发送到后端（非阻塞）
        fetch('/api/metrics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcp: Math.round(perfData.domContentLoadedEventEnd),
            lcp: Math.round(perfData.loadEventEnd),
            ttfb: Math.round(perfData.responseStart),
            url: window.location.pathname,
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
    }, 0);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    locale={zhCN}
    theme={{
      token: { colorPrimary: "#0066ff", borderRadius: 8 },
    }}
  >
    <ChatProvider>
      <App />
    </ChatProvider>
  </ConfigProvider>
);
