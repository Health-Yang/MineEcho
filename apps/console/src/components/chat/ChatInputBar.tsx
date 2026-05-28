import { useRef, useCallback } from "react";
import { Input, Button } from "antd";
import { StopOutlined, PaperClipOutlined } from "@ant-design/icons";
import { AttachmentPreview } from "./AttachmentPreview";

function fileInputAccept(): string {
  return "image/*,application/pdf,.doc,.docx,.txt,.md,.csv,.json,.py,.js,.ts,.tsx";
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  loading: boolean;
  streaming: boolean;
  disabled: boolean;
  attachments: Attachment[];
  onAttachmentAdd: (files: FileList) => Promise<void>;
  onAttachmentRemove: (id: string) => void;
  uploading: boolean;
  onPaste: (e: React.ClipboardEvent) => void;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  onStop,
  loading,
  streaming,
  disabled,
  attachments,
  onAttachmentAdd,
  onAttachmentRemove,
  onPaste,
}: ChatInputBarProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePressEnter = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAttachmentAdd(e.target.files);
      e.target.value = "";
    }
  }, [onAttachmentAdd]);

  return (
    <div style={{ padding: "0 16px 12px", background: "#f5f7fa", flexShrink: 0 }}>
      <AttachmentPreview attachments={attachments} onRemove={onAttachmentRemove} />
      <input
        ref={fileInputRef}
        type="file"
        accept={fileInputAccept()}
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {/* sf-card input area */}
      <div
        className="sf-card"
        style={{
          padding: 4,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "8px 12px",
          }}
        >
          {/* Paperclip button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="添加附件"
            style={{
              padding: 6,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "#a8b8cc",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginBottom: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f5f7fa";
              e.currentTarget.style.color = "#0066ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#a8b8cc";
            }}
          >
            <PaperClipOutlined style={{ fontSize: 18 }} />
          </button>

          {/* TextArea */}
          <Input.TextArea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPressEnter={handlePressEnter}
            onPaste={onPaste}
            placeholder={attachments.length > 0 ? "输入消息（文件已添加）…" : "输入消息…"}
            autoSize={{ minRows: 1, maxRows: 6 }}
            disabled={disabled}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              boxShadow: "none",
              resize: "none",
              fontSize: 14,
              lineHeight: 1.6,
              padding: "6px 0",
              color: "#1f2329",
            }}
          />

          {/* Send / Stop buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginBottom: 2 }}>
            {loading && streaming ? (
              <Button
                icon={<StopOutlined />}
                onClick={onStop}
                size="small"
                style={{ borderRadius: 8 }}
              />
            ) : null}
            <Button
              type="primary"
              onClick={onSend}
              loading={loading && !streaming}
              disabled={!!streaming || (!value.trim() && attachments.length === 0)}
              style={{
                height: 32,
                padding: "0 16px",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 13,
              }}
            >
              发送
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: "center", fontSize: 10, color: "#a8b8cc", margin: "8px 0 0" }}>
        MineEcho 生成的内容仅供参考，请核实重要信息
      </p>
    </div>
  );
}
