import { useState } from "react";
import {
  Button,
  Typography,
  Input,
  Segmented,
  Form,
  Alert,
} from "antd";
import {
  KeyOutlined,
  RobotOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

interface ModelStepProps {
  loading: boolean;
  onSave: (values: {
    provider: string;
    apiKey?: string;
    model?: string;
  }) => Promise<void>;
  onNext: () => void;
}

const MODEL_OPTIONS = [
  { label: "MiniMax", value: "minimax" },
  { label: "通义千问", value: "dashscope" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "智谱 GLM", value: "zhipu" },
];

const DEFAULT_MODELS: Record<string, string> = {
  minimax: "MiniMax-M2.7",
  dashscope: "qwen-plus",
  deepseek: "deepseek-chat",
  zhipu: "glm-4",
};

const PROVIDER_INFO: Record<
  string,
  { name: string; description: string; link: string }
> = {
  minimax: {
    name: "MiniMax",
    description: "支持 MiniMax-M2.7；Coding Plan 可填 MiniMax-M2.7-highspeed 或 MiniMax-M2.5-highspeed",
    link: "https://platform.minimax.io",
  },
  dashscope: {
    name: "通义千问",
    description: "阿里云大模型平台，支持 qwen-plus 等模型",
    link: "https://dashscope.aliyun.com",
  },
  deepseek: {
    name: "DeepSeek",
    description: "DeepSeek 大模型，支持 deepseek-chat、deepseekV3 等",
    link: "https://platform.deepseek.com",
  },
  zhipu: {
    name: "智谱 GLM",
    description: "智谱 AI 大模型平台，支持 glm-4 等模型",
    link: "https://open.bigmodel.cn",
  },
};

export function ModelStep({ loading, onSave, onNext }: ModelStepProps) {
  const [provider, setProvider] = useState<string>("minimax");
  const [form] = Form.useForm();
  const info = PROVIDER_INFO[provider];

  const handleProviderChange = (v: string) => {
    setProvider(v);
    form.setFieldsValue({
      model: DEFAULT_MODELS[v] || "",
      apiKey: undefined,
    });
  };

  const handleFinish = async (values: {
    model?: string;
    apiKey?: string;
  }) => {
    await onSave({
      provider,
      model: values.model,
      apiKey: values.apiKey,
    });
    onNext();
  };

  return (
    <div>
      {/* 标题区 */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(0, 102, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <RobotOutlined style={{ fontSize: 28, color: "#0066ff" }} />
        </div>
        <Typography.Title level={4} style={{ margin: 0, color: "#1f2329" }}>
          选择 AI 模型
        </Typography.Title>
        <Typography.Text
          type="secondary"
          style={{
            display: "block",
            marginTop: 8,
            maxWidth: 480,
            margin: "8px auto 0",
          }}
        >
          选择您偏好的 AI 模型提供商并配置 API Key，即可开始与 AI 对话
        </Typography.Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ model: DEFAULT_MODELS["minimax"] }}
      >
        {/* Provider 选择 */}
        <Form.Item style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <Typography.Text strong style={{ color: "#1f2329" }}>
              模型提供商
            </Typography.Text>
          </div>
          <Segmented
            options={MODEL_OPTIONS}
            value={provider}
            onChange={(v) => handleProviderChange(v as string)}
            block
            size="large"
          />
        </Form.Item>

        {/* Provider 信息提示 */}
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message={
            <span>
              {info.name} — {info.description}
              <a
                href={info.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 8, color: "#0066ff" }}
              >
                获取 API Key →
              </a>
            </span>
          }
          style={{ marginBottom: 20, borderRadius: 8 }}
        />

        {/* 模型名称 */}
        <Form.Item
          name="model"
          label={
            <Typography.Text strong style={{ color: "#1f2329" }}>
              模型 ID
            </Typography.Text>
          }
          rules={[{ required: true, message: "请输入模型 ID" }]}
          extra="模型的唯一标识符，通常由提供商给出"
        >
          <Input
            prefix={<RobotOutlined style={{ color: "#8f959e" }} />}
            placeholder="模型标识符"
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        {/* API Key */}
        <Form.Item
          name="apiKey"
          label={
            <Typography.Text strong style={{ color: "#1f2329" }}>
              API Key
            </Typography.Text>
          }
          rules={[{ required: true, message: "请输入 API Key" }]}
          extra="您的 API Key 仅保存在本地，不会上传到任何服务器"
        >
          <Input.Password
            prefix={<KeyOutlined style={{ color: "#8f959e" }} />}
            placeholder="输入您的 API Key"
            autoComplete="off"
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        {/* 保存按钮 */}
        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            icon={<SettingOutlined />}
            style={{
              borderRadius: 8,
              height: 44,
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            保存配置并继续
          </Button>
        </Form.Item>
      </Form>

      {/* 安全提示 */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          background: "#f6ffed",
          borderRadius: 8,
          border: "1px solid #b7eb8f",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <InfoCircleOutlined
          style={{ color: "#52c41a", fontSize: 14, marginTop: 2 }}
        />
        <Typography.Text style={{ fontSize: 13, color: "#389e0d" }}>
          API Key 仅保存在本地配置文件中，采用加密存储，不会上传到任何服务器
        </Typography.Text>
      </div>
    </div>
  );
}
