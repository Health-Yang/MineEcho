import { Button } from "antd";
import { CloseCircleOutlined, FileImageOutlined, FileOutlined } from "@ant-design/icons";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

export function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
      {attachments.map((att) => (
        <div
          key={att.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "#f0f7ff",
            border: "1px solid #d6e4ff",
            borderRadius: 6,
          }}
        >
          {isImage(att.type) ? (
            <FileImageOutlined style={{ color: "#0066ff" }} />
          ) : (
            <FileOutlined style={{ color: "#0066ff" }} />
          )}
          <span style={{ fontSize: 13, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {att.name}
          </span>
          <span style={{ color: "#999", fontSize: 11 }}>{formatFileSize(att.size)}</span>
          <Button
            type="text"
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => onRemove(att.id)}
            style={{ padding: 0, width: 20, height: 20, color: "#999" }}
          />
        </div>
      ))}
    </div>
  );
}
