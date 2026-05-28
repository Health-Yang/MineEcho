import { useState, useEffect } from "react";
import { Card, Table, Button, Space, Tag, Modal, Input, message, Typography } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";

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

export function PairingPage() {
  const [sessions] = useState<PairingSession[]>([]);
  const [stats, setStats] = useState<PairingStats>({
    totalSessions: 0,
    pendingSessions: 0,
    verifiedSessions: 0,
    expiredSessions: 0
  });
  const [loading, setLoading] = useState(false);
  const [manualPairModal, setManualPairModal] = useState(false);
  const [manualPairForm, setManualPairForm] = useState({
    channelId: '',
    userId: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/pairing/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch pairing stats:', error);
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
      fetchStats();
    } catch (error) {
      message.error('操作失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch("/api/pairing/cleanup", {
        method: "POST",
      });

      await response.json();
      message.success('清理完成');
      fetchStats();
    } catch (error) {
      message.error('清理失败: ' + (error as Error).message);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'orange', text: '待配对', icon: <ExclamationCircleOutlined /> },
      verified: { color: 'green', text: '已配对', icon: <CheckCircleOutlined /> },
      expired: { color: 'red', text: '已过期', icon: <ExclamationCircleOutlined /> },
      cancelled: { color: 'gray', text: '已取消', icon: <DeleteOutlined /> }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '会话 ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <code style={{ fontSize: '12px' }}>{id}</code>
    },
    {
      title: '通道',
      dataIndex: 'channelId',
      key: 'channelId',
      render: (channelId: string) => <Tag color="blue">{channelId}</Tag>
    },
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
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleString('zh-CN')
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt: string) => new Date(expiresAt).toLocaleString('zh-CN')
    },
    {
      title: '配对时间',
      dataIndex: 'verifiedAt',
      key: 'verifiedAt',
      render: (verifiedAt: string) => verifiedAt ? new Date(verifiedAt).toLocaleString('zh-CN') : '-'
    }
  ];

  return (
    <div>
      <Typography.Title level={5}>配对管理</Typography.Title>
      <Typography.Paragraph type="secondary">
        管理通道配对认证。用户首次与机器人对话时需要输入配对码完成认证。
      </Typography.Paragraph>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{stats.totalSessions}</div>
            <div style={{ color: '#666' }}>总会话数</div>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>{stats.pendingSessions}</div>
            <div style={{ color: '#666' }}>待配对</div>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{stats.verifiedSessions}</div>
            <div style={{ color: '#666' }}>已配对</div>
          </div>
        </Card>
        <Card size="small">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>{stats.expiredSessions}</div>
            <div style={{ color: '#666' }}>已过期</div>
          </div>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
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
      </div>

      {/* 配对会话表格 */}
      <Card title="配对会话" size="small">
        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无配对会话' }}
        />
      </Card>

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