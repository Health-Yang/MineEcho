import { Card, Form, Input, Button, Typography, Space, Alert } from "antd";
import { FolderOutlined, InfoCircleOutlined } from "@ant-design/icons";

interface WorkspaceStepProps {
  form: any;
  loading: boolean;
  onSave: (values: any) => void;
}

function getPlatformName(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("win")) return "Windows";
  if (userAgent.includes("mac")) return "macOS";
  return "Linux";
}

export function WorkspaceStep({ form, loading, onSave }: WorkspaceStepProps) {
  const workspaceName = Form.useWatch("workspaceName", form) || "mineecho-work";
  const platform = getPlatformName();

  const getContainerPath = (name: string): string => {
    return `/app/workspace/${name}`;
  };

  const getHostPath = (name: string): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      return `C:\\Users\\<username>\\MineEcho\\workspace\\${name}`;
    }
    if (userAgent.includes("mac")) {
      return `/Users/<username>/MineEcho/workspace/${name}`;
    }
    return `/home/<username>/MineEcho/workspace/${name}`;
  };

  return (
    <Card title="配置工作目录" bordered={false}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="工作目录是什么？"
          description="工作目录是 MineEcho 存储本地文件、配置和日志的位置。技能文件、临时数据和用户配置都将保存在此目录中。"
          style={{ marginBottom: 16 }}
        />

        <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          <Space>
            <FolderOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            <Typography.Text strong>当前平台: {platform}</Typography.Text>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onSave}
          initialValues={{ workspaceName: "mineecho-work" }}
        >
          <Form.Item
            name="workspaceName"
            label="工作区名称"
            rules={[
              { required: true, message: "请输入工作区名称" },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: "只能使用字母、数字、下划线和连字符" },
            ]}
            extra="此名称将用作工作目录的文件夹名"
          >
            <Input placeholder="mineecho-work" />
          </Form.Item>

          <div style={{ background: "#e6f4ff", padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              路径配置说明：
            </Typography.Text>
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Typography.Text strong>容器内路径：</Typography.Text>
                <Typography.Paragraph
                  copyable
                  style={{ margin: "4px 0 0 0", fontFamily: "monospace", fontSize: 14 }}
                >
                  {getContainerPath(workspaceName)}
                </Typography.Paragraph>
              </div>
              <div>
                <Typography.Text strong>宿主机路径（Docker 卷映射）：</Typography.Text>
                <Typography.Paragraph
                  copyable
                  style={{ margin: "4px 0 0 0", fontFamily: "monospace", fontSize: 14 }}
                >
                  {getHostPath(workspaceName)}
                </Typography.Paragraph>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  此路径在宿主机上，Docker 会将此目录映射到容器内的 {getContainerPath(workspaceName)}
                </Typography.Text>
              </div>
            </div>
          </div>

          <Alert
            type="warning"
            showIcon
            message="注意事项"
            description={
              <ul style={{ margin: "8px 0", paddingLeft: 16 }}>
                <li>请确保所选目录有足够的磁盘空间</li>
                <li>建议不要将工作目录设置在系统临时文件夹中</li>
                <li>路径中的 &lt;username&gt; 将被替换为您的实际用户名</li>
              </ul>
            }
            style={{ marginBottom: 16 }}
          />

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              保存工作目录配置
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}
