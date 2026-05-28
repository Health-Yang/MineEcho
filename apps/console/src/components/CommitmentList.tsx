import { List, Checkbox, Tag, Typography, Empty } from "antd";
import { CalendarOutlined, UserOutlined } from "@ant-design/icons";
import type { Commitment } from "../types/meeting";

interface CommitmentListProps {
  commitments: Commitment[];
  onToggleStatus?: (id: string) => void;
}

const { Text } = Typography;

export function CommitmentList({ commitments, onToggleStatus }: CommitmentListProps) {
  if (commitments.length === 0) {
    return <Empty description="暂无承诺/行动项" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <List
      dataSource={commitments}
      renderItem={(item) => (
        <List.Item
          style={{
            padding: "12px 16px",
            background: "#fff",
            borderRadius: 8,
            marginBottom: 8,
            border: "1px solid #e8ecf1",
            opacity: item.status === "done" ? 0.6 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%" }}>
            <Checkbox
              checked={item.status === "done"}
              onChange={() => onToggleStatus?.(item.id)}
              style={{ marginTop: 4 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 4 }}>
                <Text
                  style={{
                    textDecoration: item.status === "done" ? "line-through" : "none",
                    color: item.status === "done" ? "#8c8c8c" : "#1f2329",
                  }}
                >
                  {item.what}
                </Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#646a73" }}>
                  <UserOutlined style={{ fontSize: 12 }} />
                  {item.who}
                </span>
                {item.deadline && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#646a73" }}>
                    <CalendarOutlined style={{ fontSize: 12 }} />
                    {new Date(item.deadline).toLocaleDateString("zh-CN")}
                  </span>
                )}
                <Tag
                  color={item.status === "done" ? "success" : item.status === "overdue" ? "error" : "warning"}
                  style={{ fontSize: 11, margin: 0 }}
                >
                  {item.status === "done" ? "已完成" : item.status === "overdue" ? "已逾期" : "待办"}
                </Tag>
              </div>
            </div>
          </div>
        </List.Item>
      )}
    />
  );
}
