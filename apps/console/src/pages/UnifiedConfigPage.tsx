import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, message, Input, Button, Modal, Alert, Segmented, Tag } from "antd";
import {
  ApiOutlined,
  AudioOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  EditOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RightOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { fetchTokenJuiceMetrics, type TokenJuiceMetrics } from "../utils/tokenJuiceMetrics";

interface WorkspaceInfo {
  configured: boolean;
  workspaceRoot: string;
  workspacePath: string | null;
  workspaceName: string | null;
  exists: boolean;
  hostWorkspaceRoot: string | null;
  hostWorkspacePath: string | null;
}

interface CustomModelItem {
  id: string;
  label: string;
  baseUrl: string;
  modelId: string;
  embeddingModelId?: string;
  embeddingDimensions?: number;
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

interface TranscriptionConfig {
  provider: string;
  apiKey: string;
  model: string;
  enabled: boolean;
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

type SettingsSection = "model" | "workspace" | "transcription" | "tokenjuice" | "runtime";

const PROVIDER_OPTIONS = [
  { label: "MiniMax", value: "minimax" },
  { label: "通义千问", value: "dashscope" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "智谱 GLM", value: "zhipu" },
];

const PROVIDER_TO_OPENCLAW: Record<string, string> = {
  minimax: "minimax-cn",
  dashscope: "aliyun",
  deepseek: "deepseek",
  zhipu: "zhipu",
};

const DEFAULT_MODELS: Record<string, string> = {
  minimax: "MiniMax-M2.7",
  dashscope: "qwen-plus",
  deepseek: "deepseek-chat",
  zhipu: "glm-4",
};

const pageStyle: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
};

const sectionStyle: CSSProperties = {
  padding: 20,
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 8,
  fontSize: 13,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: "#646a73",
  marginBottom: 6,
  display: "block",
};

const mutedStyle: CSSProperties = {
  fontSize: 12,
  color: "#8c96a3",
  margin: "6px 0 0",
  lineHeight: 1.6,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "10px 0",
  borderBottom: "1px solid #eef1f5",
};

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#f5f7fa",
            color: "#1f2329",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: 15, lineHeight: 1.35, fontWeight: 650, color: "#1f2329", margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 12, color: "#646a73", margin: "3px 0 0", lineHeight: 1.5 }}>{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatusTile({
  label,
  value,
  tone,
  detail,
  onClick,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "idle";
  detail?: string;
  onClick?: () => void;
}) {
  const color = tone === "ok" ? "#00a36c" : tone === "warn" ? "#b76e00" : "#646a73";
  const bg = tone === "ok" ? "#f0fbf5" : tone === "warn" ? "#fff8e6" : "#f7f9fc";
  const tileStyle: CSSProperties = {
    background: bg,
    border: "1px solid #e8ecf1",
    borderRadius: 10,
    padding: 14,
    minWidth: 0,
    textAlign: "left",
    width: "100%",
    cursor: onClick ? "pointer" : "default",
  };
  const content = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#646a73" }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 650, color: "#1f2329", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
      {detail && <div style={{ fontSize: 11, color: "#8c96a3", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" style={tileStyle} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div style={tileStyle}>
      {content}
    </div>
  );
}

export function UnifiedConfigPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [config, setConfig] = useState<Config | null>(null);
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [mineechoVersionInfo, setMineEchoVersionInfo] = useState<MineEchoVersionInfo | null>(null);
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [tokenJuiceMetrics, setTokenJuiceMetrics] = useState<TokenJuiceMetrics | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>("model");

  const [loading, setLoading] = useState(false);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [customModelModalOpen, setCustomModelModalOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);

  const [workspaceForm] = Form.useForm();
  const [customModelForm] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState<string>("minimax");
  const [modelInput, setModelInput] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");

  const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig | null>(null);
  const [transcriptionApiKey, setTranscriptionApiKey] = useState("");
  const [savingTranscription, setSavingTranscription] = useState(false);

  const isDesktop = typeof window !== "undefined" && !!(window as any).electronAPI;

  useEffect(() => {
    const section = new URLSearchParams(location.search).get("section");
    if (
      section === "model" ||
      section === "workspace" ||
      section === "transcription" ||
      section === "tokenjuice" ||
      section === "runtime"
    ) {
      setActiveSection(section);
    }
  }, [location.search]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) setConfig(await res.json());
    } catch (error) {
      console.error("Load config error:", error);
    }
  }, []);

  const loadTranscriptionConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config/transcription");
      if (res.ok) setTranscriptionConfig(await res.json());
    } catch (error) {
      console.error("Load transcription config error:", error);
    }
  }, []);

  const loadGateway = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/gateway-status");
      if (res.ok) setGateway(await res.json());
    } catch (error) {
      console.error("Load gateway error:", error);
    }
  }, []);

  const loadMineEchoVersionInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/version/mineecho");
      if (res.ok) setMineEchoVersionInfo(await res.json());
    } catch (error) {
      console.error("Load version info error:", error);
    }
  }, []);

  const loadWorkspaceInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/path");
      if (res.ok) setWorkspaceInfo(await res.json());
    } catch (error) {
      console.error("Load workspace info error:", error);
    }
  }, []);

  const loadTokenJuiceMetrics = useCallback(async () => {
    try {
      setTokenJuiceMetrics(await fetchTokenJuiceMetrics());
    } catch (error) {
      console.error("Load TokenJuice metrics error:", error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadTranscriptionConfig();
    loadGateway();
    loadMineEchoVersionInfo();
    loadWorkspaceInfo();
    loadTokenJuiceMetrics();

    const timer = setInterval(() => {
      loadGateway();
      loadTokenJuiceMetrics();
    }, 5000);

    return () => clearInterval(timer);
  }, [loadConfig, loadGateway, loadMineEchoVersionInfo, loadWorkspaceInfo, loadTokenJuiceMetrics, loadTranscriptionConfig]);

  useEffect(() => {
    if (!config?.model?.model) return;
    const model = config.model.model;
    let provider = "minimax";
    if (model.startsWith("minimax-cn/")) provider = "minimax";
    else if (model.startsWith("aliyun/")) provider = "dashscope";
    else if (model.startsWith("deepseek/")) provider = "deepseek";
    else if (model.startsWith("zhipu/")) provider = "zhipu";
    setSelectedProvider(provider);

    const slashIdx = model.indexOf("/");
    setModelInput(slashIdx > 0 ? model.slice(slashIdx + 1) : model);
  }, [config]);

  useEffect(() => {
    if (workspaceInfo?.workspaceName) {
      workspaceForm.setFieldsValue({ workspaceName: workspaceInfo.workspaceName });
    }
  }, [workspaceForm, workspaceInfo?.workspaceName]);

  const onRestartGateway = useCallback(async () => {
    try {
      if (isDesktop) {
        const result = await (window as any).electronAPI.restartGateway();
        if (result.ok) message.info("Gateway 重启中，请等待连接");
        else message.error("重启 Gateway 失败: " + (result.error || "未知错误"));
      } else {
        await fetch("/api/init/restart-gateway", { method: "POST" });
        message.info("Gateway 重启指令已发送，请等待连接");
      }
      setTimeout(loadGateway, 3000);
    } catch (error) {
      console.error("[Config] Restart gateway error:", error);
      message.error("重启 Gateway 失败");
    }
  }, [loadGateway, isDesktop]);

  const handleSaveModelConfig = async () => {
    const trimmedModel = modelInput.trim();
    if (!trimmedModel) {
      message.error("请输入模型名称");
      return;
    }

    const openclawProvider = PROVIDER_TO_OPENCLAW[selectedProvider] || selectedProvider;
    const modelId = `${openclawProvider}/${trimmedModel}`;
    setSavingProvider(selectedProvider);

    try {
      if (apiKeyInput.trim()) {
        const keyRes = await fetch("/api/config/providers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: selectedProvider, apiKey: apiKeyInput.trim() }),
        });
        if (!keyRes.ok) {
          const d = await keyRes.json().catch(() => ({}));
          message.error(d.error || "API Key 保存失败");
          return;
        }
      }

      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: { model: modelId } }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        message.error(e.error || "模型切换失败");
        return;
      }
      const data = await res.json();
      setConfig((c) => (c ? { ...c, model: data.model, models: data.models, providers: data.providers } : c));
      setApiKeyInput("");
      message.success("配置已保存，Gateway 会自动重载");
    } catch {
      message.error("请求失败");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleSaveTranscription = async () => {
    if (!transcriptionApiKey.trim()) {
      message.error("请输入 DashScope API Key");
      return;
    }
    setSavingTranscription(true);
    try {
      const res = await fetch("/api/config/transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "dashscope",
          apiKey: transcriptionApiKey.trim(),
          model: "qwen3-asr-flash-filetrans",
          enabled: true,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        message.error(e.error || "保存失败");
        return;
      }
      setTranscriptionConfig(await res.json());
      setTranscriptionApiKey("");
      message.success("语音转录配置已保存");
    } catch {
      message.error("请求失败");
    } finally {
      setSavingTranscription(false);
    }
  };

  const currentProviderConfig = (config?.providers || []).find((p) => p.id === selectedProvider);
  const configuredProviders = (config?.providers || []).filter((p) => p.configured).length;
  const tokenSaved = tokenJuiceMetrics?.estimatedTokensSaved || 0;

  if (!config) {
    return <div style={{ padding: 24, textAlign: "center", color: "#646a73" }}>加载中...</div>;
  }

  const gatewayNeedsAttention = gateway ? !gateway.connected || !gateway.configured : false;
  const modelNeedsAttention = configuredProviders === 0;
  const workspaceNeedsAttention = workspaceInfo ? !workspaceInfo.configured || !workspaceInfo.exists : false;
  const transcriptionNeedsAttention = transcriptionConfig ? !transcriptionConfig.enabled : false;
  const runtimeNeedsAttention = !!mineechoVersionInfo?.forceUpgrade || !!mineechoVersionInfo?.upgradeAvailable || !!mineechoVersionInfo?.error;

  const summaryItems: Array<{
    key: SettingsSection;
    label: string;
    value: string;
    tone: "ok" | "warn" | "idle";
    detail: string;
  }> = [
    {
      key: "model",
      label: "模型 / Gateway",
      value: gateway
        ? gatewayNeedsAttention || modelNeedsAttention
          ? "需关注"
          : "正常"
        : "检查中",
      tone: !gateway ? "idle" : gatewayNeedsAttention || modelNeedsAttention ? "warn" : "ok",
      detail: gatewayNeedsAttention
        ? gateway?.configured
          ? "Gateway 正在重连"
          : "Gateway 未连接"
        : modelNeedsAttention
          ? "尚未配置模型 API Key"
          : config.model.label || config.model.model,
    },
    {
      key: "workspace",
      label: "工作区",
      value: workspaceInfo ? (workspaceNeedsAttention ? "需关注" : "正常") : "检查中",
      tone: !workspaceInfo ? "idle" : workspaceNeedsAttention ? "warn" : "ok",
      detail: workspaceInfo
        ? workspaceInfo.configured
          ? workspaceInfo.exists
            ? workspaceInfo.workspaceName || "已配置"
            : "目录不存在或不可访问"
          : "尚未配置工作区"
        : "读取工作区状态",
    },
    {
      key: "transcription",
      label: "语音转录",
      value: transcriptionConfig ? (transcriptionNeedsAttention ? "需配置" : "正常") : "检查中",
      tone: !transcriptionConfig ? "idle" : transcriptionNeedsAttention ? "warn" : "ok",
      detail: transcriptionConfig?.enabled ? "DashScope 转录已启用" : "会议音频转文字不可用",
    },
    {
      key: "tokenjuice",
      label: "TokenJuice",
      value: tokenJuiceMetrics ? "可查看" : "检查中",
      tone: tokenJuiceMetrics ? (tokenJuiceMetrics.totalRuns > 0 ? "ok" : "idle") : "idle",
      detail: tokenJuiceMetrics ? `${(tokenJuiceMetrics.totalRuns || 0).toLocaleString()} 次运行，省 ${tokenSaved.toLocaleString()} tokens` : "读取压缩统计",
    },
    {
      key: "runtime",
      label: "运行态 / 发布检查",
      value: mineechoVersionInfo ? (runtimeNeedsAttention ? "需关注" : "正常") : "检查中",
      tone: !mineechoVersionInfo ? "idle" : runtimeNeedsAttention ? "warn" : "ok",
      detail: mineechoVersionInfo?.error
        ? "版本检查失败"
        : mineechoVersionInfo?.forceUpgrade
          ? "有强制升级"
          : mineechoVersionInfo?.upgradeAvailable
            ? "有新版本可下载"
            : mineechoVersionInfo?.current
              ? `当前版本 ${mineechoVersionInfo.current}`
              : "读取版本信息",
    },
  ];

  const renderModelSection = () => (
    <div className="sf-card" style={sectionStyle}>
      <SectionHeader
        icon={<ApiOutlined />}
        title="模型与 Gateway"
        description="配置主模型、服务商 API Key、本地模型和 Gateway 连接状态。"
        action={<Button onClick={loadGateway}>刷新状态</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>当前模型</label>
            <div style={{ padding: "9px 12px", borderRadius: 8, background: "#f7f9fc", color: "#1f2329", fontSize: 13 }}>
              {config.model.label || config.model.model}
            </div>
          </div>

          <div>
            <label style={labelStyle}>模型提供商</label>
            <Segmented
              options={PROVIDER_OPTIONS}
              value={selectedProvider}
              onChange={(v) => {
                setSelectedProvider(v as string);
                setModelInput(DEFAULT_MODELS[v as string] || "");
                setApiKeyInput("");
              }}
              block
            />
          </div>

          <div>
            <label style={labelStyle}>模型名称</label>
            <Input value={modelInput} onChange={(e) => setModelInput(e.target.value)} placeholder="输入模型标识符" style={inputStyle} />
            <p style={mutedStyle}>
              默认: {DEFAULT_MODELS[selectedProvider]} · 最终格式: {PROVIDER_TO_OPENCLAW[selectedProvider]}/{modelInput || DEFAULT_MODELS[selectedProvider]}
              {selectedProvider === "minimax" ? " · Coding Plan 可使用 MiniMax-M2.5-highspeed 或 MiniMax-M2.7-highspeed" : ""}
            </p>
          </div>

          <div>
            <label style={labelStyle}>
              API Key
              {currentProviderConfig?.configured && (
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginLeft: 8 }}>
                  已配置
                </Tag>
              )}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input.Password
                placeholder={currentProviderConfig?.configured ? "输入新 Key 覆盖，留空则只切换模型" : "请输入 API Key"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button type="primary" loading={savingProvider === selectedProvider} onClick={handleSaveModelConfig}>
                保存配置
              </Button>
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #eef1f5", paddingLeft: 18 }}>
          <div style={rowStyle}>
            <span style={{ fontSize: 13, color: "#646a73" }}>Gateway 状态</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {gateway?.connected === true ? (
                <span style={{ color: "#00a36c" }}>
                  <WifiOutlined style={{ marginRight: 4 }} />
                  已连接
                </span>
              ) : gateway?.configured === true ? (
                <span style={{ color: "#b76e00" }}>
                  <DisconnectOutlined style={{ marginRight: 4 }} />
                  重连中
                </span>
              ) : gateway ? (
                <span style={{ color: "#b76e00" }}>
                  <DisconnectOutlined style={{ marginRight: 4 }} />
                  未连接
                </span>
              ) : (
                <span style={{ color: "#8c96a3" }}>检查中...</span>
              )}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: 13, color: "#646a73" }}>Gateway URL</span>
            <code style={{ fontSize: 12, color: "#1f2329", background: "#f5f7fa", padding: "2px 6px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
              {gateway?.url ?? "-"}
            </code>
          </div>
          <div style={{ ...rowStyle, borderBottom: 0 }}>
            <span style={{ fontSize: 13, color: "#646a73" }}>会话前缀</span>
            <code style={{ fontSize: 12, color: "#1f2329", background: "#f5f7fa", padding: "2px 6px", borderRadius: 4 }}>{gateway?.sessionPrefix ?? "mineecho:"}</code>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Button icon={<SyncOutlined />} onClick={onRestartGateway}>
              重启 Gateway
            </Button>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#eef1f5", margin: "20px 0" }} />

      <SectionHeader
        icon={<CodeOutlined />}
        title="自定义/本地模型"
        description="用于接入 Ollama、vLLM、LiteLLM 或企业私有网关等 OpenAI Chat Completions 兼容服务。"
        action={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCustomId(null);
              customModelForm.resetFields();
              customModelForm.setFieldsValue({ label: "", baseUrl: "", modelId: "default", apiKey: "", embeddingModelId: "", embeddingDimensions: undefined });
              setCustomModelModalOpen(true);
            }}
          >
            添加模型
          </Button>
        }
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {(config.customModels || []).map((m) => (
          <div key={m.id} style={rowStyle}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: "#1f2329" }}>{m.label}</div>
              <div style={{ fontSize: 12, color: "#8c96a3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.baseUrl} · {m.modelId}
                {m.embeddingModelId ? ` · Embedding: ${m.embeddingModelId}/${m.embeddingDimensions || "?"}d` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingCustomId(m.id);
                  customModelForm.setFieldsValue({ label: m.label, baseUrl: m.baseUrl, modelId: m.modelId, apiKey: "", embeddingModelId: m.embeddingModelId || "", embeddingDimensions: m.embeddingDimensions });
                  setCustomModelModalOpen(true);
                }}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={async () => {
                  const res = await fetch(`/api/config/custom-models/${m.id}`, { method: "DELETE" });
                  if (!res.ok) {
                    message.error("删除失败");
                    return;
                  }
                  message.success("已删除");
                  loadConfig();
                }}
              />
            </div>
          </div>
        ))}
        {(config.customModels || []).length === 0 && (
          <div style={{ padding: "18px 0", color: "#8c96a3", fontSize: 13 }}>暂无自定义模型。需要接入本机或服务器上的 Ollama、vLLM、LiteLLM、私有网关时可在这里添加。</div>
        )}
      </div>
    </div>
  );

  const renderWorkspaceSection = () => (
    <div className="sf-card" style={sectionStyle}>
      <SectionHeader icon={<FolderOutlined />} title="工作区" description="工作区用于存储技能、缓存、上传文件和生成输出。" />

      {workspaceInfo?.configured && (
        <Alert
          message="当前工作区已配置"
          description={
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div>
                名称: <strong>{workspaceInfo.workspaceName}</strong>
              </div>
              <div>
                容器路径: <code>{workspaceInfo.workspacePath}</code>
              </div>
              {workspaceInfo.hostWorkspacePath && (
                <div>
                  宿主机路径: <code>{workspaceInfo.hostWorkspacePath}</code>
                </div>
              )}
            </div>
          }
          type={workspaceInfo.exists ? "success" : "warning"}
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      <Form form={workspaceForm} layout="vertical" initialValues={{ workspaceName: workspaceInfo?.workspaceName || "default" }}>
        <Form.Item
          label="工作目录名称"
          name="workspaceName"
          rules={[
            { required: true, message: "请输入工作目录名称" },
            { pattern: /^[a-z0-9-_]+$/, message: "只能包含小写字母、数字、连字符和下划线" },
          ]}
        >
          <Input placeholder="default" prefix={<FolderOutlined />} style={inputStyle} />
        </Form.Item>

        <Button
          type="primary"
          loading={loading}
          onClick={async () => {
            try {
              const values = await workspaceForm.validateFields();
              setLoading(true);
              const setupRes = await fetch("/api/workspace/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceName: values.workspaceName }),
              });
              if (!setupRes.ok) {
                const e = await setupRes.json().catch(() => ({}));
                message.error(e.error || "保存失败");
                return;
              }
              await loadWorkspaceInfo();
              message.success("工作目录配置已保存");
            } catch (error) {
              console.error("Save workspace error:", error);
              message.error("保存失败");
            } finally {
              setLoading(false);
            }
          }}
        >
          保存工作区
        </Button>
      </Form>

      <div style={{ marginTop: 18, padding: 14, borderRadius: 8, background: "#f7f9fc", border: "1px solid #eef1f5" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <InfoCircleOutlined style={{ color: "#646a73" }} />
          <span style={{ fontSize: 13, fontWeight: 650, color: "#1f2329" }}>目录结构</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {["skills", "cache", "output", "uploads"].map((name) => (
            <code key={name} style={{ padding: "7px 8px", borderRadius: 6, background: "#fff", color: "#646a73", border: "1px solid #e8ecf1", fontSize: 12 }}>
              {name}/
            </code>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTranscriptionSection = () => (
    <div className="sf-card" style={sectionStyle}>
      <SectionHeader icon={<AudioOutlined />} title="语音转录" description="会议纪要音频转文字配置，与聊天模型 API Key 相互独立。" />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 320px)", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>提供商</label>
            <div style={{ padding: "9px 12px", borderRadius: 8, background: "#f7f9fc", color: "#1f2329", fontSize: 13 }}>
              阿里云 DashScope（Qwen-ASR）
            </div>
          </div>
          <div>
            <label style={labelStyle}>
              API Key
              {transcriptionConfig?.enabled && (
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginLeft: 8 }}>
                  已配置
                </Tag>
              )}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input.Password
                placeholder={transcriptionConfig?.enabled ? "输入新 Key 覆盖" : "请输入 DashScope API Key"}
                value={transcriptionApiKey}
                onChange={(e) => setTranscriptionApiKey(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button type="primary" loading={savingTranscription} onClick={handleSaveTranscription}>
                保存
              </Button>
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderRadius: 8, background: "#f7f9fc", border: "1px solid #eef1f5" }}>
          <div style={{ fontSize: 12, color: "#646a73", marginBottom: 6 }}>当前状态</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: transcriptionConfig?.enabled ? "#00a36c" : "#8c96a3" }}>
            {transcriptionConfig?.enabled ? "可用" : "未配置"}
          </div>
          <p style={mutedStyle}>配置后，“我的会议”可将录音或音频文件转写为会议内容，并进入摘要与承诺项流程。</p>
        </div>
      </div>
    </div>
  );

  const renderTokenJuiceSection = () => (
    <div className="sf-card" style={sectionStyle}>
      <SectionHeader
        icon={<ThunderboltOutlined />}
        title="TokenJuice"
        description="展示工具输出压缩、知识清洗和上下文节省统计。"
        action={<Button onClick={loadTokenJuiceMetrics}>刷新</Button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <StatusTile label="运行次数" value={(tokenJuiceMetrics?.totalRuns || 0).toLocaleString()} tone="idle" />
        <StatusTile label="估算节省" value={`${tokenSaved.toLocaleString()} tokens`} tone={tokenSaved > 0 ? "ok" : "idle"} />
        <StatusTile label="平均压缩率" value={`${Math.round((tokenJuiceMetrics?.averageRatio ?? 1) * 100)}%`} tone="idle" />
      </div>

      {tokenJuiceMetrics?.byFamily?.length ? (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {tokenJuiceMetrics.byFamily.slice(0, 6).map((item) => (
            <div key={item.family} style={{ display: "grid", gridTemplateColumns: "1fr 90px 140px", gap: 10, alignItems: "center", fontSize: 12 }}>
              <span style={{ color: "#1f2329", fontWeight: 600 }}>{item.family}</span>
              <span style={{ color: "#646a73" }}>{item.runs} 次</span>
              <span style={{ color: "#00a36c", textAlign: "right" }}>省 {Math.round(item.savedChars / 4).toLocaleString()} tokens</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={mutedStyle}>暂无压缩记录。导入 URL、工具调用或知识清洗产生压缩后，这里会出现统计。</p>
      )}
    </div>
  );

  const renderRuntimeSection = () => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
      <div className="sf-card" style={sectionStyle}>
        <SectionHeader
          icon={<CloudServerOutlined />}
          title="版本与更新"
          description="查看当前 MineEcho 版本和可用更新。"
          action={
            <Button type="text" icon={<SyncOutlined />} onClick={loadMineEchoVersionInfo}>
              检查更新
            </Button>
          }
        />
        <div style={rowStyle}>
          <span style={{ fontSize: 13, color: "#646a73" }}>当前版本</span>
          <code>{mineechoVersionInfo?.current ?? "未知"}</code>
        </div>
        <div style={rowStyle}>
          <span style={{ fontSize: 13, color: "#646a73" }}>最新版本</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code>{mineechoVersionInfo?.latest ?? "未知"}</code>
            {mineechoVersionInfo?.upgradeAvailable && <Tag color="success">可升级</Tag>}
            {mineechoVersionInfo?.forceUpgrade && <Tag color="error">强制升级</Tag>}
          </div>
        </div>
        {mineechoVersionInfo?.releaseNotes && (
          <p style={{ ...mutedStyle, marginTop: 12 }}>
            发布说明: {mineechoVersionInfo.releaseNotes}
          </p>
        )}
        {mineechoVersionInfo?.upgradeAvailable && (
          <Button type="primary" icon={<SyncOutlined />} href={mineechoVersionInfo.downloadUrl} target="_blank" style={{ marginTop: 12 }}>
            下载新版本
          </Button>
        )}
        {!mineechoVersionInfo?.upgradeAvailable && mineechoVersionInfo?.current && <p style={mutedStyle}>当前已是最新版本。</p>}
      </div>

      <button
        className="sf-card"
        style={{ ...sectionStyle, textAlign: "left", cursor: "pointer", border: "1px solid #e8ecf1" }}
        onClick={() => navigate("/memory")}
      >
        <SectionHeader icon={<DatabaseOutlined />} title="记忆数据" description="进入我的记忆，查看真实 L0-L3 时间线、画像与上下文记录。" action={<RightOutlined />} />
        <p style={{ ...mutedStyle, marginTop: 8 }}>
          设置页只保留运行配置；记忆内容的查看、筛选和诊断集中在“我的记忆”中完成，避免配置项与数据页面混在一起。
        </p>
      </button>
    </div>
  );

  const renderActiveSection = () => {
    if (activeSection === "workspace") return renderWorkspaceSection();
    if (activeSection === "transcription") return renderTranscriptionSection();
    if (activeSection === "tokenjuice") return renderTokenJuiceSection();
    if (activeSection === "runtime") return renderRuntimeSection();
    return renderModelSection();
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1f2329", margin: 0 }}>设置</h2>
          <p style={{ fontSize: 13, color: "#646a73", margin: "6px 0 0" }}>集中管理 MineEcho 的模型、工作区、会议转录和运行状态。</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionHeader icon={<InfoCircleOutlined />} title="状态摘要" description="点击条目可进入对应诊断与配置区域。" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {summaryItems.map((item) => (
            <StatusTile
              key={item.key}
              label={item.label}
              value={item.value}
              tone={item.tone}
              detail={item.detail}
              onClick={() => setActiveSection(item.key)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={activeSection}
          onChange={(value) => setActiveSection(value as SettingsSection)}
          options={[
            { label: "模型与 Gateway", value: "model" },
            { label: "工作区", value: "workspace" },
            { label: "语音转录", value: "transcription" },
            { label: "TokenJuice", value: "tokenjuice" },
            { label: "版本与数据", value: "runtime" },
          ]}
        />
      </div>

      {renderActiveSection()}

      <Modal
        title={editingCustomId ? "编辑本地模型" : "添加本地模型"}
        open={customModelModalOpen}
        onOk={async () => {
          try {
            const values = await customModelForm.validateFields();

            if (editingCustomId) {
              const res = await fetch(`/api/config/custom-models/${editingCustomId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  label: values.label,
                  baseUrl: values.baseUrl,
                  modelId: values.modelId || "default",
                  embeddingModelId: values.embeddingModelId || undefined,
                  embeddingDimensions: values.embeddingDimensions || undefined,
                  ...(values.apiKey ? { apiKey: values.apiKey } : {}),
                }),
              });
              if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                message.error(d.error || "更新失败");
                return;
              }
              message.success("已更新");
            } else {
              const res = await fetch("/api/config/custom-models", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  label: values.label,
                  baseUrl: values.baseUrl,
                  modelId: values.modelId || "default",
                  embeddingModelId: values.embeddingModelId || undefined,
                  embeddingDimensions: values.embeddingDimensions || undefined,
                  apiKey: values.apiKey || undefined,
                }),
              });
              if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                message.error(d.error || "添加失败");
                return;
              }
              message.success("已添加");
            }
            setCustomModelModalOpen(false);
            loadConfig();
          } catch {
            message.error("请填写完整信息");
          }
        }}
        onCancel={() => setCustomModelModalOpen(false)}
        okText={editingCustomId ? "保存" : "添加"}
      >
        <Form form={customModelForm} layout="vertical">
          <Form.Item label="名称" name="label" rules={[{ required: true, message: "请输入名称" }]}>
            <Input placeholder="如：本地 Ollama" style={inputStyle} />
          </Form.Item>
          <Form.Item label="Base URL" name="baseUrl" rules={[{ required: true, message: "请输入 Base URL" }]} extra="需兼容 OpenAI Chat Completions。如 http://127.0.0.1:11434/v1、http://10.0.0.8:8000/v1、https://llm.company.com/v1">
            <Input placeholder="https://llm.company.com/v1" style={inputStyle} />
          </Form.Item>
          <Form.Item label="模型 ID" name="modelId" initialValue="default">
            <Input placeholder="default 或 llama2" style={inputStyle} />
          </Form.Item>
          <Form.Item label="API Key（可选）" name="apiKey" extra="Ollama 等无鉴权服务可留空；企业私有网关如需鉴权请填写对应 Key。">
            <Input.Password placeholder="无鉴权可留空" style={inputStyle} />
          </Form.Item>
          <Form.Item label="Embedding 模型 ID（可选）" name="embeddingModelId" extra="如果该服务也提供 OpenAI-compatible /embeddings，可填写如 bge-m3、text-embedding-3-small。留空则知识库向量化继续使用内置厂商或关键词 fallback。">
            <Input placeholder="bge-m3" style={inputStyle} />
          </Form.Item>
          <Form.Item label="Embedding 维度（可选）" name="embeddingDimensions" extra="必须与模型实际输出维度一致，例如 1024、1536、2048。">
            <Input type="number" min={1} placeholder="1024" style={inputStyle} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
