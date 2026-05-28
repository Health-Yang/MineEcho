import { useState, useEffect } from "react";
import { List, Switch, Typography, Card, Button, Space, Tag, Badge, Drawer, message } from "antd";
import {
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  ExperimentOutlined
} from "@ant-design/icons";

interface Channel {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
  description: string;
  type: 'web' | 'feishu' | 'wework' | 'dingtalk';
  security?: {
    dmPolicy: 'pairing' | 'allowlist' | 'open' | 'disabled';
    allowFrom: string[];
  };
  credentials?: any;
  status?: {
    connected: boolean;
    lastSeen?: string;
    quality: 'excellent' | 'good' | 'poor' | 'disconnected';
    errorMessage?: string;
  };
  healthFeatures?: {
    alertForwarding: boolean;
    emergencyNotifications: boolean;
  };
}

interface ChannelConfigDrawerProps {
  channel: Channel | null;
  visible: boolean;
  onClose: () => void;
  onSave: (channelId: string, config: any) => Promise<void>;
  onTest: (channelId: string) => Promise<any>;
  onConnect: (channelId: string) => Promise<void>;
  onDisconnect: (channelId: string) => Promise<void>;
}

function ChannelConfigDrawer({
  channel,
  visible,
  onClose,
  onSave,
  onTest,
  onConnect,
  onDisconnect
}: ChannelConfigDrawerProps) {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (channel) {
      setConfig({
        credentials: channel.credentials || {},
        security: channel.security || { dmPolicy: 'pairing', allowFrom: [] },
        healthFeatures: channel.healthFeatures || { alertForwarding: false, emergencyNotifications: false }
      });
      setTestResult(null);
    }
  }, [channel]);

  const handleSave = async () => {
    if (!channel) return;

    setLoading(true);
    try {
      await onSave(channel.id, config);
      message.success('配置保存成功');
      onClose();
    } catch (error) {
      message.error('配置保存失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!channel) return;

    setTesting(true);
    try {
      const result = await onTest(channel.id);
      setTestResult(result);
      if (result.success) {
        message.success('连接测试成功');
      } else {
        message.warning('连接测试失败: ' + result.message);
      }
    } catch (error) {
      message.error('连接测试失败: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!channel) return;

    setConnecting(true);
    try {
      await onConnect(channel.id);
      message.success('连接建立成功');
    } catch (error) {
      message.error('连接失败: ' + (error as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!channel) return;

    setConnecting(true);
    try {
      await onDisconnect(channel.id);
      message.success('连接已断开');
    } catch (error) {
      message.error('断开连接失败: ' + (error as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const renderCredentialFields = () => {
    if (!channel) return null;

    switch (channel.type) {
      case 'feishu':
        return (
          <>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>App ID</Typography.Text>
              <input
                type="text"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.appId || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, appId: e.target.value }
                })}
                placeholder="飞书应用 App ID"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>App Secret</Typography.Text>
              <input
                type="password"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.appSecret || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, appSecret: e.target.value }
                })}
                placeholder="飞书应用 App Secret"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Encrypt Key（可选）</Typography.Text>
              <input
                type="password"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.encryptKey || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, encryptKey: e.target.value }
                })}
                placeholder="事件加密 Key"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Verification Token（可选）</Typography.Text>
              <input
                type="password"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.verificationToken || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, verificationToken: e.target.value }
                })}
                placeholder="事件验证 Token"
              />
            </div>
          </>
        );

      case 'wework':
        return (
          <>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Corp ID</Typography.Text>
              <input
                type="text"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.corpId || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, corpId: e.target.value }
                })}
                placeholder="企业微信 Corp ID"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Agent ID</Typography.Text>
              <input
                type="text"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.agentId || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, agentId: e.target.value }
                })}
                placeholder="应用 Agent ID"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Secret</Typography.Text>
              <input
                type="password"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.appSecret || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, appSecret: e.target.value }
                })}
                placeholder="应用 Secret"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Callback URL</Typography.Text>
              <input
                type="url"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.callbackUrl || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, callbackUrl: e.target.value }
                })}
                placeholder="https://your-domain.com/api/channels/wework/callback"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Callback Token</Typography.Text>
              <input
                type="password"
                style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
                value={config.credentials?.callbackToken || ''}
                onChange={(e) => setConfig({
                  ...config,
                  credentials: { ...config.credentials, callbackToken: e.target.value }
                })}
                placeholder="回调验证 Token"
              />
            </div>
          </>
        );

      default:
        return (
          <Typography.Paragraph type="secondary">
            该通道类型暂无需配置的凭证信息
          </Typography.Paragraph>
        );
    }
  };

  if (!channel) return null;

  return (
    <Drawer
      title={`${channel.name} 配置`}
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={5}>连接状态</Typography.Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Badge
            status={channel.status?.connected ? 'success' : 'error'}
            text={channel.status?.connected ? '已连接' : '未连接'}
          />
          {channel.status?.quality && (
            <Tag color={
              channel.status.quality === 'excellent' ? 'green' :
              channel.status.quality === 'good' ? 'blue' :
              channel.status.quality === 'poor' ? 'orange' : 'red'
            }>
              {channel.status.quality === 'excellent' ? '优秀' :
               channel.status.quality === 'good' ? '良好' :
               channel.status.quality === 'poor' ? '较差' : '断开'}
            </Tag>
          )}
        </div>
        <Space>
          <Button
            icon={<ApiOutlined />}
            onClick={handleConnect}
            loading={connecting}
            disabled={channel.status?.connected}
          >
            连接
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={handleDisconnect}
            loading={connecting}
            disabled={!channel.status?.connected}
          >
            断开
          </Button>
          <Button
            icon={<ExperimentOutlined />}
            onClick={handleTest}
            loading={testing}
          >
            测试连接
          </Button>
        </Space>
        {testResult && (
          <div style={{ marginTop: 12, padding: 12, background: testResult.success ? '#f6ffed' : '#fff2f0', border: `1px solid ${testResult.success ? '#b7eb8f' : '#ffb3b3'}`, borderRadius: 4 }}>
            <Typography.Text style={{ color: testResult.success ? '#52c41a' : '#ff4d4f' }}>
              {testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              {' '}{testResult.message}
            </Typography.Text>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={5}>凭证配置</Typography.Title>
        {renderCredentialFields()}
      </div>

      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={5}>安全设置</Typography.Title>
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>DM 策略</Typography.Text>
          <select
            style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}
            value={config.security?.dmPolicy || 'pairing'}
            onChange={(e) => setConfig({
              ...config,
              security: { ...config.security, dmPolicy: e.target.value }
            })}
          >
            <option value="pairing">配对模式</option>
            <option value="allowlist">白名单</option>
            <option value="open">开放</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
      </div>

      <div>
        <Typography.Title level={5}>健康功能</Typography.Title>
        <div style={{ marginBottom: 12 }}>
          <Switch
            checked={config.healthFeatures?.alertForwarding || false}
            onChange={(checked) => setConfig({
              ...config,
              healthFeatures: { ...config.healthFeatures, alertForwarding: checked }
            })}
          />
          <Typography.Text style={{ marginLeft: 8 }}>健康警报转发</Typography.Text>
        </div>
        <div>
          <Switch
            checked={config.healthFeatures?.emergencyNotifications || false}
            onChange={(checked) => setConfig({
              ...config,
              healthFeatures: { ...config.healthFeatures, emergencyNotifications: checked }
            })}
          />
          <Typography.Text style={{ marginLeft: 8 }}>紧急通知</Typography.Text>
        </div>
      </div>
    </Drawer>
  );
}

export function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch("/api/channels");
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setChannels([]);
    }
  };

  const toggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const updatedChannel = await response.json();
      setChannels((prev) => prev.map((c) => (c.id === updatedChannel.id ? updatedChannel : c)));
      message.success(`${updatedChannel.name} ${enabled ? '已启用' : '已停用'}`);
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message);
    }
  };

  const handleConfigure = (channel: Channel) => {
    setSelectedChannel(channel);
    setDrawerVisible(true);
  };

  const handleSaveConfig = async (channelId: string, config: any) => {
    const response = await fetch(`/api/channels/${channelId}/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '配置保存失败');
    }

    await fetchChannels(); // 刷新列表
  };

  const handleTestConnection = async (channelId: string) => {
    const response = await fetch(`/api/channels/${channelId}/test`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error('连接测试失败');
    }

    return await response.json();
  };

  const handleConnect = async (channelId: string) => {
    const response = await fetch(`/api/channels/${channelId}/connect`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '连接失败');
    }

    await fetchChannels(); // 刷新列表
  };

  const handleDisconnect = async (channelId: string) => {
    const response = await fetch(`/api/channels/${channelId}/disconnect`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '断开连接失败');
    }

    await fetchChannels(); // 刷新列表
  };

  const getStatusIcon = (channel: Channel) => {
    if (channel.type === 'web') {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }

    if (!channel.enabled) {
      return <CloseCircleOutlined style={{ color: '#d9d9d9' }} />;
    }

    if (channel.status?.connected) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getChannelTypeTag = (type: string) => {
    const typeMap = {
      web: { color: 'blue', text: 'Web' },
      feishu: { color: 'cyan', text: '飞书' },
      wework: { color: 'green', text: '企业微信' },
      dingtalk: { color: 'orange', text: '钉钉' }
    };

    const typeInfo = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  return (
    <div>
      <Typography.Title level={5}>通道管理</Typography.Title>
      <Typography.Paragraph type="secondary">
        管理 MineEcho 的消息通道。启用并配置后，可以在对应平台与 MineEcho 对话。
      </Typography.Paragraph>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={channels}
        renderItem={(ch) => (
          <List.Item>
            <Card
              size="small"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeft: `4px solid ${ch.status?.connected ? '#52c41a' : ch.enabled ? '#faad14' : '#d9d9d9'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{ch.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography.Text strong>{ch.name}</Typography.Text>
                    {getChannelTypeTag(ch.type)}
                    {getStatusIcon(ch)}
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {ch.description}
                  </Typography.Text>
                  {ch.status?.connected && ch.status.lastSeen && (
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        最后活动: {new Date(ch.status.lastSeen).toLocaleString('zh-CN')}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              </div>

              <Space>
                {ch.type !== 'web' && (
                  <Button
                    icon={<SettingOutlined />}
                    size="small"
                    onClick={() => handleConfigure(ch)}
                    title="配置"
                  />
                )}
                <Switch
                  checked={ch.enabled}
                  onChange={(v) => toggle(ch.id, v)}
                  disabled={ch.type === 'web'} // Web 通道始终启用
                />
              </Space>
            </Card>
          </List.Item>
        )}
      />

      <ChannelConfigDrawer
        channel={selectedChannel}
        visible={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedChannel(null);
        }}
        onSave={handleSaveConfig}
        onTest={handleTestConnection}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}
