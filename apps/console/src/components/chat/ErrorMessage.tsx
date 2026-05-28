import { Alert, Button, Space } from "antd";
import { ReloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  onClose?: () => void;
}

interface ErrorInfo {
  title: string;
  description: string;
  action?: string;
}

const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  'ECONNREFUSED': {
    title: '连接服务失败',
    description: '无法连接到 AI 服务，请检查 Gateway 是否正常运行',
    action: '重新连接'
  },
  'SERVICE_UNAVAILABLE': {
    title: 'AI 服务暂时不可用',
    description: '服务正在维护或重启中，请稍后重试',
    action: '重试'
  },
  'TIMEOUT': {
    title: '请求超时',
    description: '服务响应时间过长，请稍后重试',
    action: '重试'
  },
  'NETWORK_ERROR': {
    title: '网络连接异常',
    description: '请检查网络连接是否正常',
    action: '重试'
  },
  'ETIMEDOUT': {
    title: '连接超时',
    description: '网络连接超时，请检查网络状态或稍后重试',
    action: '重试'
  },
  'Gateway': {
    title: 'Gateway 调用失败',
    description: '无法连接到 MineEcho Gateway，请确认服务已启动',
    action: '重新连接'
  },
  '调用失败': {
    title: '服务调用失败',
    description: '请求处理失败，请稍后重试',
    action: '重试'
  },
  '超时': {
    title: '请求超时',
    description: '服务响应时间过长，请稍后重试',
    action: '重试'
  }
};

export function ErrorMessage({ error, onRetry, onClose }: ErrorMessageProps) {
  // 识别错误类型
  const errorType = Object.keys(ERROR_MESSAGES).find(key => error.includes(key)) || 'UNKNOWN';
  const errorInfo = ERROR_MESSAGES[errorType] || {
    title: '发生错误',
    description: error,
    action: '重试'
  };

  return (
    <Alert
      type="error"
      message={errorInfo.title}
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>{errorInfo.description}</div>
          <Space>
            {onRetry && (
              <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                {errorInfo.action}
              </Button>
            )}
            <Button
              size="small"
              icon={<QuestionCircleOutlined />}
              type="link"
              onClick={() => {
                // 跳转到配置页面
                window.location.href = '/config';
              }}
            >
              查看配置
            </Button>
          </Space>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              <summary style={{ cursor: 'pointer' }}>技术详情</summary>
              <pre style={{
                marginTop: 4,
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 200
              }}>
                {error}
              </pre>
            </details>
          )}
        </Space>
      }
      showIcon
      closable={!!onClose}
      onClose={onClose}
      style={{ marginBottom: 12, borderRadius: 8 }}
    />
  );
}
