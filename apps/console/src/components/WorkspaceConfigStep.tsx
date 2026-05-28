import { useState, useEffect } from "react";
import { Form, Input, Button, Alert, Descriptions, Typography } from "antd";
import { FolderOutlined, CheckCircleOutlined, CloudServerOutlined, DesktopOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface WorkspaceInfo {
  configured: boolean;
  workspaceRoot: string;
  workspacePath: string | null;
  workspaceName: string | null;
  exists: boolean;
  hostWorkspaceRoot: string | null;
  hostWorkspacePath: string | null;
}

interface WorkspaceConfigStepProps {
  form: any;
  onFinish: (values: any) => void;
  loading: boolean;
}

export function WorkspaceConfigStep({ form, onFinish, loading }: WorkspaceConfigStepProps) {
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [workspaceName, setWorkspaceName] = useState("default");

  useEffect(() => {
    // 加载工作空间信息
    fetch("/api/workspace/path")
      .then((r) => r.json())
      .then(setWorkspaceInfo)
      .catch(() => setWorkspaceInfo(null));
  }, []);

  // 检测运行环境
  const isContainer = workspaceInfo?.workspaceRoot === "/app/workspace" ||
                     !!workspaceInfo?.hostWorkspaceRoot;
  const isDesktop = typeof window !== 'undefined' && !!(window as any).electronAPI;

  // 计算路径显示
  const getContainerPath = () => {
    if (!workspaceName) return "/app/workspace/<workspace-name>";
    return `/app/workspace/${workspaceName}`;
  };

  const getHostPath = () => {
    if (!workspaceName) return null;

    // 优先使用后端返回的精确宿主机路径
    if (workspaceInfo?.hostWorkspacePath) {
      if (workspaceInfo.workspaceName === workspaceName) {
        return workspaceInfo.hostWorkspacePath;
      }
      if (workspaceInfo.hostWorkspaceRoot) {
        return `${workspaceInfo.hostWorkspaceRoot}/${workspaceName}`;
      }
    }

    if (workspaceInfo?.hostWorkspaceRoot) {
      return `${workspaceInfo.hostWorkspaceRoot}/${workspaceName}`;
    }

    if (isDesktop) {
      // 桌面版路径提示
      const platform = navigator.platform.toLowerCase();
      if (platform.includes('mac')) {
        return `~/Library/Application Support/MineEcho/workspace/${workspaceName}`;
      } else if (platform.includes('win')) {
        return `%APPDATA%\\MineEcho\\workspace\\${workspaceName}`;
      } else {
        return `~/.config/MineEcho/workspace/${workspaceName}`;
      }
    }

    // 非桌面版显示实际的宿主机路径根目录，避免回退到容器路径
    if (workspaceInfo?.hostWorkspaceRoot) {
      return `${workspaceInfo.hostWorkspaceRoot}/${workspaceName}`;
    }

    return null;
  };

  const containerPath = getContainerPath();
  const hostPath = getHostPath();

  return (
    <div>
      {/* 环境提示 */}
      {isContainer && (
        <Alert
          message="容器环境"
          description="工作空间通过 Docker 卷映射到宿主机，确保数据持久化"
          type="info"
          icon={<CloudServerOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {isDesktop && (
        <Alert
          message="桌面环境"
          description="工作空间位于用户数据目录，确保安全读写权限"
          type="info"
          icon={<DesktopOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!isContainer && !isDesktop && (
        <Alert
          message="开发环境"
          description="工作空间位于项目目录，用于开发和测试"
          type="info"
          icon={<FolderOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 工作空间名称输入 */}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="工作目录名称"
          name="workspaceName"
          initialValue="default"
          rules={[
            { required: true, message: "请输入工作目录名称" },
            { pattern: /^[a-z0-9-_]+$/, message: "只能包含小写字母、数字、连字符和下划线" }
          ]}
        >
          <Input
            placeholder="default"
            prefix={<FolderOutlined />}
            onChange={(e) => setWorkspaceName(e.target.value || "default")}
          />
        </Form.Item>

        {/* 路径信息展示 */}
        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
          {isContainer && (
            <>
              <Descriptions.Item label="容器内路径">
                <Text code>{containerPath}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="宿主机路径">
                <Text code copyable>{hostPath || "计算中..."}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  此路径在宿主机上，可用于备份和文件管理
                </Text>
              </Descriptions.Item>
            </>
          )}

          {isDesktop && (
            <Descriptions.Item label="工作空间路径">
              <Text code>{hostPath || "计算中..."}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                位于用户数据目录，确保应用有读写权限
              </Text>
            </Descriptions.Item>
          )}

          {!isContainer && !isDesktop && (
            <Descriptions.Item label="工作空间路径">
              <Text code>{hostPath || containerPath}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                用于存储技能、缓存和输出文件
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 工作空间结构说明 */}
        <Alert
          message="工作空间结构"
          description={
            <div>
              <p>工作空间将包含以下子目录：</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><code>skills/</code> - 技能脚本和配置</li>
                <li><code>cache/</code> - 缓存数据</li>
                <li><code>output/</code> - 生成的文件</li>
                <li><code>uploads/</code> - 上传的文件</li>
              </ul>
            </div>
          }
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 当前配置状态 */}
        {workspaceInfo?.configured && (
          <Alert
            message="当前工作空间已配置"
            description={
              <div>
                <p><strong>名称:</strong> {workspaceInfo.workspaceName}</p>
                <p><strong>路径:</strong> {workspaceInfo.workspacePath}</p>
                {workspaceInfo.hostWorkspacePath && (
                  <p><strong>宿主机路径:</strong> {workspaceInfo.hostWorkspacePath}</p>
                )}
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            保存并继续
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
