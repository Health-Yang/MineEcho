import { useState, useEffect } from "react";
import {
  Card,
  Switch,
  Typography,
  Button,
  Space,
  Tag,
  Badge,
  Drawer,
  message,
  Tabs,
  Table,
  Modal,
  Input,
  Tree,
  Statistic,
  Row,
  Col
} from "antd";
import {
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  ExperimentOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  BarChartOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";

// ==================== 类型定义 ====================

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
  stats?: {
    totalPaired: number;
    pendingPaired: number;
  };
}

interface PairingSession {
  id: string;
  channelId: string;
  userId: string;
  userName?: string;
  status: 'pending' | 'verified' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  verifiedAt?: string;
}

interface PairingStats {
  totalSessions: number;
  pendingSessions: number;
  verifiedSessions: number;
  expiredSessions: number;
}

// ==================== 通道配置抽屉组件 ====================

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

// ==================== 主页面组件 ====================

export function ChannelAndPairingPage() {
  const [activeTab, setActiveTab] = useState('channels');

  // 通道管理状态
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedChannelForPairing, setSelectedChannelForPairing] = useState<string | null>(null);

  // 配对管理状态
  const [sessions, setSessions] = useState<PairingSession[]>([]);
  const [stats, setStats] = useState<PairingStats>({
    totalSessions: 0,
    pendingSessions: 0,
    verifiedSessions: 0,
    expiredSessions: 0
  });
  const [loading, setLoading] = useState(false);
  const [manualPairModal, setManualPairModal] = useState(false);
  const [manualPairForm, setManualPairForm] = useState({ channelId: '', userId: '' });

  // 初始化加载数据
  useEffect(() => {
    fetchChannels();
    fetchPairingData();
  }, []);

  // ==================== 通道管理 API ====================

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

  const toggleChannel = async (id: string, enabled: boolean) => {
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
    await fetchChannels();
  };

  const handleTestConnection = async (channelId: string) => {
    const response = await fetch(`/api/channels/${channelId}/test`, { method: "POST" });
    if (!response.ok) throw new Error('连接测试失败');
    return await response.json();
  };

  const handleConnect = async (channelId: string) => {
    const response = await fetch(`/api/channels/${channelId}/connect`, { method: "POST" });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '连接失败');
    }
    await fetchChannels();
  };

  const handleDisconnect = async (channelId: string) => {
    const response = await fetch(`/api/channels/${channelId}/disconnect`, { method: "POST" });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '断开连接失败');
    }
    await fetchChannels();
  };

  // ==================== 配对管理 API ====================

  const fetchPairingData = async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        fetch("/api/pairing/stats"),
        fetch("/api/pairing/sessions")
      ]);

      const statsData = await statsRes.json();
      const sessionsData = await sessionsRes.json();

      setStats(statsData);
      setSessions(sessionsData.sessions || []);
    } catch (error) {
      console.error('Failed to fetch pairing data:', error);
    }
  };

  const handleManualPair = async () => {
    if (!manualPairForm.channelId || !manualPairForm.userId) {
      message.error('请填写通道ID和用户ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pairing/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualPairForm),
      });

      await response.json();
      message.success('手动配对成功');
      setManualPairModal(false);
      setManualPairForm({ channelId: '', userId: '' });
      fetchPairingData();
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch("/api/pairing/cleanup", { method: "POST" });
      await response.json();
      message.success('清理完成');
      fetchPairingData();
    } catch (error) {
      message.error('清理失败: ' + (error as Error).message);
    }
  };

  // ==================== 渲染辅助函数 ====================

  const getStatusIcon = (channel: Channel) => {
    if (channel.type === 'web') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (!channel.enabled) return <CloseCircleOutlined style={{ color: '#d9d9d9' }} />;
    if (channel.status?.connected) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
  };

  const getChannelTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      web: { color: 'blue', text: 'Web' },
      feishu: { color: 'cyan', text: '飞书' },
      wework: { color: 'green', text: '企业微信' },
      dingtalk: { color: 'orange', text: '钉钉' }
    };
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待配对', icon: <ExclamationCircleOutlined /> },
      verified: { color: 'green', text: '已配对', icon: <CheckCircleOutlined /> },
      expired: { color: 'red', text: '已过期', icon: <ExclamationCircleOutlined /> },
      cancelled: { color: 'gray', text: '已取消', icon: <DeleteOutlined /> }
    };
    const config = statusConfig[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getChannelPairingStats = (channelId: string) => {
    const related = sessions.filter((session) => session.channelId === channelId);
    return {
      totalPaired: related.filter((session) => session.status === 'verified').length,
      pendingPaired: related.filter((session) => session.status === 'pending').length,
    };
  };

  // 构建通道树数据
  const buildChannelTreeData = (): DataNode[] => {
    const grouped = channels.reduce((acc, ch) => {
      const type = ch.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(ch);
      return acc;
    }, {} as Record<string, Channel[]>);

    const typeNames: Record<string, string> = {
      web: 'Web',
      feishu: '飞书',
      wework: '企业微信',
      dingtalk: '钉钉'
    };

    return Object.entries(grouped).map(([type, chs]) => ({
      title: `${typeNames[type] || type} (${chs.length})`,
      key: `type-${type}`,
      icon: <TeamOutlined />,
      children: chs.map(ch => ({
        title: (
          <Space>
            <span>{ch.name}</span>
            {ch.status?.connected && <Badge status="success" />}
          </Space>
        ),
        key: ch.id,
        icon: ch.status?.connected ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#d9d9d9' }} />,
      }))
    }));
  };

  // ==================== Tab 内容 ====================

  const renderChannelsTab = () => (
    <div>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        管理 MineEcho 的消息通道。启用并配置后，可以在对应平台与 MineEcho 对话。
      </Typography.Paragraph>

      <div style={{ display: 'grid', gap: 16 }}>
        {channels.map((ch) => (
          (() => {
            const pairingStats = getChannelPairingStats(ch.id);
            return (
          <Card
            key={ch.id}
            size="small"
            style={{
              borderLeft: `4px solid ${ch.status?.connected ? '#52c41a' : ch.enabled ? '#faad14' : '#d9d9d9'}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  {ch.status?.lastSeen && (
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        最后活动: {new Date(ch.status.lastSeen).toLocaleString('zh-CN')}
                      </Typography.Text>
                    </div>
                  )}
                  {/* 配对统计信息 */}
                  <div style={{ marginTop: 4 }}>
                    <Space size="small">
                      <Tag icon={<UserOutlined />} color="blue">
                        已配对: {pairingStats.totalPaired}
                      </Tag>
                      {pairingStats.pendingPaired ? (
                        <Tag color="orange">
                          待处理: {pairingStats.pendingPaired}
                        </Tag>
                      ) : null}
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          setSelectedChannelForPairing(ch.id);
                          setActiveTab('pairing');
                        }}
                      >
                        查看配对
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>

              <Space>
                {ch.type !== 'web' && (
                  <Button
                    icon={<SettingOutlined />}
                    size="small"
                    onClick={() => {
                      setSelectedChannel(ch);
                      setDrawerVisible(true);
                    }}
                    title="配置"
                  />
                )}
                <Switch
                  checked={ch.enabled}
                  onChange={(v) => toggleChannel(ch.id, v)}
                  disabled={ch.type === 'web'}
                />
              </Space>
            </div>
          </Card>
            );
          })()
        ))}
      </div>
    </div>
  );

  const renderPairingTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总会话数"
              value={stats.totalSessions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="待配对"
              value={stats.pendingSessions}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已配对"
              value={stats.verifiedSessions}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已过期"
              value={stats.expiredSessions}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setManualPairModal(true)}
          >
            手动配对
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleCleanup}
          >
            清理会话
          </Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchPairingData}>
          刷新
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧通道树 */}
        <Card size="small" title="通道筛选" style={{ width: 200, flexShrink: 0 }}>
          <Tree
            treeData={[
              { title: '全部通道', key: 'all', icon: <TeamOutlined /> },
              ...buildChannelTreeData()
            ]}
            defaultSelectedKeys={selectedChannelForPairing ? [selectedChannelForPairing] : ['all']}
            onSelect={(keys) => {
              const key = keys[0] as string;
              if (key === 'all') {
                setSelectedChannelForPairing(null);
              } else if (!key.startsWith('type-')) {
                setSelectedChannelForPairing(key);
              }
            }}
          />
        </Card>

        {/* 右侧会话表格 */}
        <Card size="small" title="配对会话" style={{ flex: 1 }}>
          <Table
            columns={[
              { title: '会话 ID', dataIndex: 'id', key: 'id', render: (id: string) => <code style={{ fontSize: '12px' }}>{id}</code> },
              { title: '通道', dataIndex: 'channelId', key: 'channelId', render: (id: string) => <Tag color="blue">{id}</Tag> },
              {
                title: '用户',
                dataIndex: 'userId',
                key: 'userId',
                render: (userId: string, record: PairingSession) => (
                  <div>
                    <div>{userId}</div>
                    {record.userName && (
                      <div style={{ fontSize: '12px', color: '#666' }}>{record.userName}</div>
                    )}
                  </div>
                )
              },
              { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => getStatusTag(status) },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (t: string) => new Date(t).toLocaleString('zh-CN') },
              { title: '过期时间', dataIndex: 'expiresAt', key: 'expiresAt', render: (t: string) => new Date(t).toLocaleString('zh-CN') },
            ]}
            dataSource={selectedChannelForPairing
              ? sessions.filter(s => s.channelId === selectedChannelForPairing)
              : sessions
            }
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无配对会话' }}
            size="small"
          />
        </Card>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总配对会话" value={stats.totalSessions} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已配对" value={stats.verifiedSessions} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待处理" value={stats.pendingSessions} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="已过期" value={stats.expiredSessions} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>
      <Card size="small" title="通道配对分布">
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={channels}
          columns={[
            {
              title: '通道',
              key: 'channel',
              render: (_: unknown, channel: Channel) => (
                <Space>
                  <span>{channel.icon}</span>
                  <span>{channel.name}</span>
                  {getChannelTypeTag(channel.type)}
                </Space>
              ),
            },
            {
              title: '状态',
              key: 'enabled',
              render: (_: unknown, channel: Channel) => channel.enabled ? <Tag color="green">已启用</Tag> : <Tag>已停用</Tag>,
            },
            {
              title: '已配对',
              key: 'verified',
              render: (_: unknown, channel: Channel) => getChannelPairingStats(channel.id).totalPaired,
            },
            {
              title: '待处理',
              key: 'pending',
              render: (_: unknown, channel: Channel) => getChannelPairingStats(channel.id).pendingPaired,
            },
          ]}
          locale={{ emptyText: '暂无通道数据' }}
        />
      </Card>
    </div>
  );

  const items = [
    {
      key: 'channels',
      label: (
        <span>
          <TeamOutlined /> 通道列表
        </span>
      ),
      children: renderChannelsTab()
    },
    {
      key: 'pairing',
      label: (
        <span>
          <SafetyOutlined /> 配对管理
          {stats.pendingSessions > 0 && (
            <Badge count={stats.pendingSessions} size="small" style={{ marginLeft: 8 }} />
          )}
        </span>
      ),
      children: renderPairingTab()
    },
    {
      key: 'statistics',
      label: (
        <span>
          <BarChartOutlined /> 配对统计
        </span>
      ),
      children: renderStatisticsTab()
    }
  ];

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <Typography.Title level={4}>🔌 通道与配对管理</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        管理消息通道和用户配对认证。配置通道后，用户可在对应平台与 MineEcho 对话。
      </Typography.Paragraph>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />

      {/* 通道配置抽屉 */}
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

      {/* 手动配对弹窗 */}
      <Modal
        title="手动配对"
        open={manualPairModal}
        onOk={handleManualPair}
        onCancel={() => {
          setManualPairModal(false);
          setManualPairForm({ channelId: '', userId: '' });
        }}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>通道 ID</Typography.Text>
          <Input
            placeholder="例如：feishu, wework"
            value={manualPairForm.channelId}
            onChange={(e) => setManualPairForm({
              ...manualPairForm,
              channelId: e.target.value
            })}
          />
        </div>
        <div>
          <Typography.Text strong>用户 ID</Typography.Text>
          <Input
            placeholder="用户的 Open ID 或 User ID"
            value={manualPairForm.userId}
            onChange={(e) => setManualPairForm({
              ...manualPairForm,
              userId: e.target.value
            })}
          />
        </div>
        <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
          <Typography.Text style={{ color: '#52c41a' }}>
            💡 手动配对会将用户直接添加到通道白名单，无需输入配对码。
          </Typography.Text>
        </div>
      </Modal>
    </div>
  );
}
