import { Card, Button, Typography, Space, Spin, Alert } from "antd";
import { ApiOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from "@ant-design/icons";

interface GatewayStatus {
  configured: boolean;
  connected?: boolean;
  url: string;
  hasToken?: boolean;
  wsState?: number;
}

interface GatewayCheckStepProps {
  status: GatewayStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onRestartGateway?: () => void;
}

export function GatewayCheckStep({ status, loading, onRefresh, onRestartGateway }: GatewayCheckStepProps) {
  const getStatusDisplay = () => {
    if (!status) {
      return {
        icon: <Spin size="small" />,
        text: "检查中...",
        type: "processing" as const,
      };
    }

    // V3 状态检测逻辑：BFF /api/chat/gateway-status 不返回 wsState
    const hasValidConnection = status.connected === true;

    if (hasValidConnection) {
      return {
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        text: "已连接",
        type: "success" as const,
        description: `Gateway 运行正常 (${status.url}) - hasToken: ${status.hasToken}`,
      };
    }

    if (status.configured && status.hasToken) {
      return {
        icon: <Spin size="small" />,
        text: "连接中...",
        type: "processing" as const,
        description: `Gateway 已配置，正在建立连接...`,
      };
    }

    return {
      icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      text: "未连接",
      type: "error" as const,
      description: "Gateway 未配置或无法连接",
    };
  };

  const display = getStatusDisplay();

  return (
    <Card title="Gateway 连接检查" bordered={false}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <ApiOutlined style={{ fontSize: 48, color: display.type === "success" ? "#52c41a" : "#1677ff", marginBottom: 16 }} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            <Space>
              {display.icon}
              {display.text}
            </Space>
          </Typography.Title>
          {display.description && (
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {display.description}
            </Typography.Text>
          )}
        </div>

        {status?.connected === true ? (
          <Alert
            type="success"
            message="Gateway 连接正常"
            description={`可以继续进行下一步配置 (hasToken: ${status.hasToken})`}
            showIcon
          />
        ) : (
          <Alert
            type="info"
            message="等待 Gateway 启动"
            description={`API Key 已保存，Gateway 正在使用最新配置启动，通常需要 10-30 秒，页面将自动刷新。当前状态: connected=${status?.connected || false}`}
            showIcon
            action={
              <Space>
                <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
                  刷新
                </Button>
                {onRestartGateway && (
                  <Button onClick={onRestartGateway}>
                    重启 Gateway
                  </Button>
                )}
              </Space>
            }
          />
        )}

        <div style={{ background: "#f6ffed", padding: 16, borderRadius: 8, border: "1px solid #b7eb8f" }}>
          <Typography.Text strong style={{ color: "#52c41a" }}>
            连接状态说明：
          </Typography.Text>
          <ul style={{ margin: "8px 0 0 0", paddingLeft: 20, color: "#666" }}>
            <li>已连接：可以正常使用所有功能</li>
            <li>连接中：Gateway 正在启动，请稍等</li>
            <li>未连接：检查容器是否正常运行</li>
          </ul>
        </div>
      </Space>
    </Card>
  );
}
