import { useState } from "react";
import { Card, Button, Typography, Space, Alert, Spin, Result } from "antd";
import { ExperimentOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, MessageOutlined } from "@ant-design/icons";

interface TestStepProps {
  onTest: () => Promise<{ ok: boolean; content?: string; error?: string }>;
  onGoToChat: () => void;
  gatewayConnected: boolean;
}

export function TestStep({ onTest, onGoToChat, gatewayConnected }: TestStepProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; content?: string; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await onTest();
      setResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title="测试验证" bordered={false}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {!result ? (
          <>
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <ExperimentOutlined style={{ fontSize: 64, color: "#1677ff", marginBottom: 16 }} />
              <Typography.Title level={4}>准备就绪</Typography.Title>
              <Typography.Paragraph type="secondary">
                配置已完成，发送测试消息验证 AI 连接
              </Typography.Paragraph>

              {!gatewayConnected && (
                <Alert
                  type="warning"
                  showIcon
                  message="Gateway 未连接"
                  description="请返回第一步检查 Gateway 状态"
                  style={{ marginBottom: 16, textAlign: "left" }}
                />
              )}
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={testing ? <Spin size="small" /> : <ExperimentOutlined />}
              loading={testing}
              onClick={handleTest}
              disabled={!gatewayConnected}
            >
              {testing ? "测试中..." : "发送测试消息"}
            </Button>

            <Button type="link" block onClick={onGoToChat} disabled={!gatewayConnected}>
              跳过测试，直接进入聊天
            </Button>
          </>
        ) : result.ok ? (
          <Result
            status="success"
            title="测试成功！"
            subTitle="AI 连接正常，可以开始使用"
            icon={<CheckCircleOutlined />}
            extra={[
              <Button type="primary" key="chat" onClick={onGoToChat} icon={<MessageOutlined />}>
                开始聊天
              </Button>,
              <Button key="again" onClick={() => setResult(null)} icon={<ReloadOutlined />}>
                再次测试
              </Button>,
            ]}
          >
            <div style={{ background: "#f6ffed", padding: 16, borderRadius: 8, textAlign: "left" }}>
              <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                AI 回复：
              </Typography.Text>
              <Typography.Text>{result.content}</Typography.Text>
            </div>
          </Result>
        ) : (
          <Result
            status="error"
            title="测试失败"
            subTitle={result.error || "无法连接到 AI 服务"}
            icon={<CloseCircleOutlined />}
            extra={[
              <Button type="primary" key="retry" onClick={handleTest} loading={testing} icon={<ReloadOutlined />}>
                重试
              </Button>,
              <Button key="back" onClick={() => setResult(null)}>
                返回修改配置
              </Button>,
            ]}
          >
            <Alert
              type="info"
              showIcon
              message="排查建议"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>检查 API Key 是否正确</li>
                  <li>确认 Gateway 已连接</li>
                  <li>查看模型配置是否正确</li>
                  <li>检查网络连接</li>
                </ul>
              }
            />
          </Result>
        )}
      </Space>
    </Card>
  );
}
