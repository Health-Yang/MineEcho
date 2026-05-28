import { useState, useCallback, useRef } from "react";
import { message } from "antd";
import { apiFetch } from "../utils/api";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export function useChatAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (attachments.length + files.length > 5) {
      message.warning("最多只能上传5个文件");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await apiFetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = (await res.json()) as { attachments: Attachment[] };
        setAttachments((prev) => [...prev, ...data.attachments]);
      } else {
        message.error("文件上传失败，请重试");
      }
    } catch (e) {
      message.error("文件上传失败，请检查网络连接");
      if (process.env.NODE_ENV === 'development') {
        console.error("[upload] 上传失败:", e);
      }
    } finally {
      setUploading(false);
    }
  }, [attachments.length]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        await handleFileSelect(dt.files);
      }
    },
    [handleFileSelect]
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    attachments,
    setAttachments,
    uploading,
    handleFileSelect,
    handlePaste,
    removeAttachment,
    clearAttachments,
    fileInputRef,
  };
}
