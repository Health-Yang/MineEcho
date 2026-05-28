import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Space, message, Tooltip, Collapse, Tag, List, Typography } from "antd";
import {
  ReloadOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  ClockCircleOutlined,
  ApartmentOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { MemoryTree, MemoryNode } from "../components/MemoryTree";
import { MemoryDetail } from "../components/MemoryDetail";
import { fetchMemoryTimeline, type MemoryStats } from "../utils/memoryTimeline";
import {
  fetchMemoryDreamPreview,
  runMemoryDream,
  type MemoryDreamResult,
} from "../utils/memoryDream";
import { fetchMemoryStoryline, type MemoryStoryline } from "../utils/memoryStoryline";

function formatNumber(value?: number): string {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function MemoryStat({
  label,
  value,
  tone = "#0066ff",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div
      style={{
        minWidth: 92,
        padding: "8px 10px",
        border: "1px solid #eef1f5",
        borderRadius: 6,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 11, color: "#8c8c8c", lineHeight: 1.4 }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 16, fontWeight: 650, color: tone, lineHeight: 1.3 }}>
        {value}
      </div>
    </div>
  );
}

export function MemoryPage() {
  const navigate = useNavigate();
  const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [dreaming, setDreaming] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [dreamResult, setDreamResult] = useState<MemoryDreamResult | null>(null);
  const [storyline, setStoryline] = useState<MemoryStoryline | null>(null);
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [stats, setStats] = useState<MemoryStats>({
    totalMemories: 0,
    lastUpdated: Date.now(),
    levels: { l0: 0, l1: 0, l2: 0, l3: 0 },
  });

  const loadMemories = useCallback(async (showSuccess = false) => {
    setRefreshing(true);
    try {
      const timeline = await fetchMemoryTimeline({ days: 30, limit: 160 });
      setMemories(timeline.nodes);
      setStats(timeline.stats);
      setSelectedMemory((current) => {
        if (!current) return current;
        const find = (nodes: MemoryNode[]): MemoryNode | null => {
          for (const node of nodes) {
            if (node.id === current.id) return node;
            const child = node.children ? find(node.children) : null;
            if (child) return child;
          }
          return null;
        };
        return find(timeline.nodes);
      });
      if (showSuccess) message.success("记忆已刷新");
    } catch (error) {
      message.error((error as Error).message || "刷新失败，请重试");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handlePreviewDream = useCallback(async () => {
    setDreaming(true);
    try {
      const result = await fetchMemoryDreamPreview(7);
      setDreamResult(result);
      if (result.processedChunks === 0) {
        message.info("最近 7 天还没有可整理的记忆");
      } else {
        message.success("已生成记忆整理预览");
      }
    } catch (error) {
      message.error((error as Error).message || "记忆整理预览失败");
    } finally {
      setDreaming(false);
    }
  }, []);

  const handleRunDream = useCallback(async () => {
    setDreaming(true);
    try {
      const result = await runMemoryDream(7);
      setDreamResult(result);
      message.success("记忆整理已完成");
      await loadMemories();
    } catch (error) {
      message.error((error as Error).message || "记忆整理失败");
    } finally {
      setDreaming(false);
    }
  }, [loadMemories]);

  const handleLoadStoryline = useCallback(async () => {
    setStoryLoading(true);
    try {
      const result = await fetchMemoryStoryline(30);
      setStoryline(result);
      if (result.itemCount === 0) {
        message.info("最近 30 天还没有足够记忆形成阶段回顾");
      } else {
        message.success("已生成阶段回顾");
      }
    } catch (error) {
      message.error((error as Error).message || "阶段回顾生成失败");
    } finally {
      setStoryLoading(false);
    }
  }, []);

  // Handle memory selection
  const handleSelect = useCallback((memory: MemoryNode | null) => {
    setSelectedMemory(memory);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadMemories(true);
  }, [loadMemories]);

  const handleGenerateDailySummary = useCallback(async () => {
    setSummarizing(true);
    try {
      const response = await fetch("/api/memory/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 1 }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "生成日摘要失败");
      }
      if (result.success === false) {
        message.info("今天还没有可沉淀的 L0 记忆");
        return;
      }
      message.success("已生成 L1 日摘要");
      await loadMemories();
    } catch (error) {
      message.error((error as Error).message || "生成日摘要失败");
    } finally {
      setSummarizing(false);
    }
  }, [loadMemories]);

  const onlyL0Memories =
    stats.levels.l0 > 0 &&
    stats.levels.l1 === 0 &&
    stats.levels.l2 === 0 &&
    stats.levels.l3 === 0;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#f5f7fa",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          padding: "18px 24px 14px",
          background: "#fff",
          borderBottom: "1px solid #e8ecf1",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1f2329",
                margin: 0,
                marginBottom: 6,
                lineHeight: 1.25,
              }}
            >
              我的记忆
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                fontSize: 12,
                color: "#8c8c8c",
              }}
            >
              <span>
                <DatabaseOutlined style={{ marginRight: 4 }} />
                {formatNumber(stats.totalMemories)} 条真实记忆
              </span>
              <span>
                <NodeIndexOutlined style={{ marginRight: 4 }} />
                L0-L3 是层级，来源包含对话、会议、技能、知识、手动
              </span>
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {new Date(stats.lastUpdated).toLocaleString("zh-CN", { hour12: false })}
              </span>
            </div>
          </div>

          <Space size={12} align="start">
            <div style={{ display: "flex", gap: 8 }}>
              <MemoryStat label="L0 原始" value={stats.levels.l0} tone="#0066ff" />
              <MemoryStat label="L1 日摘要" value={stats.levels.l1} tone="#52c41a" />
              <MemoryStat label="L2 周摘要" value={stats.levels.l2} tone="#fa8c16" />
              <MemoryStat label="L3 月回顾" value={stats.levels.l3} tone="#722ed1" />
            </div>
            <Tooltip title="刷新">
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                刷新
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<ApartmentOutlined />}
              onClick={() => navigate("/knowledge")}
            >
              知识沉淀
            </Button>
            <Button
              onClick={handleGenerateDailySummary}
              loading={summarizing}
              disabled={stats.levels.l0 === 0}
            >
              生成日摘要
            </Button>
            <Button
              icon={<ExperimentOutlined />}
              onClick={handlePreviewDream}
              loading={dreaming}
              disabled={stats.levels.l0 === 0}
            >
              记忆整理
            </Button>
          </Space>
        </div>
        {onlyL0Memories && (
          <Alert
            showIcon
            type="info"
            style={{ marginTop: 14 }}
            message="当前主要是 L0 原始记忆"
            description="这是正常状态：对话、会议、技能和知识导入会先实时写入 L0；达到阈值或手动生成日摘要后，会沉淀为 L1，后续再按周期压缩为 L2/L3。"
          />
        )}
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          padding: 16,
          gap: 16,
        }}
      >
        {/* Left Panel - Memory Tree */}
        <div
          className="sf-card"
          style={{
            width: 360,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <MemoryTree
            data={memories}
            selectedId={selectedMemory?.id || null}
            onSelect={handleSelect}
            loading={refreshing}
          />
        </div>

        {/* Right Panel - Memory Detail */}
        <div
          className="sf-card"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px 0", flexShrink: 0 }}>
            <Collapse
              size="small"
              bordered={false}
              style={{ background: "#f8fafc", border: "1px solid #edf1f5", borderRadius: 6 }}
              items={[
                {
                  key: "dream",
                  label: (
                    <Space size={8} wrap>
                      <ExperimentOutlined />
                      <span style={{ fontWeight: 650 }}>记忆整理</span>
                      {dreamResult ? (
                        <Tag color="blue">{dreamResult.processedChunks} 条 L0</Tag>
                      ) : (
                        <Tag>最近 7 天</Tag>
                      )}
                    </Space>
                  ),
                  extra: (
                    <Space size={8} onClick={(event) => event.stopPropagation()}>
                      <Button size="small" onClick={handlePreviewDream} loading={dreaming}>
                        预览
                      </Button>
                      <Button size="small" type="primary" onClick={handleRunDream} loading={dreaming}>
                        运行整理
                      </Button>
                      <Button size="small" onClick={handleLoadStoryline} loading={storyLoading}>
                        阶段回顾
                      </Button>
                    </Space>
                  ),
                  children: dreamResult ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <Typography.Text strong>主题</Typography.Text>
                        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {dreamResult.themes.length > 0 ? dreamResult.themes.map((theme) => (
                            <Tag key={theme.name} color="processing">
                              {theme.name} · {theme.count}
                            </Tag>
                          )) : <Typography.Text type="secondary">暂无明显主题</Typography.Text>}
                        </div>
                      </div>
                      <div>
                        <Typography.Text strong>摘要沉淀</Typography.Text>
                        <div style={{ marginTop: 8, color: "#5f6875", fontSize: 13 }}>
                          L1 {dreamResult.summaries.l1.length} 条
                          {dreamResult.summaries.l2 ? ` · L2 ${dreamResult.summaries.l2.weekStart}` : ""}
                          {dreamResult.summaries.l3 ? ` · L3 ${dreamResult.summaries.l3.month}` : ""}
                        </div>
                      </div>
                      <div>
                        <Typography.Text strong>长期记忆候选</Typography.Text>
                        <List
                          size="small"
                          dataSource={dreamResult.semanticMemories.slice(0, 3)}
                          locale={{ emptyText: "暂无候选" }}
                          renderItem={(item) => <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>{item}</List.Item>}
                        />
                      </div>
                      <div>
                        <Typography.Text strong>待确认问题</Typography.Text>
                        <List
                          size="small"
                          dataSource={dreamResult.openQuestions.slice(0, 3)}
                          locale={{ emptyText: "暂无问题" }}
                          renderItem={(item) => <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>{item}</List.Item>}
                        />
                      </div>
                      {dreamResult.forgettingCandidates.length > 0 && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <Typography.Text strong>遗忘候选</Typography.Text>
                          <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                            {dreamResult.forgettingCandidates.slice(0, 3).map((item) => item.preview || item.reason).join("；")}
                          </div>
                        </div>
                      )}
                      {storyline && (
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            borderTop: "1px solid #edf1f5",
                            paddingTop: 12,
                          }}
                        >
                          <Space size={8} wrap>
                            <Typography.Text strong>{storyline.title}</Typography.Text>
                            <Tag color="geekblue">{storyline.itemCount} 条记忆</Tag>
                          </Space>
                          <div style={{ marginTop: 8, color: "#394150", lineHeight: 1.7 }}>
                            {storyline.headline}
                          </div>
                          {storyline.chapters.length > 0 && (
                            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              {storyline.chapters.slice(0, 4).map((chapter) => (
                                <div
                                  key={chapter.title}
                                  style={{
                                    border: "1px solid #edf1f5",
                                    borderRadius: 6,
                                    padding: "8px 10px",
                                    background: "#fff",
                                  }}
                                >
                                  <div style={{ fontWeight: 650, marginBottom: 4 }}>{chapter.title}</div>
                                  <div style={{ color: "#5f6875", fontSize: 13, lineHeight: 1.6 }}>{chapter.summary}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {storyline.nextQuestions.length > 0 && (
                            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
                              下一步问题：{storyline.nextQuestions.slice(0, 2).join("；")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Typography.Text type="secondary">
                      先预览最近 7 天的 L0 记忆，确认主题、长期记忆候选和遗忘候选；运行整理后会生成或复用 L1/L2/L3 摘要。
                    </Typography.Text>
                  ),
                },
              ]}
            />
          </div>
          <MemoryDetail
            memory={selectedMemory}
            loading={refreshing}
            onRefresh={handleRefresh}
            onOpenKnowledgeAlignment={() => navigate("/knowledge")}
          />
        </div>
      </div>
    </div>
  );
}

export default MemoryPage;
