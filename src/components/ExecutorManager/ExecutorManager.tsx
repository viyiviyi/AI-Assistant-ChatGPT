import React, { useState, useEffect, useContext } from 'react';
import { Executor } from '@/Models/Executor';
import { executorService, useExecutor } from '@/core/executor/ExecutorService';
import { Button, Card, Checkbox, Collapse, Flex, Form, Input, List, Space, Spin, Typography, message, Popconfirm } from 'antd';
import { DeleteOutlined, DownOutlined, ExpandOutlined, PlusOutlined, RedoOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { ModalCallback } from '../common/Modal';
import { ChatContext } from '@/core/ChatManagement';
import { getUuid } from '@/core/utils/utils';
import { useScreenSize } from '@/core/hooks/hooks';

const { Text, Title } = Typography;

interface ExecutorManagerProps {
  cbs: ModalCallback;
}

export const ExecutorManager: React.FC<ExecutorManagerProps> = ({ cbs }) => {
  const [originalExecutors, setOriginalExecutors] = useState<Executor[]>([]);
  const [tempExecutors, setTempExecutors] = useState<Executor[]>([]);
  const [selectedExecutorId, setSelectedExecutorId] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({});
  const [editExecutorId, setEditExecutorId] = useState<string>();
  const [expandedExecutorId, setExpandedExecutorId] = useState<string | null>(null);
  const { chatMgt } = useContext(ChatContext);
  const [form] = Form.useForm();
  const screenSize = useScreenSize();
  const { setExecutor } = useExecutor();

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
    setSelectedExecutorId(chatMgt?.config.executorConfig?.selectedExecutorId || null);
    setSelectedTools(chatMgt.config.executorConfig?.selectedTools || {});
  }, [chatMgt.config.executorConfig?.selectedExecutorId, chatMgt.config.executorConfig?.selectedTools]);

  // 添加执行器（临时）
  const handleAddExecutor = (values: { url: string; description: string; key: string }) => {
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
    const newExecutor: Executor = Object.assign(
      tempExecutors.find((f) => editExecutorId && f.id == editExecutorId) || {
        id: '',
        tools: [], // 初始化为空数组，在保存时再获取
        createdAt: now,
        updatedAt: now,
        enabled: true,
      },
      {
        url: values.url,
        description: values.description,
        key: values.key,
      },
    );

    executorService.fetchToolsFromExecutor(newExecutor).then((res) => {
      if (res.length) {
        newExecutor.tools = res;
        setTempExecutors((v) => [...v]);
      }
    });
    if (!editExecutorId) {
      setTempExecutors((prev) => [...prev, newExecutor]);
    } else {
      setTempExecutors((prev) => {
        prev.forEach((v) => {
          if (v.id == editExecutorId) {
            Object.assign(v, newExecutor, { updatedAt: Date.now() });
          }
        });
        return [...prev];
      });
    }
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
    if (executorId == editExecutorId) setEditExecutorId(undefined);
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
    executorService.fetchToolsFromExecutor(executor).then((res) => {
      if (res.length) {
        setTempExecutors((prev) => {
          prev.forEach((v) => {
            if (v.id == executor.id) {
              Object.assign(v, { tools: res }, { updatedAt: Date.now() });
            }
          });
          return [...prev];
        });
      }
    });
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
          await executorService.addExecutor(executor);
        }
      }

      chatMgt.config.executorConfig = {
        selectedExecutorId: selectedExecutorId,
        enable: true,
        selectedTools: { ...(chatMgt.config.executorConfig?.selectedTools || {}), ...selectedTools },
      };
      setExecutor(tempExecutors.find((f) => f.id == selectedExecutorId));
      await chatMgt.saveConfig();
    } catch (err) {
      console.error('Failed to save executors:', err);
      throw err;
    }
  };

  // 暴露保存方法给父组件
  cbs.current.okCallback = () => {
    handleSave();
  };

  return (
    <div style={{ width: '100%', maxHeight: screenSize.height - 200, overflow: 'auto' }}>
      {/* 执行器列表 */}
      <div title="执行器列表" style={{ marginBottom: 16 }}>
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
                      <div
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setEditExecutorId(executor.id);
                          form.setFieldValue('url', executor.url);
                          form.setFieldValue('description', executor.description);
                          form.setFieldValue('key', executor.key);
                        }}
                      >
                        <Text strong>{executor.url}</Text>
                        {executor.description && <Text style={{ marginLeft: 8, color: '#666' }}>{executor.description}</Text>}
                      </div>
                    </Flex>
                    <Space size="small">
                      <RedoOutlined title="刷新工具函数列表" onClick={() => handleRefreshTools(executor.id)} />
                      <Popconfirm
                        overlayInnerStyle={{ whiteSpace: 'nowrap' }}
                        title="确定删除？"
                        placement="topRight"
                        onConfirm={() => {
                          handleDeleteExecutor(executor.id);
                        }}
                      >
                        <DeleteOutlined />
                      </Popconfirm>
                      {isExpanded ? (
                        <DownOutlined title="收起" onClick={() => handleToggleExpand(executor.id)} />
                      ) : (
                        <RightOutlined title="展开" onClick={() => handleToggleExpand(executor.id)} />
                      )}
                    </Space>
                  </Flex>

                  {/* 工具列表 */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12 }}>
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
                                    <Text strong>
                                      {tool.function.name}
                                      {tool.function.description && (
                                        <Text style={{ marginLeft: 20, color: '#666' }}>{tool.function.description}</Text>
                                      )}
                                    </Text>
                                    <div style={{ marginTop: 8, padding: 0, borderRadius: 4 }}>
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
      </div>
      <Form form={form} onFinish={handleAddExecutor} layout={'vertical'}>
        <Flex>
          <Form.Item name={'url'} style={{ flex: 1 }} label={'地址'}>
            <Input type="text" name="url" autoComplete="off" />
          </Form.Item>
          <Form.Item name={'description'} style={{ flex: 1 }} label={'名称'}>
            <Input type="text" name="description" autoComplete="off" />
          </Form.Item>
        </Flex>
        <Flex>
          <Form.Item name={'key'} style={{ flex: 1 }} label={'key'}>
            <Input type="text" name="key" autoComplete="off" />
          </Form.Item>
          <Form.Item label=" " style={{ marginLeft: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" htmlType="submit">
              {editExecutorId ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Flex>
      </Form>
    </div>
  );
};
