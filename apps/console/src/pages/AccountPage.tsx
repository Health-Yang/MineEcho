import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Descriptions, Button, Table, Tag, Space, message, Modal, Form, Input, Row, Col, Popconfirm, List, Avatar, Divider } from "antd";
import { UserOutlined, LogoutOutlined, CopyOutlined, DeleteOutlined, PlusOutlined, KeyOutlined, TeamOutlined, SwapOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: number;
  plan: string;
}

interface Invitation {
  id: string;
  code: string;
  used: boolean;
  used_by?: string;
  created_at: number;
  expires_at?: number;
}

interface UsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  period_start: string;
  period_end: string;
}

export function AccountPage() {
  const { user, logout, token, accounts, switchAccount, removeAccount, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  // Fetch account info
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch account details
        const accountRes = await fetch("/api/accounts", { headers });
        if (accountRes.ok) {
          const accountData = await accountRes.json();
          if (Array.isArray(accountData) && accountData.length > 0) {
            setAccount(accountData[0]);
          } else if (accountData.id) {
            setAccount(accountData);
          }
        }

        // Fetch invitations
        const inviteRes = await fetch("/api/invitations", { headers });
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          setInvitations(Array.isArray(inviteData) ? inviteData : []);
        }

        // Fetch usage stats
        const statsRes = await fetch("/api/usage/stats", { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUsageStats(statsData);
        }
      } catch (err) {
        console.error("Failed to fetch account data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleCreateInvitation = async (values: { count?: number }) => {
    setCreateLoading(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ count: values.count || 1 })
      });

      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || "创建邀请码失败");
        return;
      }

      message.success("邀请码创建成功");
      setCreateModalOpen(false);
      createForm.resetFields();

      // Refresh invitations list
      const inviteRes = await fetch("/api/invitations", { headers: { Authorization: `Bearer ${token}` } });
      if (inviteRes.ok) {
        const inviteData = await inviteRes.json();
        setInvitations(Array.isArray(inviteData) ? inviteData : []);
      }
    } catch (err) {
      message.error("网络错误");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        message.error(data.error || "删除失败");
        return;
      }

      message.success("邀请码已删除");
      setInvitations(invitations.filter(inv => inv.id !== id));
    } catch (err) {
      message.error("网络错误");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success("邀请码已复制");
  };

  const handleLogout = () => {
    logout();
    message.success("已退出登录");
    navigate("/login", { replace: true });
  };

  const handleSwitchAccount = async (userId: string) => {
    setSwitchingAccount(userId);
    try {
      await switchAccount(userId);
      message.success("已切换账号");
      setAccountModalOpen(false);
      // 刷新页面以更新所有数据
      window.location.reload();
    } catch (err) {
      message.error("切换账号失败");
    } finally {
      setSwitchingAccount(null);
    }
  };

  const handleRemoveAccount = (userId: string) => {
    removeAccount(userId);
    message.success("已移除账号");
    if (accounts.length <= 1) {
      // 如果是最后一个账号，登出并跳转登录页
      logoutAll();
      navigate("/login", { replace: true });
    }
  };

  const invitationColumns = [
    {
      title: "邀请码",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Space>
          <Typography.Text code copyable={{ text: code }}>{code}</Typography.Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyCode(code)} />
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "used",
      key: "used",
      render: (used: boolean, record: Invitation) => (
        used ? (
          <Tag color="success">已使用{record.used_by ? ` by ${record.used_by}` : ""}</Tag>
        ) : (
          <Tag color="default">未使用</Tag>
        )
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (ts: number) => new Date(ts).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Invitation) => (
        !record.used && (
          <Popconfirm
            title="确定删除此邀请码？"
            onConfirm={() => handleDeleteInvitation(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        )
      ),
    },
  ];

  if (!token) {
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        <TeamOutlined style={{ marginRight: 8 }} />
        账号管理
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {/* 账号信息卡片 */}
        <Col xs={24} lg={12}>
          <Card
            title="账号信息"
            extra={
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                退出登录
              </Button>
            }
            loading={loading}
          >
            <Descriptions column={1}>
              <Descriptions.Item label="用户">
                <Space>
                  <UserOutlined />
                  {user?.name || "未设置"}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space>
                  {user?.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color="blue">{user?.role || "用户"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("zh-CN") : "—"}
              </Descriptions.Item>
              {account?.plan && (
                <Descriptions.Item label="套餐">
                  <Tag color="green">{account.plan}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* 使用统计卡片 */}
        <Col xs={24} lg={12}>
          <Card title="使用统计" loading={loading}>
            {usageStats ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="总请求数">
                  <Typography.Text style={{ color: "#0066ff" }}>{usageStats.total_requests.toLocaleString()}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="总 Token">
                  <Typography.Text style={{ color: "#00b365" }}>{usageStats.total_tokens.toLocaleString()}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="总费用">
                  <Typography.Text style={{ color: "#fa8c16" }}>¥{usageStats.total_cost.toFixed(2)}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="统计周期">
                  {usageStats.period_start ? new Date(usageStats.period_start).toLocaleDateString("zh-CN") : "—"} 至今
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Typography.Text type="secondary">暂无统计数据</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 多账号管理卡片 */}
      <Card
        title={<><TeamOutlined style={{ marginRight: 8 }} />多账号管理</>}
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button icon={<SwapOutlined />} onClick={() => setAccountModalOpen(true)}>
              管理账号
            </Button>
            <Button type="primary" onClick={() => navigate("/login")}>
              添加账号
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          {accounts.slice(0, 3).map((acc) => (
            <Col xs={24} sm={8} key={acc.userId}>
              <Card
                size="small"
                style={{
                  borderColor: acc.userId === user?.id ? "#0066ff" : "#e8ecf1",
                  background: acc.userId === user?.id ? "#f0f5ff" : "#fff"
                }}
                bodyStyle={{ padding: 12 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar
                    size={40}
                    style={{ background: acc.userId === user?.id ? "#0066ff" : "#8c8c8c" }}
                    icon={<UserOutlined />}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong style={{ display: "block" }} ellipsis>
                      {acc.name || acc.email.split("@")[0]}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                      {acc.email}
                    </Typography.Text>
                  </div>
                  {acc.userId === user?.id && (
                    <Tag color="blue" icon={<CheckCircleFilled />}>当前</Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))}
          {accounts.length === 0 && (
            <Col span={24}>
              <Typography.Text type="secondary">暂无已保存的账号</Typography.Text>
            </Col>
          )}
        </Row>
      </Card>

      {/* 邀请管理卡片 */}
      <Card
        title={<><KeyOutlined style={{ marginRight: 8 }} />邀请管理</>}
        style={{ marginTop: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            创建邀请码
          </Button>
        }
        loading={loading}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          创建邀请码供他人注册，每个邀请码仅限使用一次。
        </Typography.Paragraph>
        <Table
          dataSource={invitations}
          columns={invitationColumns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "暂无邀请码" }}
        />
      </Card>

      {/* 创建邀请码弹窗 */}
      <Modal
        title="创建邀请码"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateInvitation}
          initialValues={{ count: 1 }}
        >
          <Form.Item
            name="count"
            label="数量"
            extra="一次最多创建10个邀请码"
          >
            <Input type="number" min={1} max={10} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 多账号切换弹窗 */}
      <Modal
        title="管理账号"
        open={accountModalOpen}
        onCancel={() => setAccountModalOpen(false)}
        footer={null}
        width={480}
      >
        <List
          dataSource={accounts}
          renderItem={(acc) => (
            <List.Item
              key={acc.userId}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #f0f0f0",
                background: acc.userId === user?.id ? "#f0f5ff" : "transparent",
                borderRadius: 8,
                marginBottom: 8,
              }}
              actions={[
                acc.userId !== user?.id && (
                  <Button
                    key="switch"
                    type="link"
                    icon={<SwapOutlined />}
                    onClick={() => handleSwitchAccount(acc.userId)}
                    loading={switchingAccount === acc.userId}
                  >
                    切换
                  </Button>
                ),
                accounts.length > 1 && (
                  <Popconfirm
                    key="remove"
                    title="确定移除此账号？"
                    description="移除后需要重新登录"
                    onConfirm={() => handleRemoveAccount(acc.userId)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      移除
                    </Button>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    style={{ background: acc.userId === user?.id ? "#0066ff" : "#8c8c8c" }}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <Space>
                    <span>{acc.name || acc.email.split("@")[0]}</span>
                    {acc.userId === user?.id && <Tag color="blue">当前账号</Tag>}
                  </Space>
                }
                description={
                  <Typography.Text type="secondary">
                    {acc.email}
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      上次登录: {new Date(acc.lastLoginAt).toLocaleString("zh-CN")}
                    </Typography.Text>
                  </Typography.Text>
                }
              />
            </List.Item>
          )}
        />
        <Divider />
        <div style={{ textAlign: "center" }}>
          <Button type="primary" onClick={() => { setAccountModalOpen(false); navigate("/login"); }}>
            添加新账号
          </Button>
        </div>
      </Modal>
    </div>
  );
}