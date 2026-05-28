import { useState, useEffect, useRef } from "react";
import {
  Tabs,
  Card,
  Button,
  Spin,
  Empty,
  Typography,
  Tag,
  message,
  Popconfirm,
} from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileTextOutlined,
  SoundOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  CopyOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { Meeting, Commitment, CalendarEvent } from "../types/meeting";
import { CommitmentList } from "./CommitmentList";
import { CalendarList } from "./CalendarList";

/**
 * Fix markdown headings that are missing space after # symbols.
 * Converts #标题 to # 标题, ##标题 to ## 标题, etc.
 */
function fixMarkdownHeadings(text: string): string {
  if (!text) return text;
  return text.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
}

interface MeetingDetailProps {
  meetingId: string;
  onDelete?: () => void;
}

const { Title, Text } = Typography;

const getCleanedStorageKey = (id: string) => `cleaned-transcript-${id}`;

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getStoredCleanedTranscript(meetingId: string): { cleaned: string | null; transcriptHash: string | null } {
  try {
    const raw = localStorage.getItem(getCleanedStorageKey(meetingId));
    if (!raw) return { cleaned: null, transcriptHash: null };
    const parsed = JSON.parse(raw);
    return {
      cleaned: parsed.cleaned || null,
      transcriptHash: parsed.transcriptHash || null,
    };
  } catch {
    return { cleaned: null, transcriptHash: null };
  }
}

export function MeetingDetail({ meetingId, onDelete }: MeetingDetailProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);
  const [cleanedTranscript, setCleanedTranscript] = useState<string | null>(() => {
    return getStoredCleanedTranscript(meetingId).cleaned;
  });
  const [audioExists, setAudioExists] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const meetingApi = {
    get: (id: string) => fetch(`/api/meeting/${id}`).then((r) => r.json()),
    summarize: (id: string) =>
      fetch(`/api/meeting/${id}/summarize`, { method: "POST" }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    getCommitments: (id: string) =>
      fetch(`/api/meeting/${id}/commitments`).then((r) => r.json()),
    extractCommitments: (id: string) =>
      fetch(`/api/meeting/${id}/commitments`, { method: "POST" }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    delete: (id: string) =>
      fetch(`/api/meeting/${id}`, { method: "DELETE" }).then((r) => r.json()),
    getCalendarEvents: () =>
      fetch("/api/calendar").then((r) => r.json()),
    getAudioInfo: (id: string) =>
      fetch(`/api/meeting/${id}/audio-info`).then((r) => r.json()),
    reTranscribe: (id: string) =>
      fetch(`/api/meeting/${id}/transcribe`, { method: "POST" }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
  };

  const loadMeeting = async () => {
    setLoading(true);
    try {
      const data = await meetingApi.get(meetingId);
      setMeeting(data);
      // Check if audio file exists
      const audioInfo = await meetingApi.getAudioInfo(meetingId);
      setAudioExists(audioInfo.audioExists || false);
    } catch {
      message.error("加载会议详情失败");
    } finally {
      setLoading(false);
    }
  };

  const handleReTranscribe = async () => {
    if (!audioExists) {
      message.warning("没有找到录音文件，无法重新转录");
      return;
    }
    setTranscribing(true);
    try {
      const data = await meetingApi.reTranscribe(meetingId);
      if (data.error) {
        message.error(data.error || "重新转录失败");
        setTranscribing(false);
        return;
      }
      if (data.transcript) {
        setMeeting((prev) => prev ? { ...prev, transcript: data.transcript } : prev);
        message.success("重新转录完成");
      } else {
        message.loading("正在重新转录，请稍候...");
      }
    } catch (err) {
      message.error("重新转录失败");
    } finally {
      setTranscribing(false);
    }
  };

  const loadCommitments = async () => {
    setCommitmentsLoading(true);
    try {
      const data = await meetingApi.getCommitments(meetingId);
      setCommitments(data.commitments || []);
    } catch {
      // silently fail; will show empty
    } finally {
      setCommitmentsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const data = await meetingApi.getCalendarEvents();
      const commitmentIds = commitments.map((c) => c.id);
      // 过滤出与当前会议相关的日历事件
      const relatedEvents = (data.events || []).filter(
        (e: CalendarEvent) =>
          e.sourceId === meetingId ||
          (e.type === "commitment" && commitmentIds.includes(e.sourceId || ""))
      );
      setCalendarEvents(relatedEvents);
    } catch {
      // silently fail; will show empty
    }
  };

  // Ref to track if cleaned transcript is for current transcript version
  const cleanedTranscriptRef = useRef<string | null>(null);
  // Ref to ensure completion message only shows once per meetingId
  const completionMessageShownRef = useRef(false);

  // Initialize from localStorage when meetingId changes
  useEffect(() => {
    const stored = getStoredCleanedTranscript(meetingId);
    cleanedTranscriptRef.current = stored.cleaned;
    setCleanedTranscript(stored.cleaned);
    // Reset completion message flag when meetingId changes
    completionMessageShownRef.current = false;
  }, [meetingId]);

  useEffect(() => {
    loadMeeting();
    loadCommitments();
    loadCalendarEvents();

    // 轮询：持续刷新会议状态，直到 completed 且有 transcript
    const interval = setInterval(async () => {
      try {
        const data = await meetingApi.get(meetingId);
        setMeeting(data);

        // 如果有已清理的转录文本且当前 transcript 有变化，恢复清理状态
        if (cleanedTranscriptRef.current && data.transcript) {
          const currentHash = hashString(data.transcript);
          const stored = getStoredCleanedTranscript(meetingId);
          if (stored.transcriptHash === currentHash && stored.cleaned) {
            setCleanedTranscript(stored.cleaned);
            cleanedTranscriptRef.current = stored.cleaned;
          }
        }

        // 当状态变为 completed 且有 transcript 时，停止轮询并刷新承诺和日历
        if (data.status === "completed" && data.transcript) {
          clearInterval(interval);
          // 刷新承诺和日历事件
          loadCommitments();
          loadCalendarEvents();
          // 仅在首次完成时显示消息，避免重复弹出
          if (!completionMessageShownRef.current) {
            completionMessageShownRef.current = true;
            message.success("会议处理完成");
          }
        }
      } catch {
        // 网络错误，继续轮询
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [meetingId]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const data = await meetingApi.summarize(meetingId);
      setMeeting((prev) =>
        prev ? { ...prev, summary: data.summary || null } : prev
      );
      message.success("摘要生成成功");
    } catch {
      message.error("生成摘要失败");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleExtractCommitments = async () => {
    setCommitmentsLoading(true);
    try {
      const data = await meetingApi.extractCommitments(meetingId);
      setCommitments(data.commitments || []);
      // 同时刷新日历事件（因为后端会自动创建与会议相关的日历事件）
      await loadCalendarEvents();
      const count = (data.commitments?.length || 0) + (data.calendarEvents?.length || 0);
      if (count > 0) {
        message.success(`提取成功：${data.commitments?.length || 0} 个承诺，${data.calendarEvents?.length || 0} 个日历事件`);
      } else {
        message.info("未提取到任何承诺或日程事件");
      }
    } catch {
      message.error("提取承诺失败");
    } finally {
      setCommitmentsLoading(false);
    }
  };

  const handleToggleCommitment = async (id: string) => {
    setCommitments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "done" ? "pending" : "done" as const }
          : c
      )
    );
  };

  const handleDelete = async () => {
    try {
      await meetingApi.delete(meetingId);
      message.success("会议已删除");
      onDelete?.();
    } catch {
      message.error("删除失败");
    }
  };

  const handleAddToCalendar = async () => {
    if (!meeting) return;
    try {
      const startAt = meeting.startedAt;
      const endAt = meeting.endedAt;
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meeting.title || "未命名会议",
          startAt,
          endAt,
          type: "meeting",
          sourceId: meeting.id,
          description: meeting.summary || meeting.transcript?.slice(0, 200) || "",
        }),
      });
      message.success("已添加到日历");
      await loadCalendarEvents();
    } catch {
      message.error("添加日历失败");
    }
  };

  const handleCopyTranscript = () => {
    const textToCopy = cleanedTranscript || meeting?.transcript;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      message.success("转录文本已复制");
    }
  };

  const statusColor: Record<string, string> = {
    recording: "blue",
    transcribing: "orange",
    cleaning: "orange",
    extracting: "orange",
    summarizing: "orange",
    completed: "green",
  };

  const statusText: Record<string, string> = {
    recording: "录制中",
    transcribing: "转录中",
    cleaning: "整理中",
    extracting: "提取承诺中",
    summarizing: "摘要中",
    completed: "已完成",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <Empty
        description="会议不存在或已删除"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const tabItems = [
    {
      key: "summary",
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 6 }} />
          会议纪要
        </span>
      ),
      children: (
        <div>
          {meeting.summary ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card
                title="会议纪要"
                size="small"
                style={{ borderRadius: 8, border: "1px solid #e8ecf1" }}
              >
                <div className="meeting-summary-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {fixMarkdownHeadings(meeting.summary)}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Empty
                description="暂无会议纪要"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Button
                type="primary"
                icon={
                  summaryLoading ? <LoadingOutlined /> : <FileTextOutlined />
                }
                onClick={handleGenerateSummary}
                loading={summaryLoading}
                style={{ marginTop: 16 }}
              >
                点击生成会议纪要
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "transcript",
      label: (
        <span>
          <SoundOutlined style={{ marginRight: 6 }} />
          转录
        </span>
      ),
      children: (
        <div>
          {meeting.transcript ? (
            <div>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {cleanedTranscript ? "已自动整理" : "原始转录"}
                </Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={handleCopyTranscript}
                >
                  复制全文
                </Button>
              </div>
              <Card
                style={{
                  borderRadius: 8,
                  border: "1px solid #e8ecf1",
                  maxHeight: 600,
                  overflow: "auto",
                }}
              >
                {/* 使用整理后的转录（如果存在），否则使用原始转录 */}
                <div className="meeting-summary-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {fixMarkdownHeadings(cleanedTranscript || meeting.transcript || "")}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>
          ) : audioExists ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <Empty
                description="暂无转录文本，可以重新转录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Button
                type="primary"
                icon={<LoadingOutlined />}
                onClick={handleReTranscribe}
                loading={transcribing}
                style={{ marginTop: 16 }}
              >
                重新转录
              </Button>
            </div>
          ) : (
            <Empty
              description="没有找到录音文件"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      ),
    },
    {
      key: "commitments",
      label: (
        <span>
          <CheckSquareOutlined style={{ marginRight: 6 }} />
          承诺
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Button
              size="small"
              onClick={handleExtractCommitments}
              loading={commitmentsLoading}
            >
              重新提取承诺
            </Button>
          </div>
          <CommitmentList
            commitments={commitments}
            onToggleStatus={handleToggleCommitment}
          />
        </div>
      ),
    },
    {
      key: "calendar",
      label: (
        <span>
          <CalendarOutlined style={{ marginRight: 6 }} />
          日历事件
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              从会议中自动提取的日程事件
            </Text>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={handleAddToCalendar}
              size="small"
            >
              添加会议到日历
            </Button>
          </div>
          <CalendarList events={calendarEvents} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Markdown 样式 */}
      <style>{`
        .meeting-summary-content {
          font-size: 14px;
          line-height: 1.8;
          color: #1f2329;
        }
        .meeting-summary-content h1 {
          font-size: 20px;
          font-weight: 600;
          margin: 16px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8ecf1;
          color: #1f2329;
        }
        .meeting-summary-content h2 {
          font-size: 17px;
          font-weight: 600;
          margin: 14px 0 10px 0;
          color: #1f2329;
        }
        .meeting-summary-content h3 {
          font-size: 15px;
          font-weight: 600;
          margin: 12px 0 8px 0;
          color: #1f2329;
        }
        .meeting-summary-content p {
          margin: 8px 0;
        }
        .meeting-summary-content ul,
        .meeting-summary-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .meeting-summary-content li {
          margin: 4px 0;
        }
        .meeting-summary-content strong {
          font-weight: 600;
          color: #1f2329;
        }
        .meeting-summary-content code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Consolas, monospace;
          font-size: 13px;
        }
        .meeting-summary-content pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .meeting-summary-content pre code {
          background: transparent;
          padding: 0;
        }
        .meeting-summary-content blockquote {
          border-left: 3px solid #0066ff;
          padding-left: 16px;
          margin: 12px 0;
          color: #595959;
          background: #f8f9fa;
          padding: 8px 16px;
          border-radius: 0 8px 8px 0;
        }
        .meeting-summary-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        .meeting-summary-content th,
        .meeting-summary-content td {
          border: 1px solid #e8ecf1;
          padding: 8px 12px;
          text-align: left;
        }
        .meeting-summary-content th {
          background: #f5f7fa;
          font-weight: 600;
        }
        .meeting-summary-content hr {
          border: none;
          border-top: 1px solid #e8ecf1;
          margin: 16px 0;
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e8ecf1",
          background: "#fff",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, fontSize: 18 }}>
            {meeting.title}
          </Title>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 6,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(meeting.startedAt).toLocaleString("zh-CN")}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              时长: {Math.floor((meeting.durationSec || 0) / 60)}:
              {((meeting.durationSec || 0) % 60).toString().padStart(2, "0")}
            </Text>
            <Tag color={statusColor[meeting.status]} style={{ fontSize: 11 }}>
              {statusText[meeting.status]}
            </Tag>
          </div>
        </div>
        <Popconfirm
          title="确认删除会议？"
          description="删除后无法恢复"
          onConfirm={handleDelete}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Popconfirm>
      </div>

      {/* Tabs */}
      <div style={{ flex: 1, overflow: "auto", padding: 20, background: "#f5f7fa" }}>
        <Tabs items={tabItems} defaultActiveKey="summary" />
      </div>
    </div>
  );
}
