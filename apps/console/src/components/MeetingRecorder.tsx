import { useRef, useCallback } from "react";
import { Button, Tooltip } from "antd";
import { StopOutlined, PauseOutlined, PlayCircleOutlined } from "@ant-design/icons";

interface MeetingRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingSeconds: number;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MeetingRecorder({
  isRecording,
  isPaused,
  recordingSeconds,
  onStop,
  onPause,
  onResume,
}: MeetingRecorderProps) {
  const showWaveAnimation = isRecording && !isPaused;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "32px 0",
      }}
    >
      {/* 波形动画 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 40,
          opacity: showWaveAnimation ? 1 : isPaused ? 0.5 : 0.3,
          transition: "opacity 0.3s ease",
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: 2,
              background: isPaused ? "#8c8c8c" : "#0066ff",
              animation: showWaveAnimation
                ? `wave 1s ease-in-out ${i * 0.08}s infinite alternate`
                : "none",
              height: showWaveAnimation ? undefined : 8,
            }}
          />
        ))}
      </div>

      {/* 时长 */}
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: isRecording ? (isPaused ? "#8c8c8c" : "#ff4d4f") : "#1f2329",
          letterSpacing: 2,
        }}
      >
        {formatTime(recordingSeconds)}
        {isPaused && (
          <span style={{ fontSize: 14, color: "#8c8c8c", marginLeft: 8 }}>已暂停</span>
        )}
      </div>

      {/* 录音按钮组 */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* 暂停/继续按钮 */}
        {isRecording && (
          <Tooltip title={isPaused ? "继续录音" : "暂停录音"}>
            <Button
              shape="circle"
              size="large"
              icon={
                isPaused ? (
                  <PlayCircleOutlined style={{ fontSize: 20 }} />
                ) : (
                  <PauseOutlined style={{ fontSize: 20 }} />
                )
              }
              onClick={isPaused ? onResume : onPause}
              style={{
                width: 56,
                height: 56,
                background: "#f5f5f5",
                borderColor: "#d9d9d9",
                color: "#595959",
              }}
            />
          </Tooltip>
        )}

        {/* 停止按钮 */}
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<StopOutlined style={{ fontSize: 24 }} />}
          onClick={onStop}
          style={{
            width: 72,
            height: 72,
            background: "#ff4d4f",
            borderColor: "#ff4d4f",
            boxShadow: "0 0 0 4px rgba(255, 77, 79, 0.2)",
          }}
        />
      </div>

      <style>{`
        @keyframes wave {
          0% { height: 8px; }
          100% { height: 36px; }
        }
      `}</style>
    </div>
  );
}

export function useMediaRecorder(
  meetingIdRef: React.MutableRefObject<string | null>,
  onChunkSent?: () => void
) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const meetingApi = {
    sendChunk: (id: string, blob: Blob) =>
      fetch(`/api/meeting/${id}/chunk`, { method: "POST", body: blob }).then(
        (r) => r.json()
      ),
  };

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        const id = meetingIdRef.current;
        if (e.data.size > 0 && id) {
          try {
            await meetingApi.sendChunk(id, e.data);
            onChunkSent?.();
          } catch {
            // chunk send error handled silently; BFF will retry or buffer
          }
        }
      };

      recorder.start(1000); // 每1秒产生一个chunk
      return true;
    } catch {
      return false;
    }
  }, [meetingIdRef, onChunkSent]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    const stream = streamRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    stream?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
  }, []);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
    }
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
    }
  }, []);

  return { start, stop, pause, resume };
}
