import { CheckCircleFilled } from "@ant-design/icons";

interface Step {
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  current: number;
  steps: Step[];
}

export function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {/* 连接线背景 */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 40,
            right: 40,
            height: 2,
            background: "#e8ecf1",
            zIndex: 0,
          }}
        />
        {/* 连接线进度 */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 40,
            width: current > 0
              ? `${(current / (steps.length - 1)) * (100 - 80 / steps.length * 2)}%`
              : "0%",
            right: current === steps.length - 1 ? 40 : "auto",
            height: 2,
            background: "#0066ff",
            zIndex: 0,
            transition: "width 0.4s ease",
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < current;
          const isCurrent = index === current;
          const isPending = index > current;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 1,
                flex: 1,
              }}
            >
              {/* 步骤圆圈 */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  background: isCompleted
                    ? "#52c41a"
                    : isCurrent
                      ? "#0066ff"
                      : "#fff",
                  color: isCompleted || isCurrent ? "#fff" : "#8f959e",
                  border: isPending
                    ? "2px solid #e8ecf1"
                    : isCompleted
                      ? "2px solid #52c41a"
                      : "2px solid #0066ff",
                  boxShadow: isCurrent
                    ? "0 0 0 4px rgba(0, 102, 255, 0.15)"
                    : "none",
                }}
              >
                {isCompleted ? (
                  <CheckCircleFilled style={{ fontSize: 18 }} />
                ) : (
                  index + 1
                )}
              </div>

              {/* 标题 */}
              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCompleted
                    ? "#52c41a"
                    : isCurrent
                      ? "#1f2329"
                      : "#8f959e",
                  transition: "color 0.3s ease",
                }}
              >
                {step.title}
              </div>

              {/* 描述 */}
              {step.description && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: isCurrent ? "#646a73" : "#8f959e",
                  }}
                >
                  {step.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
