import { Button, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { FoxLogo } from "../FoxLogo";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      {/* 背景装饰 */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,102,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "25%",
          right: "20%",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Logo */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #e6f0ff 0%, #fff5e0 100%)",
            boxShadow: "0 8px 32px rgba(0,102,255,0.12)",
          }}
        >
          <FoxLogo size={80} />
        </div>
      </div>

      {/* 标题 */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 16 }}>
        <Typography.Title
          level={2}
          style={{
            margin: 0,
            color: "#1f2329",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.5px",
          }}
        >
          欢迎使用 MineEcho
        </Typography.Title>
      </div>

      {/* 副标题 */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 24 }}>
        <Typography.Text
          style={{
            fontSize: 18,
            color: "#f5a623",
            fontWeight: 500,
          }}
        >
          你的职场 AI 伴侣
        </Typography.Text>
      </div>

      {/* 介绍文字 */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 480,
          margin: "0 auto 40px",
          padding: "20px 24px",
          background: "#fff",
          border: "1px solid #e8ecf1",
          borderRadius: 12,
        }}
      >
        <Typography.Paragraph
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.8,
            color: "#646a73",
          }}
        >
          MineEcho 是专为职场人打造的 AI 助手，帮你管理技能、知识库、会议记录，
          让 AI 真正成为你工作中的得力伙伴。
        </Typography.Paragraph>
      </div>

      {/* 开始按钮 */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 20 }}>
        <Button
          type="primary"
          size="large"
          onClick={onNext}
          icon={<ArrowRightOutlined />}
          style={{
            height: 48,
            padding: "0 40px",
            fontSize: 16,
            fontWeight: 500,
            borderRadius: 24,
            background: "#0066ff",
            boxShadow: "0 4px 16px rgba(0,102,255,0.3)",
          }}
        >
          开始配置
        </Button>
      </div>

      {/* 底部提示 */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Typography.Text
          style={{
            fontSize: 13,
            color: "#8f959e",
          }}
        >
          配置过程约需 2 分钟
        </Typography.Text>
      </div>
    </div>
  );
}
