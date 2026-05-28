import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  Button,
  Tag,
  Typography,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Alert,
} from "antd";
import { AudioOutlined, TeamOutlined, EnvironmentOutlined, CalendarOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { CheckSquareOutlined, ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { Segmented } from "antd";
import { useNavigate } from "react-router-dom";
import type { Meeting } from "../types/meeting";
import { MeetingRecorder, useMediaRecorder } from "../components/MeetingRecorder";
import { MeetingDetail } from "../components/MeetingDetail";
import { EditableTitle } from "../components/EditableTitle";
import { CalendarPage } from "./CalendarPage";
import { buildMeetingStats, formatMeetingDuration, getMeetingDisplayDuration } from "../utils/meetingStats";

const { Title, Text } = Typography;

interface StartMeetingForm {
  title: string;
  participants?: string;
  location?: string;
}

interface TranscriptionConfig {
  enabled: boolean;
  provider: string;
  model: string;
}

const meetingApi = {
  start: (data: StartMeetingForm) =>
    fetch("/api/meeting/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  stop: (id: string) =>
    fetch(`/api/meeting/${id}/stop`, { method: "POST" }).then((r) => r.json()),
  sendChunk: (id: string, blob: Blob) =>
    fetch(`/api/meeting/${id}/chunk`, { method: "POST", body: blob }).then(
      (r) => r.json()
    ),
  list: () => fetch("/api/meeting").then((r) => r.json()),
  get: (id: string) => fetch(`/api/meeting/${id}`).then((r) => r.json()),
  summarize: (id: string) =>
    fetch(`/api/meeting/${id}/summarize`, { method: "POST" }).then((r) =>
      r.json()
    ),
  getCommitments: (id: string) =>
    fetch(`/api/meeting/${id}/commitments`).then((r) => r.json()),
  extractCommitments: (id: string) =>
    fetch(`/api/meeting/${id}/commitments`, { method: "POST" }).then((r) =>
      r.json()
    ),
  delete: (id: string) =>
    fetch(`/api/meeting/${id}`, { method: "DELETE" }).then((r) => r.json()),
  update: (id: string, data: { title?: string; participants?: string; location?: string }) =>
    fetch(`/api/meeting/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  cleanTranscript: (id: string) =>
    fetch(`/api/meeting/${id}/transcript-clean`, { method: "POST" }).then((r) =>
      r.json()
    ),
  transcriptionConfig: () =>
    fetch("/api/config/transcription").then((r) => r.json() as Promise<TranscriptionConfig>),
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

const STORAGE_KEY = "mineecho_selected_meeting";

function MeetingMetric({
  label,
  value,
  icon,
  tone = "#0066ff",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <div
      style={{
        minWidth: 120,
        padding: "9px 12px",
        border: "1px solid #eef1f5",
        borderRadius: 6,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ color: tone, fontSize: 16, display: "inline-flex" }}>{icon}</span>
      <span>
        <div style={{ fontSize: 11, color: "#8c8c8c", lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 650, color: "#1f2329", lineHeight: 1.35 }}>{value}</div>
      </span>
    </div>
  );
}

function getStoredMeetingId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeMeetingId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function MeetingPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(getStoredMeetingId);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startForm] = Form.useForm();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig | null>(null);

  const meetingIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist selectedMeetingId to localStorage
  useEffect(() => {
    storeMeetingId(selectedMeetingId);
  }, [selectedMeetingId]);

  const { start: startRecorder, stop: stopRecorder, pause: pauseRecorder, resume: resumeRecorder } = useMediaRecorder(
    meetingIdRef,
    () => {
      // chunk sent callback - optional
    }
  );

  const loadMeetings = useCallback(async () => {
    try {
      const data = await meetingApi.list();
      setMeetings(data.meetings || []);
    } catch {
      message.error("加载会议列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    let cancelled = false;
    meetingApi.transcriptionConfig()
      .then((config) => {
        if (!cancelled) setTranscriptionConfig(config);
      })
      .catch(() => {
        if (!cancelled) setTranscriptionConfig({ enabled: false, provider: "dashscope", model: "" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTitleUpdate = async (meetingId: string, newTitle: string) => {
    await meetingApi.update(meetingId, { title: newTitle });
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, title: newTitle } : m))
    );
    message.success("标题已更新");
  };

  // 计算显示时长：如果是当前录音的会议，显示实时计时器
  const getDisplayDuration = (meeting: Meeting) => {
    return getMeetingDisplayDuration(meeting, { isRecording, selectedMeetingId, recordingSeconds });
  };

  const meetingStats = buildMeetingStats(meetings, { isRecording, selectedMeetingId, recordingSeconds });

  // 录音计时器
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const handleStartClick = () => {
    if (transcriptionConfig && !transcriptionConfig.enabled) {
      message.warning("语音转录尚未配置，会议录音可以开始，但无法自动生成转录文本");
    }
    setStartModalOpen(true);
  };

  const handleStartConfirm = async () => {
    try {
      const values = await startForm.validateFields();
      const data = await meetingApi.start(values);
      if (!data.id) {
        message.error("启动会议失败");
        return;
      }
      setStartModalOpen(false);
      startForm.resetFields();
      meetingIdRef.current = data.id;
      const ok = await startRecorder();
      if (!ok) {
        message.error("无法访问麦克风，请检查权限设置");
        meetingIdRef.current = null;
        return;
      }
      setIsRecording(true);
      setRecordingSeconds(0);
      // 立即将新会议添加到列表（使用 API 返回的标题）
      setMeetings((prev) => [
        {
          id: data.id,
          title: data.title || values.title || "未命名会议",
          participants: values.participants || null,
          location: values.location || null,
          startedAt: data.startedAt || Date.now(),
          endedAt: null,
          durationSec: null,
          audioPath: null,
          transcript: null,
          cleanedTranscript: null,
          summary: null,
          status: "recording" as const,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      setSelectedMeetingId(data.id);
      message.success("会议已开始");
    } catch {
      // Form validation failed or API error
    }
  };

  const handleStartCancel = () => {
    setStartModalOpen(false);
    startForm.resetFields();
  };

  const handlePause = () => {
    pauseRecorder();
    setIsPaused(true);
    message.info("录音已暂停");
  };

  const handleResume = () => {
    resumeRecorder();
    setIsPaused(false);
    message.success("录音已继续");
  };

  const handleStop = async () => {
    const id = meetingIdRef.current;
    stopRecorder();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingSeconds(0);
    if (id) {
      try {
        const result = await meetingApi.stop(id);
        message.success("录音已停止，正在处理...");
        // 自动跳转到会议详情页面，显示处理进度
        setSelectedMeetingId(id);
        // 更新列表中的该会议状态
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, status: result.status || "transcribing" } : m
          )
        );
      } catch {
        message.error("停止录音失败");
      } finally {
        meetingIdRef.current = null;
      }
    }
  };

  const handleDelete = () => {
    setSelectedMeetingId(null);
    storeMeetingId(null);
    loadMeetings();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f5f7fa" }}>
      {/* 顶部标题栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          padding: "18px 24px 14px",
          background: "#fff",
          borderBottom: "1px solid #e8ecf1",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Title level={3} style={{ margin: 0, fontSize: 20, lineHeight: 1.25 }}>
            我的会议
          </Title>
          <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 12 }}>
            录音、转录、纪要、承诺提取和日历同步集中处理
          </Text>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <MeetingMetric label="会议数" value={meetingStats.total} icon={<FileTextOutlined />} />
            <MeetingMetric label="已完成" value={meetingStats.completed} icon={<CheckSquareOutlined />} tone="#52c41a" />
            <MeetingMetric label="处理中" value={meetingStats.processing} icon={<ClockCircleOutlined />} tone="#fa8c16" />
            <MeetingMetric label="累计时长" value={formatMeetingDuration(meetingStats.totalDuration)} icon={<AudioOutlined />} tone="#722ed1" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as "list" | "calendar")}
              options={[
                { value: "list", icon: <UnorderedListOutlined />, label: "列表" },
                { value: "calendar", icon: <CalendarOutlined />, label: "日历" },
              ]}
            />
            <Button
              type="primary"
              icon={<AudioOutlined />}
              onClick={isRecording ? handleStop : handleStartClick}
              danger={isRecording}
            >
              {isRecording ? "结束会议" : "开始会议"}
            </Button>
          </div>
        </div>
      </div>

      {transcriptionConfig && !transcriptionConfig.enabled && (
        <div style={{ padding: "10px 24px", background: "#fff", borderBottom: "1px solid #e8ecf1", flexShrink: 0 }}>
          <Alert
            type="warning"
            showIcon
            message="会议转录需要配置语音模型"
            description="当前未检测到 DashScope 语音转录配置。配置后，会议录音才能自动转成文字，并继续生成纪要、承诺事项和日历事件。"
            action={
              <Button size="small" type="primary" onClick={() => navigate("/config?section=transcription")}>
                去设置
              </Button>
            }
          />
        </div>
      )}

      {/* 开始会议表单弹窗 */}
      <Modal
        title="开始新会议"
        open={startModalOpen}
        onOk={handleStartConfirm}
        onCancel={handleStartCancel}
        okText="开始会议"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={startForm}
          layout="vertical"
          initialValues={{ title: "", participants: "", location: "" }}
        >
          <Form.Item
            name="title"
            label="会议名称"
            rules={[{ required: true, message: "请输入会议名称" }]}
          >
            <Input placeholder="例如：产品评审会议、周例会" />
          </Form.Item>
          <Form.Item
            name="participants"
            label="参会人员"
          >
            <Input
              prefix={<TeamOutlined style={{ color: "#8f959e" }} />}
              placeholder="例如：张三、李四（逗号分隔）"
            />
          </Form.Item>
          <Form.Item
            name="location"
            label="会议地点"
          >
            <Input
              prefix={<EnvironmentOutlined style={{ color: "#8f959e" }} />}
              placeholder="例如：会议室A、线上会议"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 主体内容 */}
      {viewMode === "calendar" ? (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <CalendarPage embedded />
        </div>
      ) : (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* 左侧会议列表 */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              borderRight: "1px solid #e8ecf1",
              background: "#fff",
              overflow: "auto",
              padding: "16px 12px",
            }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                <Spin />
              </div>
            ) : meetings.length === 0 ? (
              <div style={{ padding: "52px 12px", textAlign: "center" }}>
                <Empty
                  description={
                    <div>
                      <div style={{ color: "#1f2329", fontSize: 14, marginBottom: 4 }}>暂无会议记录</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        开始会议后会自动进入录音、转录、纪要和承诺提取流程
                      </Text>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Button type="primary" icon={<AudioOutlined />} onClick={handleStartClick} style={{ marginTop: 12 }}>
                  开始第一场会议
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {meetings.map((meeting) => (
                  <Card
                    key={meeting.id}
                    size="small"
                    onClick={() => setSelectedMeetingId(meeting.id)}
                    style={{
                      borderRadius: 8,
                      cursor: "pointer",
                      border:
                        selectedMeetingId === meeting.id
                          ? "1px solid #0066ff"
                          : "1px solid #e8ecf1",
                      background: selectedMeetingId === meeting.id ? "#f0f5ff" : "#fff",
                      transition: "all 0.2s ease",
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ flex: 1, marginRight: 8 }} onClick={(e) => e.stopPropagation()}>
                        <EditableTitle
                          title={meeting.title}
                          onSave={(newTitle) => handleTitleUpdate(meeting.id, newTitle)}
                          style={{ fontSize: 14, color: "#1f2329", lineHeight: 1.4 }}
                        />
                      </div>
                      <Tag color={statusColor[meeting.status]} style={{ fontSize: 11, flexShrink: 0 }}>
                        {statusText[meeting.status]}
                      </Tag>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(meeting.startedAt).toLocaleDateString("zh-CN")}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatMeetingDuration(getDisplayDuration(meeting))}
                      </Text>
                    </div>
                    {(meeting.participants || meeting.location) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        {meeting.participants && (
                          <Text type="secondary" style={{ fontSize: 11, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <TeamOutlined style={{ marginRight: 4 }} />
                            {meeting.participants}
                          </Text>
                        )}
                        {meeting.location && (
                          <Text type="secondary" style={{ fontSize: 11, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <EnvironmentOutlined style={{ marginRight: 4 }} />
                            {meeting.location}
                          </Text>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 右侧详情区域 */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {isRecording && !selectedMeetingId ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  margin: 16,
                  borderRadius: 8,
                  border: "1px solid #e8ecf1",
                }}
              >
                <MeetingRecorder
                  isRecording={isRecording}
                  isPaused={isPaused}
                  recordingSeconds={recordingSeconds}
                  onStop={handleStop}
                  onPause={handlePause}
                  onResume={handleResume}
                />
              </div>
            ) : selectedMeetingId ? (
              <MeetingDetail meetingId={selectedMeetingId} onDelete={handleDelete} />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  margin: 16,
                  borderRadius: 8,
                  border: "1px solid #e8ecf1",
                }}
              >
                <Empty
                  description={
                    <div>
                      <div style={{ color: "#1f2329", fontSize: 14, marginBottom: 4 }}>选择左侧会议查看详情</div>
                      <Text type="secondary">也可以点击右上角开始录音，生成新的会议工作流</Text>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
