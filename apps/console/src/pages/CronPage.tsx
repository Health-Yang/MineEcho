import { useState, useEffect } from "react";
import { List, Switch, Typography, Button, Card, Space, Drawer, Form, Input, Tag, message, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface Job {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun: string | null;
  lastStatus?: "success" | "failed";
  lastError?: string;
  nextRun?: string;
  command?: string;
  description?: string;
}

export function CronPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form] = Form.useForm();

  const load = () => {
    fetch("/api/cron")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []))
      .catch(() => setJobs([]));
  };

  useEffect(load, []);

  const toggle = (id: string, enabled: boolean) => {
    fetch(`/api/cron/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    })
      .then((r) => r.json())
      .then((job) => {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
        message.success(enabled ? "定时任务已启用" : "定时任务已停用");
      })
      .catch(() => message.error("操作失败"));
  };

  const openDrawer = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      form.setFieldsValue(job);
    } else {
      setEditingJob(null);
      form.resetFields();
      form.setFieldsValue({
        name: "新定时任务",
        schedule: "*/5 * * * *",
        command: "",
        description: ""
      });
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingJob(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingJob) {
        // 更新现有任务
        const response = await fetch(`/api/cron/${editingJob.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const updatedJob = await response.json();
        setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
        message.success("定时任务已更新");
      } else {
        // 创建新任务
        const response = await fetch("/api/cron", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const newJob = await response.json();
        setJobs((prev) => [...prev, newJob]);
        message.success("定时任务已创建");
      }

      closeDrawer();
    } catch (error) {
      message.error("保存失败");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/cron/${id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
      message.success("定时任务已删除");
    } catch (error) {
      message.error("删除失败");
    }
  };

  const parseCronDescription = (schedule: string): string => {
    // 简单的 cron 表达式解析
    const match = schedule.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
    if (match) {
      return `每 ${match[1]} 分钟执行一次`;
    }

    const parts = schedule.split(" ");
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      if (minute !== "*" && hour !== "*" && day === "*" && month === "*" && weekday === "*") {
        return `每天 ${hour}:${minute.padStart(2, "0")} 执行`;
      }
    }

    return schedule;
  };

  const formatLastRun = (lastRun: string | null): string => {
    if (!lastRun) return "从未执行";
    const date = new Date(lastRun);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return `${Math.floor(diff / 86400000)} 天前`;
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>⏰ 定时任务</Title>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            配置定时执行的任务，支持 Cron 表达式
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
          新建任务
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={jobs}
        locale={{ emptyText: "暂无定时任务，点击右上角新建" }}
        renderItem={(job) => (
          <List.Item>
            <Card
              hoverable
              actions={[
                <Tooltip title="编辑">
                  <EditOutlined key="edit" onClick={() => openDrawer(job)} />
                </Tooltip>,
                <Popconfirm
                  title="确认删除"
                  description="删除后无法恢复，确定要删除这个定时任务吗？"
                  onConfirm={() => handleDelete(job.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <Tooltip title="删除">
                    <DeleteOutlined key="delete" />
                  </Tooltip>
                </Popconfirm>,
                <Switch
                  key="toggle"
                  checked={job.enabled}
                  onChange={(v) => toggle(job.id, v)}
                  checkedChildren="启用"
                  unCheckedChildren="停用"
                />
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Text strong>{job.name}</Text>
                    {job.enabled ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">运行中</Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="default">已停用</Tag>
                    )}
                  </div>
                }
                description={
                  <div style={{ marginTop: 12 }}>
                    {job.description && (
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ marginBottom: 12, fontSize: 13 }}
                      >
                        {job.description}
                      </Paragraph>
                    )}

                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ClockCircleOutlined style={{ color: "#0066ff" }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {parseCronDescription(job.schedule)}
                        </Text>
                      </div>

                      {job.command && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>AI 提示词：</Text>
                          <Text code style={{ fontSize: 12 }}>{job.command}</Text>
                        </div>
                      )}

                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          上次执行：{formatLastRun(job.lastRun)}
                        </Text>
                        {job.lastStatus && (
                          <>
                            {job.lastStatus === "success" ? (
                              <Tag color="success" style={{ marginLeft: 8 }}>成功</Tag>
                            ) : (
                              <Tooltip title={job.lastError || "执行失败"}>
                                <Tag color="error" style={{ marginLeft: 8 }}>失败</Tag>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </div>
                    </Space>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Drawer
        title={editingJob ? "编辑定时任务" : "新建定时任务"}
        width={520}
        open={drawerOpen}
        onClose={closeDrawer}
        extra={
          <Space>
            <Button onClick={closeDrawer}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="任务名称"
            name="name"
            rules={[{ required: true, message: "请输入任务名称" }]}
          >
            <Input placeholder="例如：每日健康报告" />
          </Form.Item>

          <Form.Item
            label="任务描述"
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="描述这个定时任务的用途"
            />
          </Form.Item>

          <Form.Item
            label="Cron 表达式"
            name="schedule"
            rules={[{ required: true, message: "请输入 Cron 表达式" }]}
            extra={
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>常用示例：</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag style={{ cursor: "pointer" }} onClick={() => form.setFieldValue("schedule", "*/5 * * * *")}>
                    每 5 分钟
                  </Tag>
                  <Tag style={{ cursor: "pointer" }} onClick={() => form.setFieldValue("schedule", "*/30 * * * *")}>
                    每 30 分钟
                  </Tag>
                  <Tag style={{ cursor: "pointer" }} onClick={() => form.setFieldValue("schedule", "0 9 * * *")}>
                    每天 9:00
                  </Tag>
                  <Tag style={{ cursor: "pointer" }} onClick={() => form.setFieldValue("schedule", "0 0 * * 1")}>
                    每周一 0:00
                  </Tag>
                </div>
              </div>
            }
          >
            <Input placeholder="例如：*/5 * * * * (每5分钟)" />
          </Form.Item>

          <Form.Item
            label="AI 提示词"
            name="command"
            rules={[{ required: true, message: "请输入 AI 提示词" }]}
            extra="定时任务触发时，将此提示词发送给 AI 执行"
          >
            <Input.TextArea
              rows={4}
              placeholder="例如：生成今日健康报告并发送到飞书群"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
