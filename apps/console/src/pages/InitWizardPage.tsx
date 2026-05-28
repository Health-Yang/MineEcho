import { useState, useEffect, useCallback } from "react";
import { Button, Typography, message } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { StepIndicator } from "../components/steps/StepIndicator";
import { GatewayStep, GatewayStatus } from "../components/steps/GatewayStep";
import { ModelStep } from "../components/steps/ModelStep";
import { WelcomeStep } from "../components/steps/WelcomeStep";
import { DoneStep } from "../components/steps/DoneStep";

const STEPS = [
  { title: "欢迎", description: "认识 MineEcho" },
  { title: "Gateway", description: "连接 AI 后端" },
  { title: "模型", description: "选择 AI 模型" },
  { title: "完成", description: "开始使用" },
];

const DEFAULT_MODELS: Record<string, string> = {
  minimax: "MiniMax-M2.7",
  dashscope: "qwen-plus",
  deepseek: "deepseek-chat",
  zhipu: "glm-4",
};

export function InitWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // 判断是否桌面版
  const isDesktop =
    typeof window !== "undefined" && !!(window as any).electronAPI;

  // 加载 Gateway 状态
  const loadGatewayStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/gateway-status");
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data);
      }
    } catch {
      // 静默失败，保持当前状态
    }
  }, []);

  // 初始加载 + 定时刷新
  useEffect(() => {
    loadGatewayStatus();
    const timer = setInterval(loadGatewayStatus, 5000);
    return () => clearInterval(timer);
  }, [loadGatewayStatus]);

  // 保存模型配置
  const onSaveModel = async (values: {
    provider: string;
    apiKey?: string;
    model?: string;
  }) => {
    setLoading(true);
    try {
      const body: Record<string, string> = {
        model: values.model || DEFAULT_MODELS[values.provider],
      };
      if (values.apiKey) {
        if (values.provider === "minimax") body.minimaxApiKey = values.apiKey;
        if (values.provider === "dashscope")
          body.dashscopeApiKey = values.apiKey;
        if (values.provider === "deepseek")
          body.deepseekApiKey = values.apiKey;
        if (values.provider === "zhipu") body.zhipuApiKey = values.apiKey;
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
            message.error(
              "Gateway 重启失败: " + (result.error || "未知错误")
            );
          }
        } else {
          const restartRes = await fetch("/api/init/restart-gateway", {
            method: "POST",
          });
          const restartData = await restartRes.json();
          if (!restartRes.ok || restartData.error) {
            message.error(
              "Gateway 重启失败: " + (restartData.error || "未知错误")
            );
          }
        }
      } catch {
        message.error("Gateway 重启请求失败");
      }

      // 延迟后刷新状态
      setTimeout(() => {
        loadGatewayStatus();
      }, 3000);
    } catch (e: any) {
      message.error(e.message || "保存失败");
      throw e; // 让 ModelStep 知道保存失败，不进入下一步
    } finally {
      setLoading(false);
    }
  };

  // 进入下一步
  const onNext = () => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  // 跳转到聊天页面
  const onGoToChat = () => {
    window.location.href = "/chat";
  };

  // 判断是否可以进入下一步
  const canGoNext = () => {
    if (currentStep === 1) {
      // Gateway 步骤：必须已连接才能下一步
      return gatewayStatus?.connected === true;
    }
    return true;
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={onNext} />;
      case 1:
        return (
          <GatewayStep
            status={gatewayStatus}
            onRefresh={loadGatewayStatus}
          />
        );
      case 2:
        return (
          <ModelStep
            loading={loading}
            onSave={onSaveModel}
            onNext={() => setCurrentStep(3)}
          />
        );
      case 3:
        return <DoneStep onGoToChat={onGoToChat} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
      }}
    >
      {/* 主卡片 */}
      <div
        style={{
          width: "100%",
          maxWidth: 800,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e8ecf1",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
        }}
      >
        {/* 顶部品牌栏 */}
        <div
          style={{
            padding: "24px 32px 0",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "#0066ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>S</span>
            </div>
            <Typography.Text
              strong
              style={{ fontSize: 18, color: "#1f2329" }}
            >
              MineEcho
            </Typography.Text>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            初始化向导
          </Typography.Text>
        </div>

        {/* 步骤指示器 */}
        <div style={{ padding: "24px 32px 0" }}>
          <StepIndicator current={currentStep} steps={STEPS} />
        </div>

        {/* 步骤内容 */}
        <div style={{ padding: "0 32px 32px" }}>
          {renderStepContent()}
        </div>

        {/* 底部导航 */}
        {currentStep !== 2 && currentStep !== 3 && (
          <div
            style={{
              padding: "16px 32px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fafbfc",
            }}
          >
            <Button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => s - 1)}
              icon={<LeftOutlined />}
              size="large"
              style={{ borderRadius: 8 }}
            >
              上一步
            </Button>

            {currentStep === 1 ? (
              <Button
                type="primary"
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canGoNext()}
                icon={<RightOutlined />}
                size="large"
                style={{ borderRadius: 8 }}
              >
                Gateway 已连接，下一步
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => setCurrentStep((s) => s + 1)}
                icon={<RightOutlined />}
                size="large"
                style={{ borderRadius: 8 }}
              >
                下一步
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <Typography.Text
        type="secondary"
        style={{ fontSize: 12, marginTop: 20, color: "#8f959e" }}
      >
        API Key 仅保存在本地，不会上传到服务器
      </Typography.Text>
    </div>
  );
}
