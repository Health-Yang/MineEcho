import { useState, useEffect } from "react";
import { Avatar } from "antd";
import { RobotOutlined } from "@ant-design/icons";

export function TypingIndicator() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "16px 20px",
        borderBottom: "1px solid #f0f0f0",
        animation: "fadeIn 0.3s ease-in",
      }}
    >
      <Avatar
        icon={<RobotOutlined />}
        style={{
          background: "#52c41a",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 4, fontWeight: 500, color: "#666" }}>
          MineEcho
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "#999",
            fontSize: 14,
            fontFamily: 'monospace',
          }}
        >
          <span>模型正在处理</span>
          <span style={{
            display: "inline-block",
            width: "24px",
            fontWeight: 'bold',
          }}>
            {dots}
          </span>
        </div>
      </div>
    </div>
  );
}
