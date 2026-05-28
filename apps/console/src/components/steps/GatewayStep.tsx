import { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Space,
  Spin,
  Alert,
  Tag,
  Card,
} from "antd";
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

export interface GatewayStatus {
  configured: boolean;
  connected?: boolean;
  url: string;
  hasToken?: boolean;
  wsState?: number;
}

interface GatewayStepProps {
  status: GatewayStatus | null;
  onRefresh: () => void;
}

export function GatewayStep({ status, onRefresh }: GatewayStepProps) {
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    await onRefresh();
    setTimeout(() => setChecking(false), 800);
  };

  // 自动检测：组件挂载时如果状态为空，自动刷新一次
  useEffect(() => {
    if (!status) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isConnected = status?.connected === true;
  const isConfigured = status?.configured === true;

  return (
    <div>
      {/* 标题区 */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: isConnected
              ? "rgba(82, 196, 26, 0.1)"
              : "rgba(0, 102, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <ApiOutlined
            style={{
              fontSize: 28,
              color: isConnected ? "#52c41a" : "#0066ff",
            }}
          />
        </div>
        <Typography.Title level={4} style={{ margin: 0, color: "#1f2329" }}>
          配置 Gateway
        </Typography.Title>
        <Typography.Text
          type="secondary"
          style={{ display: "block", marginTop: 8, maxWidth: 480, margin: "8px auto 0" }}
        >
          MineEcho Gateway 负责与各大模型提供商通信
        </Typography.Text>
      </div>

      {/* 状态卡片 */}
      <Card
        style={{
          borderRadius: 12,
          border: `1px solid ${isConnected ? "#b7eb8f" : "#e8ecf1"}`,
          background: isConnected ? "#f6ffed" : "#fff",
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Space size={16} align="center">
            {status === null || checking ? (
              <Spin size="default" />
            ) : isConnected ? (
              <CheckCircleOutlined
                style={{ fontSize: 24, color: "#52c41a" }}
              />
            ) : (
              <CloseCircleOutlined
                style={{ fontSize: 24, color: "#ff4d4f" }}
              />
            )}

            <div>
              <Typography.Text
                strong
                style={{
                  fontSize: 16,
                  color: isConnected
                    ? "#52c41a"
                    : status === null || checking
                      ? "#1f2329"
                      : "#ff4d4f",
                }}
              >
                {status === null || checking
                  ? "检测中..."
                  : isConnected
                    ? "已连接"
                    : "未连接"}
              </Typography.Text>
              {status?.url && (
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", fontSize: 13, marginTop: 2 }}
                >
                  {status.url}
                </Typography.Text>
              )}
            </div>
          </Space>

          <Space>
            {isConnected && (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                运行正常
              </Tag>
            )}
            {isConfigured && !isConnected && (
              <Tag color="processing">配置完成，连接中...</Tag>
            )}
            <Button
              icon={<ReloadOutlined />}
              loading={checking}
              onClick={handleRefresh}
              size="small"
            >
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      {/* 提示信息 */}
      {isConnected ? (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Gateway 连接正常"
          description="AI 后端服务运行正常，可以继续进行下一步配置。"
          style={{ borderRadius: 8 }}
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="等待 Gateway 启动"
            description={
              <div>
                <p style={{ margin: "0 0 8px" }}>
                  如果刚刚保存了模型配置，Gateway 正在使用最新配置启动，通常需要 10-30 秒。
                </p>
                <p style={{ margin: 0 }}>
                  页面将自动检测连接状态，您也可以点击"刷新"手动检测。
                </p>
              </div>
            }
            style={{ borderRadius: 8 }}
          />

          <div
            style={{
              background: "#f5f7fa",
              padding: "16px 20px",
              borderRadius: 8,
              border: "1px solid #e8ecf1",
            }}
          >
            <Typography.Text
              strong
              style={{ color: "#1f2329", fontSize: 14 }}
            >
              排查建议：
            </Typography.Text>
            <ul
              style={{
                margin: "10px 0 0",
                paddingLeft: 20,
                color: "#646a73",
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              <li>确认上一步的 API Key 已正确保存</li>
              <li>检查 Gateway 服务是否已启动（Docker 容器或桌面进程）</li>
              <li>如果是容器部署，检查端口映射是否正确</li>
              <li>查看控制台日志获取详细错误信息</li>
            </ul>
          </div>
        </Space>
      )}
    </div>
  );
}
