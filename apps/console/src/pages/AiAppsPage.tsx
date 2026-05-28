import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Typography,
  message,
  Popconfirm,
  Tag,
  Alert,
  Progress,
  Spin,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  PlayCircleOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { buildAiAppHealthQuery } from "../utils/aiAppHealth";
import { fetchSkillHealth, summarizeSkillHealth, type SkillHealthReport } from "../utils/skillHealth";

interface AiAppConfig {
  endpoint: string;
  apiKey?: string;
  method?: string;
  requestStyle?: "query" | "messages";
  queryKey?: string;
  responseContentPath?: string;
  maxTokens?: number;
}

interface AiApp {
  id: string;
  name: string;
  description: string;
  type: "rag" | "workflow";
  enabled: boolean;
  config: AiAppConfig;
  createdAt?: number;
  updatedAt?: number;
}

const defaultConfig = {
  endpoint: "",
  apiKey: "",
  method: "POST",
  requestStyle: "messages",
  queryKey: "query",
  responseContentPath: "",
  maxTokens: 65536,
};

const HEALTH_STATUS_STYLE = {
  pass: { color: "#52c41a", bg: "#f6ffed", label: "可路由" },
  warn: { color: "#fa8c16", bg: "#fff7e6", label: "需完善" },
  fail: { color: "#ff4d4f", bg: "#fff2f0", label: "未命中" },
} as const;

export function AiAppsPage() {
  const [apps, setApps] = useState<AiApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testingApp, setTestingApp] = useState<AiApp | null>(null);
  const [testMessage, setTestMessage] = useState("你好，请简单介绍一下自己");
  const [testResult, setTestResult] = useState<string>("");
  const [testError, setTestError] = useState<string>("");
  const [testLoading, setTestLoading] = useState(false);
  const [healthReport, setHealthReport] = useState<SkillHealthReport | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/ai-apps")
      .then((r) => r.json())
      .then((d) => setApps(d.apps ?? []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      name: "",
      description: "",
      type: "rag",
      enabled: true,
      ...defaultConfig,
    });
    setModalOpen(true);
  };

  const openEdit = (app: AiApp) => {
    setEditingId(app.id);
    form.setFieldsValue({
      name: app.name,
      description: app.description,
      type: app.type,
      enabled: app.enabled,
      endpoint: app.config.endpoint,
      apiKey: app.config.apiKey ?? "",
      method: app.config.method ?? "POST",
      requestStyle: app.config.requestStyle ?? "messages",
      queryKey: app.config.queryKey ?? "query",
      responseContentPath: app.config.responseContentPath ?? "",
      maxTokens: app.config.maxTokens ?? 65536,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const body = {
      name: values.name,
      description: values.description,
      type: values.type,
      enabled: values.enabled,
      config: {
        endpoint: values.endpoint,
        apiKey: values.apiKey || undefined,
        method: values.method,
        requestStyle: values.requestStyle || "query",
        queryKey: values.queryKey,
        responseContentPath: values.responseContentPath || undefined,
        maxTokens: values.maxTokens ? Number(values.maxTokens) : undefined,
      },
    };
    if (editingId) {
      const res = await fetch(`/api/ai-apps/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        message.error(e.error || "更新失败");
        return;
      }
      message.success("已更新");
    } else {
      const res = await fetch("/api/ai-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        message.error(e.error || "添加失败");
        return;
      }
      message.success("已添加");
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/ai-apps/${id}`, { method: "DELETE" });
    if (!res.ok) {
      message.error("删除失败");
      return;
    }
    message.success("已删除");
    load();
  };

  const toggleEnabled = async (app: AiApp) => {
    const res = await fetch(`/api/ai-apps/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !app.enabled }),
    });
    if (!res.ok) {
      message.error("更新失败");
      return;
    }
    load();
  };

  const openTest = (app: AiApp) => {
    setTestingApp(app);
    const query = buildAiAppHealthQuery(app);
    setTestMessage(query);
    setTestResult("");
    setTestError("");
    setHealthReport(null);
    setHealthError(null);
    setTestModalOpen(true);
    void runRouteHealth(app, query);
  };

  const runRouteHealth = async (app = testingApp, query = testMessage) => {
    if (!app) return;
    setHealthLoading(true);
    setHealthError(null);
    try {
      const report = await fetchSkillHealth(app.id, { query: query.trim() || undefined });
      setHealthReport(report);
    } catch (error) {
      setHealthReport(null);
      setHealthError((error as Error).message || "路由诊断失败");
    } finally {
      setHealthLoading(false);
    }
  };

  const runTest = async () => {
    if (!testingApp) return;
    setTestLoading(true);
    setTestResult("");
    setTestError("");
    try {
      const res = await fetch(`/api/ai-apps/${testingApp.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage }),
      });
      const data = await res.json();
      if (data.error) {
        setTestError(data.error);
      } else {
        setTestResult(data.content || "（无响应内容）");
      }
    } catch (e) {
      setTestError(`请求失败: ${String(e)}`);
    } finally {
      setTestLoading(false);
    }
  };

  const healthSummary = healthReport ? summarizeSkillHealth(healthReport) : null;
  const healthStyle = healthSummary ? HEALTH_STATUS_STYLE[healthSummary.status] : null;

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (t: string, record: AiApp) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{t}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.config.endpoint}
          </Typography.Text>
        </Space>
      ),
    },
    { title: "描述", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (t: string) =>
        t === "rag" ? (
          <Tag color="blue">RAG</Tag>
        ) : (
          <Tag color="purple">工作流</Tag>
        ),
    },
    {
      title: "启用",
      dataIndex: "enabled",
      key: "enabled",
      width: 80,
      render: (_: boolean, record: AiApp) => (
        <Switch
          checked={record.enabled}
          onChange={() => toggleEnabled(record)}
          size="small"
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 180,
      render: (_: unknown, record: AiApp) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => openTest(record)}
          >
            测试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => remove(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        AI 应用
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        对接外部部署的 RAG 或工作流应用。填写访问地址和 API Key 后，对话时会根据描述自动语义匹配并调用。
      </Typography.Paragraph>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            添加应用
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={apps}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingId ? "编辑应用" : "添加应用"}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="应用名称"
            rules={[{ required: true }]}
          >
            <Input placeholder="如：产品知识库助手" />
          </Form.Item>
          <Form.Item
            name="description"
            label="能力描述"
            rules={[{ required: true }]}
            extra="用于对话时的语义匹配。请描述该应用能回答什么问题，关键词会被提取为触发词。"
          >
            <Input.TextArea
              rows={3}
              placeholder="例如：回答产品功能、价格、使用说明等相关问题"
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="应用类型"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "rag", label: "RAG（检索增强生成）" },
                { value: "workflow", label: "工作流" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="enabled"
            label="启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Typography.Title level={5} style={{ marginTop: 8, marginBottom: 16 }}>
            <ApiOutlined style={{ marginRight: 8 }} />
            API 配置
          </Typography.Title>

          <Form.Item
            name="endpoint"
            label="API 地址"
            rules={[{ required: true }]}
            extra="FastGPT 填 base 即可，如 https://xxx.fastgpt.run/api，选 messages 时会自动补全 /v1/chat/completions"
          >
            <Input placeholder="https://你的域名/api 或完整 /api/v1/chat/completions" />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key（可选）">
            <Input.Password placeholder="FastGPT 填应用 API Key（fastgpt-xxx）" />
          </Form.Item>
          <Form.Item name="method" label="请求方法">
            <Select
              options={[
                { value: "POST", label: "POST" },
                { value: "GET", label: "GET" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="requestStyle"
            label="请求体格式"
            tooltip="FastGPT/OpenAI 选「messages」；普通接口选「query」"
          >
            <Select
              options={[
                {
                  value: "messages",
                  label: "messages（FastGPT / OpenAI 对话格式）",
                },
                {
                  value: "query",
                  label: "query（单字段，如 { query: \"用户问题\" }）",
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="queryKey"
            label="请求体中的问题字段名（仅 query 格式时生效）"
          >
            <Input placeholder="默认 query" />
          </Form.Item>
          <Form.Item
            name="responseContentPath"
            label="响应正文路径（可选）"
          >
            <Input placeholder="FastGPT 可留空；或填 choices.0.message.content" />
          </Form.Item>
          <Form.Item
            name="maxTokens"
            label="最大输出 Token"
            extra="默认 65536。请按模型或平台上限设置；过高时上游可能忽略、截断或返回错误。"
          >
            <InputNumber min={512} max={131072} step={1024} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 测试弹窗 */}
      <Modal
        title={testingApp ? `测试: ${testingApp.name}` : "测试应用"}
        open={testModalOpen}
        onOk={runTest}
        onCancel={() => setTestModalOpen(false)}
        okText="发送"
        cancelText="关闭"
        width={560}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Card
            size="small"
            title={
              <Space>
                <ExperimentOutlined />
                <span>自动路由诊断</span>
                {healthSummary && healthStyle && (
                  <Tag color={healthSummary.status === "pass" ? "success" : healthSummary.status === "warn" ? "warning" : "error"}>
                    {healthStyle.label}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Button size="small" loading={healthLoading} onClick={() => runRouteHealth()}>
                检查
              </Button>
            }
          >
            {healthLoading && !healthReport ? (
              <div style={{ textAlign: "center", padding: 12 }}>
                <Spin size="small" />
              </div>
            ) : healthError ? (
              <Alert type="warning" showIcon message="路由诊断不可用" description={healthError} />
            ) : healthReport ? (
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {Object.entries(healthReport.checks).map(([key, check]) => {
                    const style = HEALTH_STATUS_STYLE[check.status];
                    const labelMap: Record<string, string> = {
                      metadata: "元数据",
                      triggers: "触发词",
                      executable: "入口",
                      routing: "路由",
                    };
                    return (
                      <div key={key} style={{ background: style.bg, color: style.color, borderRadius: 6, padding: "6px 8px" }}>
                        <div style={{ fontSize: 11 }}>{labelMap[key] || key}</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{check.status === "pass" ? "通过" : check.status === "warn" ? "关注" : "异常"}</div>
                      </div>
                    );
                  })}
                </div>
                {healthReport.routeScore !== undefined && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>
                      <span>路由置信度</span>
                      <span>{Math.round(healthReport.routeScore * 100)}%</span>
                    </div>
                    <Progress percent={Math.round(healthReport.routeScore * 100)} showInfo={false} size="small" />
                  </div>
                )}
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {healthReport.checks.routing.message}
                </Typography.Text>
              </Space>
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                打开后会自动检查这个 AI 应用是否能被用户问题选中。
              </Typography.Text>
            )}
          </Card>
          <Input
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="输入测试消息，也会用于路由诊断"
            addonBefore="测试问题"
          />
          <Button
            icon={<ExperimentOutlined />}
            loading={healthLoading}
            onClick={() => runRouteHealth()}
            block
          >
            只检查自动路由
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={testLoading}
            onClick={runTest}
            block
          >
            发送测试
          </Button>
          {testError && (
            <Alert
              type="error"
              showIcon
              message="外部 AI 应用调用失败"
              description={testError}
            />
          )}
          {testResult && !testError && (
            <Card
              size="small"
              title="响应结果"
              style={{ background: "#f6ffed" }}
            >
              <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
                {testResult}
              </Typography.Text>
            </Card>
          )}
        </Space>
      </Modal>
    </div>
  );
}
