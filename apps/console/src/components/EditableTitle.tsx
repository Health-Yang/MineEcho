import { useState, useRef, useEffect } from "react";
import { Input, message } from "antd";
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

interface EditableTitleProps {
  title: string | null;
  onSave: (newTitle: string) => Promise<void>;
  style?: React.CSSProperties;
}

export function EditableTitle({ title, onSave, style }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setValue(title || "");
  }, [title]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleEdit = () => {
    setValue(title || "");
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      message.warning("标题不能为空");
      return;
    }
    if (trimmed === title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      message.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(title || "");
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        size="small"
        style={{ width: 200, ...style }}
        suffix={
          saving ? null : (
            <>
              <CheckOutlined
                style={{ color: "#52c41a", marginRight: 4, cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              />
              <CloseOutlined
                style={{ color: "#ff4d4f", cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCancel();
                }}
              />
            </>
          )
        }
      />
    );
  }

  return (
    <span
      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...style }}
      onClick={handleEdit}
      title="点击编辑"
    >
      {title || "未命名会议"}
      <EditOutlined style={{ fontSize: 12, color: "#8c8c8c" }} />
    </span>
  );
}
