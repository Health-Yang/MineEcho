import { Modal, Table, Button, Space, Typography, Tag, message } from "antd";
import type { Key } from "react";
import { useState, useEffect } from "react";
import { SyncOutlined, CheckCircleOutlined } from "@ant-design/icons";

interface SkillUpdateInfo {
  id: string;
  name: string;
  localVersion: string;
  remoteVersion: string;
  updateAvailable: boolean;
}

interface SkillUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onSync: (skillIds: string[]) => void;
}

export function SkillUpdateModal({ visible, onClose, onSync }: SkillUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<SkillUpdateInfo[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  useEffect(() => {
    if (visible) {
      loadUpdateDetails();
    }
  }, [visible]);

  const loadUpdateDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/skills-update/check?force=true");
      if (!response.ok) throw new Error("加载失败");

      const data = await response.json();
      const updatableSkills = data.skills?.filter((s: SkillUpdateInfo) => s.updateAvailable) || [];
      setSkills(updatableSkills);

      // 默认全选
      setSelectedRowKeys(updatableSkills.map((s: SkillUpdateInfo) => s.id));
    } catch (error) {
      message.error("加载更新详情失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请至少选择一个技能");
      return;
    }
    onSync(selectedRowKeys as string[]);
    onClose();
  };

  const columns = [
    {
      title: "技能名称",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "本地版本",
      dataIndex: "localVersion",
      key: "localVersion",
      render: (version: string) => (
        <Tag color="default">{version || "未安装"}</Tag>
      ),
    },
    {
      title: "远程版本",
      dataIndex: "remoteVersion",
      key: "remoteVersion",
      render: (version: string) => (
        <Tag color="blue">{version}</Tag>
      ),
    },
    {
      title: "状态",
      key: "status",
      render: (_: any, record: SkillUpdateInfo) => {
        if (record.localVersion === "0.0.0") {
          return <Tag color="green">新技能</Tag>;
        }
        return <Tag color="orange">可更新</Tag>;
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <SyncOutlined />
          <span>技能更新详情</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="sync"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleSync}
          disabled={selectedRowKeys.length === 0}
        >
          更新选中的 {selectedRowKeys.length} 个技能
        </Button>,
      ]}
    >
      <Table
        loading={loading}
        dataSource={skills}
        columns={columns}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={false}
        size="small"
        scroll={{ y: 400 }}
      />
    </Modal>
  );
}
