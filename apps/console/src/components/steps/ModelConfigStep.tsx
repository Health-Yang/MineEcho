import { Card, Form, Input, Button, Space, Segmented, Alert } from "antd";
import { SettingOutlined, KeyOutlined, RobotOutlined, LinkOutlined } from "@ant-design/icons";

interface ModelConfigStepProps {
  form: any;
  provider: string;
  setProvider: (v: string) => void;
  loading: boolean;
  onSave: (values: any) => void;
  hasExistingKey: boolean;
}

const MODEL_OPTIONS = [
  { label: "MiniMax", value: "minimax" },
  { label: "通义千问", value: "dashscope" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "智谱 GLM", value: "zhipu" },
  { label: "本地模型", value: "local" },
];

const DEFAULT_MODELS: Record<string, string> = {
  minimax: "MiniMax-M2.7",
  dashscope: "qwen-plus",
  deepseek: "deepseek-chat",
  zhipu: "glm-4",
  local: "",
};

const PROVIDER_INFO: Record<string, { name: string; description: string; link: string; needUrl: boolean }> = {
  minimax: {
    name: "MiniMax",
    description: "支持 MiniMax-M2.7；Coding Plan 可填 MiniMax-M2.7-highspeed 或 MiniMax-M2.5-highspeed",
    link: "https://platform.minimax.io",
    needUrl: false,
  },
  dashscope: {
    name: "通义千问",
    description: "阿里云大模型，支持 qwen-plus 等",
    link: "https://dashscope.aliyun.com",
    needUrl: false,
  },
  deepseek: {
    name: "DeepSeek",
    description: "DeepSeek 大模型，支持 deepseek-chat、deepseekV3 等",
    link: "https://platform.deepseek.com",
    needUrl: false,
  },
  zhipu: {
    name: "智谱 GLM",
    description: "智谱 AI 大模型，支持 glm-4 等",
    link: "https://open.bigmodel.cn",
    needUrl: false,
  },
  local: {
    name: "本地模型",
    description: "兼容 OpenAI API 的本地部署模型（如 Ollama、LM Studio）",
    link: "",
    needUrl: true,
  },
};

export function ModelConfigStep({ form, provider, setProvider, loading, onSave, hasExistingKey }: ModelConfigStepProps) {
  const info = PROVIDER_INFO[provider];

  // 处理提供商切换
  const handleProviderChange = (v: string) => {
    setProvider(v as string);
    // 清除之前的值，避免残留
    form.setFieldsValue({
      model: DEFAULT_MODELS[v as string] || "",
      apiKey: undefined,
      baseUrl: undefined,
    });
  };

  return (
    <Card title="模型配置" bordered={false}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Form form={form} layout="vertical" onFinish={onSave}>
          <Form.Item label="选择模型提供商">
            <Segmented
              options={MODEL_OPTIONS}
              value={provider}
              onChange={handleProviderChange}
              block
            />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message={info.name}
            description={
              <span>
                {info.description}
                {info.link && (
                  <a href={info.link} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                    获取 API Key →
                  </a>
                )}
              </span>
            }
            style={{ marginBottom: 16 }}
          />

          {/* 本地模型需要填写 Base URL */}
          {info.needUrl && (
            <Form.Item
              name="baseUrl"
              label={
                <Space>
                  <LinkOutlined />
                  <span>Base URL</span>
                </Space>
              }
              rules={[{ required: true, message: "请输入 Base URL" }]}
              extra="本地模型服务的地址，如 http://localhost:11434/v1"
            >
              <Input placeholder="http://localhost:11434/v1" />
            </Form.Item>
          )}

          <Form.Item
            name="model"
            label="模型 ID"
            rules={[{ required: true, message: "请输入模型 ID" }]}
            extra={info.needUrl ? "本地模型的标识符，如 llama2、codellama 等" : "模型的唯一标识符"}
          >
            <Input prefix={<RobotOutlined />} placeholder={info.needUrl ? "llama2" : "模型标识符"} />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={
              <Space>
                <KeyOutlined />
                <span>{info.needUrl ? "API Key（可选）" : `${info.name} API Key`}</span>
              </Space>
            }
            rules={[{ required: !hasExistingKey && !info.needUrl, message: "请输入 API Key" }]}
            extra={info.needUrl ? "本地模型如果没有认证可留空" : undefined}
          >
            <Input.Password
              placeholder={
                hasExistingKey
                  ? "已配置，输入新 Key 覆盖或留空保持"
                  : info.needUrl
                    ? "如无认证可留空"
                    : "输入您的 API Key"
              }
              autoComplete="off"
              // 关键：确保不显示任何默认值
              defaultValue=""
            />
          </Form.Item>

          {hasExistingKey && (
            <Alert
              type="success"
              showIcon
              message="已配置 API Key"
              description="您之前已保存过 API Key，如需更换请输入新的 Key，留空则保持原配置"
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" icon={<SettingOutlined />}>
              {hasExistingKey ? "更新配置" : "保存配置"}
            </Button>
          </Form.Item>
        </Form>

        <Alert
          type="success"
          message="安全提示"
          description="API Key 仅保存在本地配置文件中，不会上传到任何服务器"
        />
      </Space>
    </Card>
  );
}
