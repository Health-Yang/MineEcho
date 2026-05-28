import { List, Tag, Typography, Empty } from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import type { CalendarEvent } from "../types/meeting";

interface CalendarListProps {
  events: CalendarEvent[];
}

const { Text } = Typography;

const typeColor: Record<string, string> = {
  meeting: "blue",
  commitment: "orange",
  personal: "green",
};

const typeText: Record<string, string> = {
  meeting: "会议",
  commitment: "承诺",
  personal: "个人",
};

export function CalendarList({ events }: CalendarListProps) {
  if (events.length === 0) {
    return <Empty description="暂无日历事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <List
      dataSource={events}
      renderItem={(item) => (
        <List.Item
          style={{
            padding: "12px 16px",
            background: "#fff",
            borderRadius: 8,
            marginBottom: 8,
            border: "1px solid #e8ecf1",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%" }}>
            <CalendarOutlined style={{ fontSize: 16, color: "#0066ff", marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 4 }}>
                <Text strong style={{ color: "#1f2329", fontSize: 14 }}>
                  {item.title}
                </Text>
              </div>
              {item.description && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.description}
                  </Text>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#646a73" }}>
                  <ClockCircleOutlined style={{ fontSize: 12 }} />
                  {new Date(item.startAt).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Tag color={typeColor[item.type]} style={{ fontSize: 11, margin: 0 }}>
                  {typeText[item.type]}
                </Tag>
              </div>
            </div>
          </div>
        </List.Item>
      )}
    />
  );
}
