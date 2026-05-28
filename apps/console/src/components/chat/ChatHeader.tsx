import { BookOutlined } from "@ant-design/icons";
import { FoxLogo } from "../FoxLogo";

interface ChatHeaderProps {
  useKb?: boolean;
  onUseKbChange?: (useKb: boolean) => void;
}

// Only show Knowledge Base toggle

export function ChatHeader({ useKb, onUseKbChange }: ChatHeaderProps) {
  return (
    <div className="chat-header">
      {/* LEFT: Fox avatar + MineEcho + online status */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FoxLogo size={28} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1f2329",
          }}
        >
          MineEcho
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#00b365",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "#646a73",
            }}
          >
            在线
          </span>
        </div>
      </div>

      {/* RIGHT: KB toggle only */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Knowledge Base Toggle */}
        <button
          onClick={() => onUseKbChange?.(!useKb)}
          title={useKb ? "知识库已开启" : "知识库"}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${useKb ? "#0066ff" : "#e8ecf1"}`,
            background: useKb ? "#e6f0ff" : "#fff",
            color: useKb ? "#0066ff" : "#646a73",
            fontSize: 13,
            fontWeight: useKb ? 500 : 400,
            cursor: "pointer",
            transition: "all 0.15s ease",
            lineHeight: 1.4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          onMouseEnter={(e) => {
            if (!useKb) {
              e.currentTarget.style.borderColor = "#0066ff";
              e.currentTarget.style.color = "#0066ff";
            }
          }}
          onMouseLeave={(e) => {
            if (!useKb) {
              e.currentTarget.style.borderColor = "#e8ecf1";
              e.currentTarget.style.color = "#646a73";
            }
          }}
        >
          <BookOutlined style={{ fontSize: 13 }} />
          {useKb ? "知识库" : "知识库"}
        </button>
      </div>
    </div>
  );
}
