import React, { useState, useEffect } from 'react';
import { Executor } from '@/Models/Executor';
import { executorService } from '@/core/executor/ExecutorService';
import { Button, Card, Checkbox, Collapse, Flex, Form, Input, List, Space, Spin, Typography, message } from 'antd';
import { DeleteOutlined, ExpandOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModalCallback } from '../common/Modal';

const { Text, Title } = Typography;

interface ExecutorManagerProps {
  cbs: ModalCallback;
}

export const ExecutorManager: React.FC<ExecutorManagerProps> = ({ cbs }) => {
  const [originalExecutors, setOriginalExecutors] = useState<Executor[]>([]);
  const [tempExecutors, setTempExecutors] = useState<Executor[]>([]);
  const [selectedExecutorId, setSelectedExecutorId] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({});
  const [expandedExecutorId, setExpandedExecutorId] = useState<string | null>(null);
  const [loading, setLoading] = useState();
  const [form] = Form.useForm();

  // 加载执行器列表
  const loadExecutors = async () => {
    try {
      const data = await executorService.getAllExecutors();
      setOriginalExecutors(data);
      setTempExecutors([...data]);
    } catch (err) {
      console.error('Failed to load executors:', err);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadExecutors();
  }, []);

  // 添加执行器（临时）
  const handleAddExecutor = (values: { url: string; description: string }) => {
    if (!values.url.trim()) {
      return;
    }

    // 验证URL格式
    if (!values.url.startsWith('http://') && !values.url.startsWith('https://')) {
      message.error('无效的URL格式，必须以http://或https://开头');
      return;
    }

    // 直接添加到临时状态，不进行网络请求
    const now = Date.now();
    const newExecutor: Executor = {
      id: `executor_${now}`,
      url: values.url,
      description: values.description,
      tools: [], // 初始化为空数组，在保存时再获取
      createdAt: now,
      updatedAt: now,
      enabled: true,
    };

    setTempExecutors((prev) => [...prev, newExecutor]);
    form.resetFields();
  };

  // 删除执行器（临时）
  const handleDeleteExecutor = (executorId: string) => {
    setTempExecutors((prev) => prev.filter((e) => e.id !== executorId));

    if (selectedExecutorId === executorId) {
      setSelectedExecutorId(null);
    }
    if (expandedExecutorId === executorId) {
      setExpandedExecutorId(null);
    }
  };

  // 切换执行器选择
  const handleExecutorToggle = (executorId: string) => {
    const newSelectedId = selectedExecutorId === executorId ? null : executorId;
    setSelectedExecutorId(newSelectedId);

    if (newSelectedId) {
      const executor = tempExecutors.find((e) => e.id === newSelectedId);
      if (executor) {
        const tools = selectedTools[newSelectedId] || [];
        const selectedToolObjects = executor.tools.filter((tool) => tools.includes(tool.function.name));
      }
    }
  };

  // 切换工具选择
  const handleToolToggle = (executorId: string, toolName: string) => {
    setSelectedTools((prev) => {
      const executorTools = prev[executorId] || [];
      const newTools = executorTools.includes(toolName) ? executorTools.filter((name) => name !== toolName) : [...executorTools, toolName];

      const updated = {
        ...prev,
        [executorId]: newTools,
      };

      // 如果当前执行器被选中，更新回调
      if (selectedExecutorId === executorId) {
        const executor = tempExecutors.find((e) => e.id === executorId);
        if (executor) {
          const selectedToolObjects = executor.tools.filter((tool) => newTools.includes(tool.function.name));
        }
      }

      return updated;
    });
  };

  // 切换执行器展开状态
  const handleToggleExpand = (executorId: string) => {
    setExpandedExecutorId(expandedExecutorId === executorId ? null : executorId);
  };

  // 刷新执行器的tools列表（临时）
  const handleRefreshTools = (executorId: string) => {
    const executor = tempExecutors.find((e) => e.id === executorId);
    if (!executor) {
      message.error('执行器不存在');
      return;
    }

    // 直接更新为默认空数组，实际的工具列表会在保存时获取
    setTempExecutors((prev) => prev.map((e) => (e.id === executorId ? { ...e, tools: [], updatedAt: Date.now() } : e)));
  };

  // 保存所有更改 - 由弹窗回调调用
  const handleSave = async () => {
    try {
      // 删除已移除的执行器
      const originalIds = originalExecutors.map((e) => e.id);
      const tempIds = tempExecutors.map((e) => e.id);

      // 删除操作
      for (const id of originalIds) {
        if (!tempIds.includes(id)) {
          await executorService.deleteExecutor(id);
        }
      }

      // 添加和更新操作
      for (const executor of tempExecutors) {
        if (originalIds.includes(executor.id)) {
          // 更新
          await executorService.updateExecutor(executor);
        } else {
          // 添加
          await executorService.addExecutor(executor.url, executor.description);
        }
      }

      // 重新加载原始数据
      await loadExecutors();
      message.success('保存成功');
    } catch (err) {
      console.error('Failed to save executors:', err);
      message.error('保存失败');
      throw err;
    }
  };

  // 暴露保存方法给父组件
  cbs.current.okCallback = () => {
    handleSave();
  };

  return (
    <div style={{ width: '100%' }}>
      <Title level={4}>执行器管理</Title>

      {/* 添加执行器 */}
      <Card title="添加执行器" style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px' }}>
        <Form form={form} layout="vertical" onFinish={handleAddExecutor}>
          <Flex gap={16} style={{ marginBottom: 16 }}>
            <Form.Item
              name="url"
              label="执行器地址"
              rules={[
                {
                  required: true,
                  message: '请输入执行器地址',
                },
                {
                  pattern: /^https?:\/\/.+/,
                  message: '请输入有效的URL格式（以http://或https://开头）',
                },
              ]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入执行器访问地址" />
            </Form.Item>
            <Form.Item name="description" label="备注说明" style={{ flex: 1 }}>
              <Input placeholder="请输入执行器备注" />
            </Form.Item>
          </Flex>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
              添加执行器
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 执行器列表 */}
      <Card title="执行器列表" style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px' }}>
        <Spin spinning={loading}>
          {tempExecutors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Text>暂无执行器，请添加</Text>
            </div>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={tempExecutors}
              renderItem={(executor) => {
                const isSelected = selectedExecutorId === executor.id;
                const isExpanded = expandedExecutorId === executor.id;
                const executorToolIds = selectedTools[executor.id] || [];

                return (
                  <Card key={executor.id} style={{ marginBottom: 16 }} size="small">
                    <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                      <Flex gap={12} align="center">
                        <Checkbox checked={isSelected} onChange={() => handleExecutorToggle(executor.id)} />
                        <div>
                          <Text strong>{executor.url}</Text>
                          {executor.description && <Text style={{ marginLeft: 8, color: '#666' }}>{executor.description}</Text>}
                        </div>
                      </Flex>
                      <Space size="small">
                        <Button icon={<ReloadOutlined />} size="small" onClick={() => handleRefreshTools(executor.id)} loading={loading}>
                          刷新工具
                        </Button>
                        <Button icon={<ExpandOutlined />} size="small" onClick={() => handleToggleExpand(executor.id)}>
                          {isExpanded ? '收起' : '展开'}
                        </Button>
                        <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDeleteExecutor(executor.id)}>
                          删除
                        </Button>
                      </Space>
                    </Flex>

                    {/* 工具列表 */}
                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                        <Title level={5}>函数列表</Title>
                        {executor.tools.length === 0 ? (
                          <Text>暂无函数</Text>
                        ) : (
                          <List
                            itemLayout="vertical"
                            dataSource={executor.tools}
                            renderItem={(tool) => {
                              const isToolSelected = executorToolIds.includes(tool.function.name);
                              return (
                                <Card key={tool.function.name} size="small" style={{ marginBottom: 8 }}>
                                  <Flex gap={12} align="start">
                                    <Checkbox checked={isToolSelected} onChange={() => handleToolToggle(executor.id, tool.function.name)} />
                                    <div style={{ flex: 1 }}>
                                      <Text strong>{tool.function.name}</Text>
                                      {tool.function.description && (
                                        <Text style={{ display: 'block', margin: '4px 0', color: '#666' }}>{tool.function.description}</Text>
                                      )}
                                      <div
                                        style={{ marginTop: 8, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, overflow: 'auto' }}
                                      >
                                        <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(tool, null, 2)}</pre>
                                      </div>
                                    </div>
                                  </Flex>
                                </Card>
                              );
                            }}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                );
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};
