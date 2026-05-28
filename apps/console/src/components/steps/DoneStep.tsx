import { Button, Typography, Space } from "antd";
import {
  CheckCircleFilled,
  ArrowRightOutlined,
  DownloadOutlined,
  MessageOutlined,
  AppstoreOutlined,
  BookOutlined,
  AudioOutlined,
} from "@ant-design/icons";

interface DoneStepProps {
  onGoToChat: () => void;
  onImportDemoSkills?: () => void;
}

const FEATURES = [
  { icon: <MessageOutlined />, text: "智能聊天" },
  { icon: <AppstoreOutlined />, text: "技能中心" },
  { icon: <BookOutlined />, text: "知识库" },
  { icon: <AudioOutlined />, text: "会议纪要" },
];

export function DoneStep({ onGoToChat, onImportDemoSkills }: DoneStepProps) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      {/* 成功图标 */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f6ffed 0%, #e6f7e6 100%)",
            boxShadow: "0 8px 24px rgba(82,196,26,0.15)",
          }}
        >
          <CheckCircleFilled
            style={{
              fontSize: 48,
              color: "#52c41a",
            }}
          />
        </div>
      </div>

      {/* 标题 */}
      <Typography.Title
        level={3}
        style={{
          margin: "0 0 8px",
          color: "#1f2329",
          fontSize: 26,
          fontWeight: 600,
        }}
      >
        配置完成！
      </Typography.Title>

      {/* 副标题 */}
      <Typography.Text
        style={{
          fontSize: 16,
          color: "#646a73",
        }}
      >
        MineEcho 已准备就绪
      </Typography.Text>

      {/* 功能预览列表 */}
      <div
        style={{
          maxWidth: 400,
          margin: "32px auto",
          padding: "20px 24px",
          background: "#fff",
          border: "1px solid #e8ecf1",
          borderRadius: 12,
        }}
      >
        <Typography.Text
          style={{
            display: "block",
            fontSize: 13,
            color: "#8f959e",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          你可以开始使用
        </Typography.Text>

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                background: "#f5f7fa",
                borderRadius: 8,
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#fff",
                  color: "#0066ff",
                  fontSize: 16,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {feature.icon}
              </span>
              <Typography.Text
                style={{
                  fontSize: 15,
                  color: "#1f2329",
                  fontWeight: 500,
                }}
              >
                {feature.text}
              </Typography.Text>
            </div>
          ))}
        </Space>
      </div>

      {/* 按钮组 */}
      <Space direction="vertical" size={12} style={{ width: "100%", maxWidth: 320 }}>
        <Button
          type="primary"
          size="large"
          block
          onClick={onGoToChat}
          icon={<ArrowRightOutlined />}
          style={{
            height: 48,
            fontSize: 16,
            fontWeight: 500,
            borderRadius: 24,
            background: "#0066ff",
            boxShadow: "0 4px 16px rgba(0,102,255,0.3)",
          }}
        >
          进入 MineEcho
        </Button>

        {onImportDemoSkills && (
          <Button
            size="large"
            block
            onClick={onImportDemoSkills}
            icon={<DownloadOutlined />}
            style={{
              height: 44,
              fontSize: 15,
              borderRadius: 24,
              borderColor: "#d9d9d9",
              color: "#646a73",
            }}
          >
            导入示例技能
          </Button>
        )}
      </Space>
    </div>
  );
}
