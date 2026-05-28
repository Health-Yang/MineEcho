import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Typography,
  Popconfirm,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { CalendarEvent } from "../types/meeting";
import { CalendarView } from "../components/CalendarView";

const { Title } = Typography;

interface CalendarFormValues {
  title: string;
  date: dayjs.Dayjs;
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  type: "meeting" | "commitment" | "personal";
  description?: string;
}

const calendarApi = {
  list: (startAt?: number, endAt?: number) =>
    fetch(
      `/api/calendar?start=${startAt ?? ""}&end=${endAt ?? ""}`
    ).then((r) => r.json()),
  create: (data: Omit<CalendarEvent, "id" | "createdAt">) =>
    fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  update: (id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt">>) =>
    fetch(`/api/calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  delete: (id: string) =>
    fetch(`/api/calendar/${id}`, { method: "DELETE" }).then((r) => r.json()),
};

const TYPE_OPTIONS = [
  { value: "meeting", label: "会议" },
  { value: "commitment", label: "承诺" },
  { value: "personal", label: "个人" },
];

interface CalendarPageProps {
  embedded?: boolean;
}

export function CalendarPage({ embedded }: CalendarPageProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm<CalendarFormValues>();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startAt = new Date(year, month, 1).getTime();
      const endAt = new Date(year, month + 1, 0, 23, 59, 59).getTime();
      const data = await calendarApi.list(startAt, endAt);
      setEvents(data.events || []);
    } catch {
      message.error("加载日历事件失败");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(date),
      startTime: dayjs(date).hour(9).minute(0),
      endTime: dayjs(date).hour(10).minute(0),
      type: "meeting",
    });
    setModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    const startDayjs = dayjs(event.startAt);
    const endDayjs = event.endAt ? dayjs(event.endAt) : dayjs(event.startAt).add(1, "hour");
    form.setFieldsValue({
      title: event.title,
      date: startDayjs,
      startTime: startDayjs,
      endTime: endDayjs,
      type: event.type,
      description: event.description || undefined,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const date = values.date;
      const startAt = date
        .hour(values.startTime.hour())
        .minute(values.startTime.minute())
        .second(0)
        .valueOf();
      const endAt = date
        .hour(values.endTime.hour())
        .minute(values.endTime.minute())
        .second(0)
        .valueOf();

      if (editingEvent) {
        await calendarApi.update(editingEvent.id, {
          title: values.title,
          startAt,
          endAt,
          type: values.type,
          description: values.description || null,
        });
        message.success("事件已更新");
      } else {
        await calendarApi.create({
          title: values.title,
          startAt,
          endAt,
          type: values.type,
          sourceId: null,
          description: values.description || null,
        });
        message.success("事件已创建");
      }
      setModalOpen(false);
      loadEvents();
    } catch {
      message.error("保存失败");
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    try {
      await calendarApi.delete(editingEvent.id);
      message.success("事件已删除");
      setModalOpen(false);
      loadEvents();
    } catch {
      message.error("删除失败");
    }
  };

  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];

  const headerBar = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: embedded ? "12px 16px" : "16px 24px",
        background: "#fff",
        borderBottom: "1px solid #e8ecf1",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {!embedded && (
          <Title level={3} style={{ margin: 0, fontSize: 20 }}>
            日历
          </Title>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            icon={<LeftOutlined />}
            size="small"
            onClick={handlePrevMonth}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              minWidth: 120,
              textAlign: "center",
            }}
          >
            {year}年 {monthNames[month]}
          </span>
          <Button
            icon={<RightOutlined />}
            size="small"
            onClick={handleNextMonth}
          />
        </div>
      </div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        size={embedded ? "small" : "middle"}
        onClick={() => {
          const today = new Date();
          setEditingEvent(null);
          form.resetFields();
          form.setFieldsValue({
            date: dayjs(today),
            startTime: dayjs(today).hour(9).minute(0),
            endTime: dayjs(today).hour(10).minute(0),
            type: "meeting",
          });
          setModalOpen(true);
        }}
      >
        新建事件
      </Button>
    </div>
  );

  const calendarBody = (
    <div style={{ flex: 1, overflow: "auto", padding: embedded ? 16 : 24 }}>
      <CalendarView
        events={events}
        year={year}
        month={month}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />
    </div>
  );

  if (embedded) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {headerBar}
        {calendarBody}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f5f7fa",
      }}
    >
      {headerBar}
      {calendarBody}

      {/* 新建/编辑事件 Modal */}
      <Modal
        title={editingEvent ? "编辑事件" : "新建事件"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        footer={(_, { OkBtn, CancelBtn }) => (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {editingEvent && (
                <Popconfirm
                  title="确认删除？"
                  onConfirm={handleDelete}
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <CancelBtn />
              <OkBtn />
            </div>
          </div>
        )}
      >
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="事件标题" />
          </Form.Item>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: "请选择日期" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              name="startTime"
              label="开始时间"
              rules={[{ required: true, message: "请选择开始时间" }]}
              style={{ flex: 1 }}
            >
              <DatePicker.TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                minuteStep={5}
              />
            </Form.Item>
            <Form.Item
              name="endTime"
              label="结束时间"
              rules={[{ required: true, message: "请选择结束时间" }]}
              style={{ flex: 1 }}
            >
              <DatePicker.TimePicker
                style={{ width: "100%" }}
                format="HH:mm"
                minuteStep={5}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}
          >
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
