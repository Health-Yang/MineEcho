import { Alert, Button, Space } from "antd";
import { SyncOutlined } from "@ant-design/icons";

interface SkillUpdateAlertProps {
  updatableCount: number;
  newCount: number;
  onViewDetails: () => void;
  onUpdateNow: () => void;
}

export function SkillUpdateAlert({
  updatableCount,
  newCount,
  onViewDetails,
  onUpdateNow,
}: SkillUpdateAlertProps) {
  if (updatableCount === 0 && newCount === 0) {
    return null;
  }

  const message = [];
  if (updatableCount > 0) {
    message.push(`${updatableCount} 个技能有更新`);
  }
  if (newCount > 0) {
    message.push(`${newCount} 个新技能可用`);
  }

  return (
    <Alert
      message={
        <Space>
          <span>发现 {message.join("，")}</span>
        </Space>
      }
      type="info"
      showIcon
      icon={<SyncOutlined />}
      action={
        <Space>
          <Button size="small" type="link" onClick={onViewDetails}>
            查看详情
          </Button>
          <Button size="small" type="primary" onClick={onUpdateNow}>
            立即更新
          </Button>
        </Space>
      }
      closable
      style={{ marginBottom: 16 }}
    />
  );
}
