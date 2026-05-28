import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, Tabs, message, Divider } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  invitationCode: string;
}

export function LoginPage() {
  const [loginForm] = Form.useForm<LoginForm>();
  const [registerForm] = Form.useForm<RegisterForm>();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 登录/注册成功后的跳转目标
  const getRedirectPath = () => {
    // 需要检查初始化状态来决定跳转
    // 由于 AuthContext 会在登录后更新 needsInit，我们先检查本地存储或默认跳转
    // 实际跳转逻辑由 App.tsx 的 LoginRoute 守卫处理
    return "/chat";
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(getRedirectPath(), { replace: true });
    return null;
  }

  const handleLogin = async (values: LoginForm) => {
    setLoginLoading(true);
    try {
      const result = await login(values.email, values.password);
      if (result.success) {
        message.success("登录成功");
        // 登录成功后检查是否需要初始化
        try {
          const res = await fetch("/api/init/status");
          const data = await res.json();
          // API返回 needsInit 字段：true=需要初始化，false=已配置
          navigate(data.needsInit ? "/init" : "/chat", { replace: true });
        } catch {
          // 如果检查失败，默认跳转到 chat
          navigate("/chat", { replace: true });
        }
      } else {
        message.error(result.error || "登录失败");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (values: RegisterForm) => {
    // Validate password match
    if (values.password !== values.confirmPassword) {
      message.error("两次输入的密码不一致");
      return;
    }

    // Validate password strength
    if (values.password.length < 8) {
      message.error("密码长度至少8位");
      return;
    }

    setRegisterLoading(true);
    try {
      const result = await register(values.email, values.password, values.name, values.invitationCode);
      if (result.success) {
        message.success("注册成功");
        // 注册成功后检查是否需要初始化
        try {
          const res = await fetch("/api/init/status");
          const data = await res.json();
          // API返回 needsInit 字段：true=需要初始化，false=已配置
          navigate(data.needsInit ? "/init" : "/chat", { replace: true });
        } catch {
          // 如果检查失败，默认跳转到 chat
          navigate("/chat", { replace: true });
        }
      } else {
        message.error(result.error || "注册失败");
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      {/* 主卡片 */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e8ecf1",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
        }}
      >
        {/* 顶部品牌栏 */}
        <div
          style={{
            padding: "32px 32px 16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#0066ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <span style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>S</span>
          </div>
          <Typography.Text
            strong
            style={{ fontSize: 24, color: "#1f2329" }}
          >
            MineEcho
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 14, display: "block", marginTop: 4 }}>
            职场人的 AI 伴侣
          </Typography.Text>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: "0 32px" }}
          items={[
            {
              key: "login",
              label: "登录",
              children: (
                <Form
                  form={loginForm}
                  layout="vertical"
                  onFinish={handleLogin}
                  style={{ paddingBottom: 24 }}
                >
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: "请输入邮箱" },
                      { type: "email", message: "请输入有效的邮箱地址" }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="请输入邮箱"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: "请输入密码" }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="请输入密码"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loginLoading}
                      block
                      size="large"
                      style={{ borderRadius: 8, height: 48 }}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "register",
              label: "注册",
              children: (
                <Form
                  form={registerForm}
                  layout="vertical"
                  onFinish={handleRegister}
                  style={{ paddingBottom: 24 }}
                >
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[
                      { required: true, message: "请输入姓名" },
                      { min: 2, message: "姓名至少2个字符" }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="请输入姓名"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: "请输入邮箱" },
                      { type: "email", message: "请输入有效的邮箱地址" }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="请输入邮箱"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[
                      { required: true, message: "请输入密码" },
                      { min: 8, message: "密码至少8位" }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="密码至少8位"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="确认密码"
                    rules={[
                      { required: true, message: "请确认密码" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("两次输入的密码不一致"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="请再次输入密码"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name="invitationCode"
                    label="邀请码（选填）"
                  >
                    <Input
                      prefix={<KeyOutlined style={{ color: "#8c8c8c" }} />}
                      placeholder="如有邀请码请输入"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={registerLoading}
                      block
                      size="large"
                      style={{ borderRadius: 8, height: 48 }}
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        {/* 底部提示 */}
        <Divider style={{ margin: "0 0 16px" }} />
        <div style={{ textAlign: "center", paddingBottom: 24 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            登录即表示同意 MineEcho 的服务条款和隐私政策
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}