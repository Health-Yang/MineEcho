import React, { useMemo, useState } from "react";
import { Badge, DatePicker, Empty, Input, Select, Space, Spin, Tag, Tree } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  BulbOutlined,
  MessageOutlined,
  ProfileOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { DataNode, TreeProps } from "antd/es/tree";
import dayjs from "dayjs";
import type { MemoryLevel, MemoryNode } from "../utils/memoryTimeline";

export type { MemoryLevel, MemoryNode };

const { RangePicker } = DatePicker;

const getLevelIcon = (level: MemoryLevel) => {
  switch (level) {
    case "L0":
      return <DatabaseOutlined style={{ color: "#0066ff" }} />;
    case "L1":
      return <ProfileOutlined style={{ color: "#52c41a" }} />;
    case "L2":
      return <FileTextOutlined style={{ color: "#faad14" }} />;
    case "L3":
      return <MessageOutlined style={{ color: "#722ed1" }} />;
    default:
      return <FileTextOutlined />;
  }
};

const getSourceIcon = (sourceType?: string) => {
  switch (sourceType) {
    case "user-profile":
      return <UserOutlined />;
    case "skill-pattern":
      return <BulbOutlined />;
    case "manual":
      return <ProfileOutlined />;
    case "burnout":
    case "daily":
    case "meeting":
      return <CalendarOutlined />;
    case "knowledge":
    case "summary":
      return <FileTextOutlined />;
    default:
      return <MessageOutlined />;
  }
};

function findNode(nodes: MemoryNode[], id: React.Key): MemoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function renderTreeTitle(node: MemoryNode, selectedId?: string | null): React.ReactNode {
  const hasChildren = Boolean(node.children?.length);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
      <span style={{ flexShrink: 0, marginTop: 2 }}>
        {hasChildren ? getLevelIcon(node.level) : getSourceIcon(node.sourceType)}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: hasChildren ? 13 : 12,
            fontWeight: selectedId === node.id ? 600 : hasChildren ? 500 : 400,
            color: selectedId === node.id ? "#0066ff" : "#1f2329",
            lineHeight: 1.4,
          }}
        >
          {node.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#8c8c8c",
            marginTop: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          {!hasChildren && (
            <Tag color="default" style={{ margin: 0, fontSize: 10, lineHeight: "16px", flexShrink: 0 }}>
              {node.sourceLabel}
            </Tag>
          )}
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.summary}
          </span>
        </div>
      </div>
      {hasChildren && (
        <Badge
          count={node.children?.length}
          size="small"
          style={{ backgroundColor: "#f0f0f0", color: "#8c8c8c", fontSize: 10 }}
        />
      )}
    </div>
  );
}

function getFilterSourceType(sourceType: string): string {
  if (sourceType === "skill") return "skill-pattern";
  if (sourceType === "conversation") return "interaction";
  return sourceType;
}

function toTreeData(nodes: MemoryNode[], selectedId?: string | null): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: renderTreeTitle(node, selectedId),
    children: node.children ? toTreeData(node.children, selectedId) : undefined,
    isLeaf: !node.children?.length,
  }));
}

export interface MemoryTreeProps {
  data: MemoryNode[];
  onSelect?: (node: MemoryNode | null) => void;
  selectedId?: string | null;
  loading?: boolean;
}

export const MemoryTree: React.FC<MemoryTreeProps> = ({
  data,
  onSelect,
  selectedId,
  loading = false,
}) => {
  const [searchText, setSearchText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(["group-l0", "group-l1"]);

  const filteredData = useMemo(() => {
    const filterNode = (node: MemoryNode): MemoryNode | null => {
      const matchesSearch =
        !searchText ||
        node.title.toLowerCase().includes(searchText.toLowerCase()) ||
        node.summary.toLowerCase().includes(searchText.toLowerCase()) ||
        node.content.toLowerCase().includes(searchText.toLowerCase());

      const matchesSource = !sourceFilter || getFilterSourceType(node.sourceType || "") === sourceFilter;
      const matchesDate =
        !dateRange ||
        (node.createdAt >= dateRange[0].valueOf() && node.createdAt <= dateRange[1].valueOf());
      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((child): child is MemoryNode => child !== null);

      if (matchesSearch && matchesSource && matchesDate) {
        return { ...node, children: filteredChildren };
      }
      if (filteredChildren?.length) {
        return { ...node, children: filteredChildren };
      }
      return null;
    };

    return data.map(filterNode).filter((node): node is MemoryNode => node !== null);
  }, [data, dateRange, searchText, sourceFilter]);

  const treeData = useMemo(() => toTreeData(filteredData, selectedId), [filteredData, selectedId]);

  const handleSelect: TreeProps["onSelect"] = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      onSelect?.(findNode(data, selectedKeys[0]));
    } else {
      onSelect?.(null);
    }
  };

  return (
    <div className="memory-tree" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px", borderBottom: "1px solid #e8ecf1", flexShrink: 0 }}>
        <Input
          placeholder="搜索真实记忆..."
          prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
          value={searchValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSearchValue(nextValue);
            window.setTimeout(() => setSearchText(nextValue), 250);
          }}
          style={{ marginBottom: 12 }}
          allowClear
        />
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FilterOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
            <Select
              placeholder="来源类型"
              value={sourceFilter}
              onChange={setSourceFilter}
              allowClear
              style={{ flex: 1 }}
              size="small"
              options={[
                { label: "对话记忆", value: "interaction" },
                { label: "会议记忆", value: "meeting" },
                { label: "技能记忆", value: "skill-pattern" },
                { label: "知识记忆", value: "knowledge" },
                { label: "手动记忆", value: "manual" },
                { label: "分层摘要", value: "summary" },
                { label: "状态监测", value: "burnout" },
                { label: "日常记录", value: "daily" },
              ]}
            />
          </div>
          <RangePicker
            size="small"
            placeholder={["开始日期", "结束日期"]}
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: "100%" }}
          />
        </Space>
      </div>

      <div style={{ padding: "8px 12px", overflow: "auto", flex: 1, minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : treeData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={sourceFilter || searchText ? "没有匹配的记忆来源或关键词" : "暂无真实记忆数据"}
            style={{ padding: 20 }}
          />
        ) : (
          <Tree
            treeData={treeData}
            selectedKeys={selectedId ? [selectedId] : []}
            expandedKeys={expandedKeys}
            onSelect={handleSelect}
            onExpand={(keys) => setExpandedKeys(keys as React.Key[])}
            showIcon={false}
            blockNode
            defaultExpandAll={false}
            titleRender={(nodeData) => nodeData.title as React.ReactNode}
          />
        )}
      </div>
    </div>
  );
};

export default MemoryTree;
