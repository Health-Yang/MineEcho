import { useState, useEffect, useCallback } from "react";
import { Button, Typography, message, Form } from "antd";
import { RocketOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import {
  StepIndicator,
  GatewayCheckStep,
  ModelConfigStep,
  WorkspaceStep,
  TestStep,
} from "../components/steps";

interface InitStatus {
  configDir?: string;
  envDir?: string;
  hasOpenclawJson?: boolean;
  hasMinimaxKey?: boolean;
  needsInit?: boolean;
  loadError?: boolean;
}

interface GatewayStatus {
  configured: boolean;
  connected?: boolean;
  url: string;
}

const STEPS = [
  { title: "模型配置", description: "配置 API Key" },
  { title: "Gateway 检查", description: "检查连接状态" },
  { title: "工作目录配置", description: "配置本地存储" },
  { title: "测试验证", description: "验证连接" },
];

const DEFAULT_MODELS: Record<string, string> = {
  minimax: "MiniMax-M2.7",
  dashscope: "qwen-plus",
  other: "",
};

export function InitPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<InitStatus | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>("minimax");
  const [modelForm] = Form.useForm();
  const [workspaceForm] = Form.useForm();

  // 加载状态
  const loadStatus = useCallback(async () => {
    try {
      const [initRes, gatewayRes] = await Promise.all([
        fetch("/api/init/status"),
        fetch("/api/chat/gateway-status"),
      ]);

      if (initRes.ok) {
        const data = await initRes.json();
        setStatus({ ...data, loadError: false });
      } else {
        setStatus({ loadError: true, needsInit: true });
      }

      if (gatewayRes.ok) {
        const data = await gatewayRes.json();
        setGatewayStatus(data);
      }
    } catch {
      setStatus({ loadError: true, needsInit: true });
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => clearInterval(timer);
  }, [loadStatus]);

  // 判断是否桌面版
  const isDesktop = typeof window !== 'undefined' && !!(window as any).electronAPI;

  // 重启 Gateway（注入最新 API Key 并重新启动）
  const onRestartGateway = useCallback(async () => {
    try {
      if (isDesktop) {
        // 桌面版：通过 Electron IPC 调用
        const result = await (window as any).electronAPI.restartGateway();
        if (result.ok) {
          message.info("Gateway 重启中，请等待连接...");
        } else {
          message.error("重启 Gateway 失败: " + (result.error || "未知错误"));
        }
      } else {
        // 容器版：通过 HTTP API
        await fetch("/api/init/restart-gateway", { method: "POST" });
        message.info("Gateway 重启指令已发送，请等待连接...");
      }
      setTimeout(loadStatus, 3000);
    } catch {
      message.error("重启 Gateway 失败");
    }
  }, [loadStatus, isDesktop]);

  // 保存模型配置
  const onSaveModel = async (values: { apiKey?: string; model?: string }) => {
    setLoading(true);
    try {
      const body: Record<string, string> = {
        model: values.model || DEFAULT_MODELS[provider],
      };
      if (values.apiKey) {
        if (provider === "minimax") body.minimaxApiKey = values.apiKey;
        if (provider === "dashscope") body.dashscopeApiKey = values.apiKey;
        if (provider === "deepseek") body.deepseekApiKey = values.apiKey;
        if (provider === "zhipu") body.zhipuApiKey = values.apiKey;
      }

      const res = await fetch("/api/init/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "保存失败");

      message.success("模型配置已保存，正在重启 Gateway...");
      // 注入最新 Key 并重启 Gateway
      try {
        if (isDesktop) {
          const result = await (window as any).electronAPI.restartGateway();
          if (result.ok) {
            message.info("Gateway 重启中，请等待连接...");
          } else {
            message.error("Gateway 重启失败: " + (result.error || "未知错误"));
          }
        } else {
          const res = await fetch("/api/init/restart-gateway", { method: "POST" });
          const data = await res.json();
          console.log("[InitPage] restart-gateway response:", data);
          if (!res.ok || data.error) {
            message.error("Gateway 重启失败: " + (data.error || "未知错误"));
          }
        }
      } catch (err) {
        console.error("[InitPage] restart-gateway error:", err);
        message.error("Gateway 重启请求失败");
      }
      loadStatus();
      setCurrentStep(1); // 进入 Gateway 检查步骤
    } catch (e: any) {
      message.error(e.message || "保存失败");
    } finally {
      setLoading(false);
    }
  };

  // 保存工作目录配置
  const onSaveWorkspace = async (values: any) => {
    setLoading(true);
    try {
      // 保存到 localStorage
      const workspaceConfig = {
        workspaceName: values.workspaceName,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("mineecho_workspace", JSON.stringify(workspaceConfig));

      // 同时发送到后端
      const res = await fetch("/api/init/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName: values.workspaceName }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "保存失败");

      message.success("工作目录配置已保存");
      setCurrentStep(3); // 进入测试步骤
    } catch (e: any) {
      message.error(e.message || "保存失败");
    } finally {
      setLoading(false);
    }
  };

  // 测试模型
  const onTest = async () => {
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "你好" }),
    });
    const data = await res.json();

    return {
      ok: data.source === "gateway" && !data.error,
      content: data.message?.content,
      error: data.error,
    };
  };

  // 跳转到聊天页面
  const onGoToChat = () => {
    window.location.href = "/chat";
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ModelConfigStep
            form={modelForm}
            provider={provider}
            setProvider={setProvider}
            loading={loading}
            onSave={onSaveModel}
            hasExistingKey={!!status?.hasMinimaxKey}
          />
        );
      case 1:
        return (
          <GatewayCheckStep
            status={gatewayStatus}
            loading={false}
            onRefresh={loadStatus}
            onRestartGateway={onRestartGateway}
          />
        );
      case 2:
        return (
          <WorkspaceStep
            form={workspaceForm}
            loading={loading}
            onSave={onSaveWorkspace}
          />
        );
      case 3:
        return (
          <TestStep
            onTest={onTest}
            onGoToChat={onGoToChat}
            gatewayConnected={gatewayStatus?.connected || false}
          />
        );
      default:
        return null;
    }
  };

  if (!status) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <RocketOutlined style={{ fontSize: 48, color: "#1677ff" }} />
        <Typography.Title level={4} style={{ marginTop: 16 }}>
          加载中...
        </Typography.Title>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      {/* 标题 */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <RocketOutlined style={{ fontSize: 48, color: "#1677ff", marginBottom: 16 }} />
        <Typography.Title level={3} style={{ margin: 0 }}>
          欢迎使用 MineEcho
        </Typography.Title>
        <Typography.Text type="secondary">
          完成初始化配置，开始您的 AI 之旅
        </Typography.Text>
      </div>

      {/* 步骤指示器 */}
      <StepIndicator current={currentStep} steps={STEPS} />

      {/* 步骤内容 */}
      <div style={{ marginBottom: 24 }}>{renderStepContent()}</div>

      {/* 导航按钮 */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
          icon={<LeftOutlined />}
        >
          上一步
        </Button>

        {currentStep < 3 && (
          <Button
            type="primary"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={currentStep === 1 && !gatewayStatus?.connected}
            icon={<RightOutlined />}
          >
            {currentStep === 1 ? "Gateway 已连接，下一步" : "下一步"}
          </Button>
        )}
      </div>

      {/* 提示 */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          提示：API Key 仅保存在本地，不会上传到服务器
        </Typography.Text>
      </div>
    </div>
  );
}
