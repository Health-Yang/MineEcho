import { useState } from "react";
import { Card, Input, Button, Typography, message, Steps, Alert } from "antd";
import {
  SafetyOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export function SimplePairingPage() {
  const [pairingCode, setPairingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paired, setPaired] = useState(false);

  const handlePairing = async () => {
    if (!pairingCode || pairingCode.length !== 6) {
      message.error('请输入6位数字配对码');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/page-pairing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: "feishu", // 默认飞书通道
          userId: "current_user", // 实际应该从用户会话获取
          pairingCode: pairingCode.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('配对成功！');
        setPaired(true);
        setCurrentStep(2);
      } else {
        message.error(result.message || '配对失败');
      }
    } catch (error) {
      message.error('配对失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '获取配对码',
      description: '在企业聊天机器人中获取',
      icon: currentStep > 0 ? <CheckCircleOutlined /> : undefined
    },
    {
      title: '输入配对码',
      description: '在下方输入6位数字',
      icon: currentStep > 1 ? <CheckCircleOutlined /> : loading ? <LoadingOutlined /> : undefined
    },
    {
      title: '完成配对',
      description: '开始使用 MineEcho',
      icon: paired ? <CheckCircleOutlined /> : undefined
    }
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={2}>配对认证</Title>
        <Paragraph type="secondary">
          首次使用需要配对认证，确保安全访问
        </Paragraph>
      </div>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />

      {!paired ? (
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>📱 步骤 1：获取配对码</Title>
            <Paragraph>
              1. 打开企业聊天软件（飞书/企业微信/钉钉），找到 <Text strong>MineEcho 机器人</Text><br />
              2. 发送消息：<Text code>获取配对码</Text><br />
              3. 复制收到的 <Text strong>6位数字配对码</Text>
            </Paragraph>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={4}>🔐 步骤 2：输入配对码</Title>
            <Input
              size="large"
              placeholder="请输入6位数字配对码"
              value={pairingCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPairingCode(value);
                if (value.length > 0) {
                  setCurrentStep(1);
                }
              }}
              maxLength={6}
              style={{
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: 8,
                fontWeight: 'bold'
              }}
              disabled={loading}
            />
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                配对码有效期 30 分钟
              </Text>
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handlePairing}
            loading={loading}
            disabled={pairingCode.length !== 6}
          >
            {loading ? '配对中...' : '确认配对'}
          </Button>

          <Alert
            message="提示"
            description="如果没有收到配对码，请确认已在企业聊天软件中添加 MineEcho 机器人。"
            type="info"
            showIcon
            style={{ marginTop: 24 }}
          />
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
            <Title level={3}>✅ 配对成功！</Title>
            <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
              您现在可以正常使用 MineEcho 了
            </Paragraph>
            <Button
              type="primary"
              size="large"
              onClick={() => window.location.href = '/chat'}
            >
              开始使用
            </Button>
          </div>
        </Card>
      )}

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          遇到问题？请联系管理员或查看帮助文档
        </Text>
      </div>
    </div>
  );
}
