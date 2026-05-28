import { useMemo } from "react";
import type { CalendarEvent } from "../types/meeting";

interface CalendarViewProps {
  events: CalendarEvent[];
  year: number;
  month: number;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const TYPE_COLORS: Record<CalendarEvent["type"], string> = {
  meeting: "#0066ff",
  commitment: "#fa8c16",
  personal: "#8c8c8c",
};

const TYPE_LABELS: Record<CalendarEvent["type"], string> = {
  meeting: "会议",
  commitment: "承诺",
  personal: "个人",
};

export function CalendarView({ events, year, month, onDateClick, onEventClick }: CalendarViewProps) {
  const today = new Date();

  const { days } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDayOfMonth.getDay(); // 0=Sun
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startOffset + 1;
      if (dayNum > 0 && dayNum <= daysInMonth) {
        days.push({ date: new Date(year, month, dayNum), isCurrentMonth: true });
      } else {
        days.push({ date: null, isCurrentMonth: false });
      }
    }
    return { days, startOffset, totalCells };
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.startAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {weekDays.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#8c8c8c",
              padding: "8px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((day, idx) => {
          if (!day.date) {
            return (
              <div
                key={idx}
                style={{
                  minHeight: 100,
                  background: "#f5f7fa",
                  borderRadius: 8,
                }}
              />
            );
          }

          const isToday =
            day.date.getDate() === today.getDate() &&
            day.date.getMonth() === today.getMonth() &&
            day.date.getFullYear() === today.getFullYear();

          const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
          const dayEvents = eventsByDate.get(key) || [];

          return (
            <div
              key={idx}
              onClick={() => onDateClick(day.date!)}
              style={{
                minHeight: 100,
                background: "#fff",
                borderRadius: 8,
                border: isToday ? "2px solid #0066ff" : "1px solid #e8ecf1",
                padding: 8,
                cursor: "pointer",
                transition: "box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? "#0066ff" : "#1f2329",
                  marginBottom: 4,
                }}
              >
                {day.date.getDate()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: `${TYPE_COLORS[ev.type]}15`,
                      color: TYPE_COLORS[ev.type],
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "pointer",
                    }}
                    title={`${ev.title} (${TYPE_LABELS[ev.type]})`}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 11, color: "#8c8c8c", paddingLeft: 4 }}>
                    +{dayEvents.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
