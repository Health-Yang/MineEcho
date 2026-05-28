import { useState, useEffect } from "react";
import { Card, Typography, Select, Form, Space, Descriptions, Tag, message, Input, Button, Modal, List, Popconfirm } from "antd";
import { WifiOutlined, DisconnectOutlined, CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from "@ant-design/icons";

interface CustomModelItem {
  id: string;
  label: string;
  baseUrl: string;
  modelId: string;
}

interface Config {
  model: { provider: string; model: string; label: string };
  models?: Array<{ id: string; label: string; provider: string; configured?: boolean }>;
  providers?: Array<{ id: string; name: string; envKey: string; configured: boolean }>;
  customModels?: CustomModelItem[];
}

interface GatewayStatus {
  configured: boolean;
  connected?: boolean;
  url: string;
  sessionPrefix?: string;
}

interface MineEchoVersionInfo {
  current: string | null;
  latest: string | null;
  upgradeAvailable: boolean;
  releaseNotes?: string;
  downloadUrl?: string;
  forceUpgrade?: boolean;
  error?: string;
}

export function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [customModelModalOpen, setCustomModelModalOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customModelForm, setCustomModelForm] = useState({ label: "", baseUrl: "", modelId: "default", apiKey: "" });
  const [mineechoVersionInfo, setMineEchoVersionInfo] = useState<MineEchoVersionInfo | null>(null);
  const [_checkingMineEchoVersion, setCheckingMineEchoVersion] = useState(false);

  const loadConfig = () => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  };
  useEffect(() => {
    loadConfig();
  }, []);
  useEffect(() => {
    fetch("/api/chat/gateway-status")
      .then((r) => r.json())
      .then(setGateway)
      .catch(() => setGateway(null));
  }, []);

  const loadMineEchoVersionInfo = () => {
    setCheckingMineEchoVersion(true);
    fetch("/api/version/mineecho")
      .then((r) => r.json())
      .then(setMineEchoVersionInfo)
      .catch(() => setMineEchoVersionInfo(null))
      .finally(() => setCheckingMineEchoVersion(false));
  };

  useEffect(() => {
    loadMineEchoVersionInfo();
  }, []);

  if (!config) return <Typography.Text>加载中…</Typography.Text>;

  return (
    <div>
      <Typography.Title level={5}>设置</Typography.Title>
      <Typography.Paragraph type="secondary">切换对话所用模型；Gateway 连接后生效。</Typography.Paragraph>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card title="Gateway 连接" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="状态">
              {gateway?.connected === true ? (
                <Tag icon={<WifiOutlined />} color="success">已连接</Tag>
              ) : gateway?.configured === true ? (
                <Tag icon={<DisconnectOutlined />} color="warning">未连接（Gateway 可能正在重连）</Tag>
              ) : gateway ? (
                <Tag icon={<DisconnectOutlined />} color="warning">未连接</Tag>
              ) : (
                <Typography.Text type="secondary">检查中…</Typography.Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Gateway URL">
              <Typography.Text copyable code>{gateway?.url ?? "—"}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="会话前缀">
              <Typography.Text code>{gateway?.sessionPrefix ?? "mineecho:"}</Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                会话 ID 会映射为 {gateway?.sessionPrefix ?? "mineecho:"}main、{gateway?.sessionPrefix ?? "mineecho:"}xxx
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            与「初始化」页共用同一套配置；修改后连接会自动重试，若仍未连接可到「初始化」页查看连接诊断。
          </Typography.Text>
        </Card>
        <Card title="MineEcho 版本" size="small" extra={
          <Button type="text" icon={<SyncOutlined />} onClick={loadMineEchoVersionInfo}>
            检查更新
          </Button>
        }>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="当前版本">
              <Typography.Text code>{mineechoVersionInfo?.current ?? "未知"}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="最新版本">
              <Typography.Text code>{mineechoVersionInfo?.latest ?? "未知"}</Typography.Text>
              {mineechoVersionInfo?.upgradeAvailable && (
                <Tag color="success" style={{ marginLeft: 8 }}>可升级</Tag>
              )}
              {mineechoVersionInfo?.forceUpgrade && (
                <Tag color="error" style={{ marginLeft: 4 }}>强制升级</Tag>
              )}
            </Descriptions.Item>
            {mineechoVersionInfo?.releaseNotes && (
              <Descriptions.Item label="发布说明">
                <Typography.Text>{mineechoVersionInfo.releaseNotes}</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>
          {mineechoVersionInfo?.upgradeAvailable && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              href={mineechoVersionInfo.downloadUrl}
              target="_blank"
              style={{ marginTop: 12 }}
            >
              下载新版本 ({mineechoVersionInfo.latest})
            </Button>
          )}
          {!mineechoVersionInfo?.upgradeAvailable && mineechoVersionInfo?.current && (
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
              当前已是最新版本
            </Typography.Text>
          )}
          {mineechoVersionInfo?.error && (
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 12 }}>
              {mineechoVersionInfo.error}
            </Typography.Text>
          )}
        </Card>
        <Card title="当前模型" size="small">
          <Form layout="vertical">
            <Form.Item
              label="模型"
              extra={
                (config.models || []).every((m) => !m.configured)
                  ? "请先在下方「模型配置」中配置至少一个服务商的 API Key 后再选择模型"
                  : undefined
              }
            >
              <Select
                style={{ width: 260 }}
                value={config.model.model}
                options={(config.models || [])
                  .filter((m) => m.configured)
                  .map((m) => ({ label: m.label, value: m.id }))}
                disabled={(config.models || []).length === 0 || (config.models || []).every((m) => !m.configured)}
                onChange={async (id) => {
                  try {
                    const res = await fetch("/api/config", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ model: { model: id } }),
                    });
                    if (!res.ok) {
                      const e = await res.json().catch(() => ({}));
                      message.error(e.error || "切换失败");
                      return;
                    }
                    const data = await res.json();
                    setConfig((c) => (c ? { ...c, model: data.model, models: data.models, providers: data.providers } : c));
                    message.success("已切换模型");
                  } catch {
                    message.error("请求失败");
                  }
                }}
              />
            </Form.Item>
            <Form.Item label="自定义模型" extra="输入 provider/model-id 格式，如 deepseek/deepseekV3 或 minimax-cn/MiniMax-M2.5">
              <Space>
                <Input.Search
                  style={{ width: 260 }}
                  placeholder="deepseek/deepseekV3"
                  enterButton="应用"
                  onSearch={async (value) => {
                    const id = value.trim();
                    if (!id) return;
                    if (!/^[a-z0-9-]+\//.test(id)) {
                      message.error("格式错误，请使用 provider/model-id 格式");
                      return;
                    }
                    try {
                      const res = await fetch("/api/config", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ model: { model: id } }),
                      });
                      if (!res.ok) {
                        const e = await res.json().catch(() => ({}));
                        message.error(e.error || "切换失败");
                        return;
                      }
                      const data = await res.json();
                      setConfig((c) => (c ? { ...c, model: data.model, models: data.models, providers: data.providers } : c));
                      message.success("已切换自定义模型");
                    } catch {
                      message.error("请求失败");
                    }
                  }}
                />
              </Space>
            </Form.Item>
          </Form>
        </Card>
        <Card title="模型配置" size="small">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            为各服务商配置 API Key 后，上方才能选择对应模型，避免误切到未配置模型导致业务中断。
          </Typography.Paragraph>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {(config.providers || []).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ width: 200 }}>
                  {p.name}
                  {p.configured ? (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginLeft: 8 }}>已配置</Tag>
                  ) : (
                    <Tag icon={<CloseCircleOutlined />} style={{ marginLeft: 8 }}>未配置</Tag>
                  )}
                </span>
                <Input.Password
                  placeholder={p.configured ? "输入新 Key 覆盖，留空保存则清除" : "请输入 API Key"}
                  value={providerKeys[p.id] ?? ""}
                  onChange={(e) => setProviderKeys((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  style={{ width: 280 }}
                  allowClear
                />
                <Button
                  type="primary"
                  loading={savingProvider === p.id}
                  onClick={async () => {
                    setSavingProvider(p.id);
                    try {
                      const res = await fetch("/api/config/providers", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                        provider: p.id,
                        ...(providerKeys[p.id] !== undefined ? { apiKey: providerKeys[p.id] } : {}),
                      }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        message.error(data.error || "保存失败");
                        return;
                      }
                      setProviderKeys((prev) => ({ ...prev, [p.id]: "" }));
                      loadConfig();
                      message.success("已保存");
                    } catch {
                      message.error("请求失败");
                    } finally {
                      setSavingProvider(null);
                    }
                  }}
                >
                  保存
                </Button>
              </div>
            ))}
          </Space>
        </Card>
        <Card title="自定义/本地模型" size="small">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            本地部署或自定义 Base URL 的大模型：填写连接地址与可选 API Key，会同步到 MineEcho 模型配置。
          </Typography.Paragraph>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCustomId(null); setCustomModelForm({ label: "", baseUrl: "", modelId: "default", apiKey: "" }); setCustomModelModalOpen(true); }} style={{ marginBottom: 12 }}>
            添加
          </Button>
          <List
            size="small"
            dataSource={config.customModels || []}
            renderItem={(m) => (
              <List.Item
                actions={[
                  <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingCustomId(m.id); setCustomModelForm({ label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, apiKey: "" }); setCustomModelModalOpen(true); }} />,
                  <Popconfirm key="del" title="确定删除？" onConfirm={async () => {
                    const res = await fetch(`/api/config/custom-models/${m.id}`, { method: "DELETE" });
                    if (!res.ok) { message.error("删除失败"); return; }
                    message.success("已删除");
                    loadConfig();
                  }}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <Typography.Text strong>{m.label}</Typography.Text>
                <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{m.baseUrl}</Typography.Text>
                <Tag style={{ marginLeft: 8 }}>{m.modelId}</Tag>
              </List.Item>
            )}
          />
          <Modal
            title={editingCustomId ? "编辑本地模型" : "添加本地模型"}
            open={customModelModalOpen}
            onOk={async () => {
              if (!customModelForm.label.trim() || !customModelForm.baseUrl.trim()) {
                message.error("名称与 Base URL 必填");
                return;
              }
              try {
                if (editingCustomId) {
                  const res = await fetch(`/api/config/custom-models/${editingCustomId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ label: customModelForm.label, baseUrl: customModelForm.baseUrl, modelId: customModelForm.modelId || "default", ...(customModelForm.apiKey !== undefined && customModelForm.apiKey !== "" ? { apiKey: customModelForm.apiKey } : {}) }),
                  });
                  if (!res.ok) { const d = await res.json().catch(() => ({})); message.error(d.error || "更新失败"); return; }
                  message.success("已更新");
                } else {
                  const res = await fetch("/api/config/custom-models", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ label: customModelForm.label, baseUrl: customModelForm.baseUrl, modelId: customModelForm.modelId || "default", apiKey: customModelForm.apiKey || undefined }),
                  });
                  if (!res.ok) { const d = await res.json().catch(() => ({})); message.error(d.error || "添加失败"); return; }
                  message.success("已添加");
                }
                setCustomModelModalOpen(false);
                loadConfig();
              } catch {
                message.error("请求失败");
              }
            }}
            onCancel={() => setCustomModelModalOpen(false)}
            okText={editingCustomId ? "保存" : "添加"}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Form.Item label="名称">
                <Input value={customModelForm.label} onChange={(e) => setCustomModelForm((p) => ({ ...p, label: e.target.value }))} placeholder="如：本地 Ollama" />
              </Form.Item>
              <Form.Item label="Base URL" extra="如 http://localhost:11434/v1（Ollama）">
                <Input value={customModelForm.baseUrl} onChange={(e) => setCustomModelForm((p) => ({ ...p, baseUrl: e.target.value }))} placeholder="http://127.0.0.1:11434/v1" />
              </Form.Item>
              <Form.Item label="模型 ID">
                <Input value={customModelForm.modelId} onChange={(e) => setCustomModelForm((p) => ({ ...p, modelId: e.target.value }))} placeholder="default 或 llama2" />
              </Form.Item>
              <Form.Item label="API Key（可选）">
                <Input.Password value={customModelForm.apiKey} onChange={(e) => setCustomModelForm((p) => ({ ...p, apiKey: e.target.value }))} placeholder="本地可留空" />
              </Form.Item>
            </Space>
          </Modal>
        </Card>
      </Space>
    </div>
  );
}
