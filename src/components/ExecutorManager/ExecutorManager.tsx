import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { Executor } from '@/Models/Executor';
import { executorService, Tool, useExecutor } from '@/core/executor/ExecutorService';
import { Button, Card, Checkbox, Collapse, Flex, Form, Input, List, Space, Spin, Typography, message, Popconfirm } from 'antd';
import {
  CaretRightOutlined,
  DeleteOutlined,
  DownOutlined,
  ExpandOutlined,
  PlusOutlined,
  RedoOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { ModalCallback } from '../common/Modal';
import { ChatContext } from '@/core/ChatManagement';
import { useScreenSize } from '@/core/hooks/hooks';
import { useService } from '@/core/AiService/ServiceProvider';
import { KeyValueData } from '@/core/db/KeyValueData';
import { MarkdownView } from '../common/MarkdownView';
import { SkipExport } from '../common/SkipExport';

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
  const [activityKey, setActivityKey] = useState(['default']);
  const { chatMgt, setChat } = useContext(ChatContext);
  const [form] = Form.useForm();
  const screenSize = useScreenSize();
  const [messageApi, contextHolder] = message.useMessage();
  const { setExecutor } = useExecutor();
  const { reloadService } = useService();

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
      messageApi.error('无效的URL格式，必须以http://或https://开头');
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
      if (res.length && Array.isArray(res)) {
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
    setEditExecutorId(undefined);
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
      messageApi.error('执行器不存在');
      return;
    }
    executorService.fetchToolsFromExecutor(executor).then((res) => {
      if (res.length && Array.isArray(res)) {
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
      reloadService(chatMgt.getChat(), KeyValueData.instance());
      setChat(chatMgt.getChat());
    } catch (err) {
      console.error('Failed to save executors:', err);
      throw err;
    }
  };
  // 暴露保存方法给父组件
  cbs.current.okCallback = () => {
    handleSave();
  };
  const toolsToGroup = (tools: Tool[], executorToolIds: string[]): { groupName: string; checked: boolean; tools: Tool[] }[] => {
    const data: { groupName: string; checked: boolean; tools: Tool[] }[] = [];
    tools.forEach((tool) => {
      let group = data.find((f) => f.groupName == (tool.groupName || 'default'));
      if (!group) {
        group = { groupName: tool.groupName || 'default', tools: [], checked: true };
        data.push(group);
      }
      group.tools.push(tool);
      group.checked = group.checked && executorToolIds.includes(tool.function.name);
    });
    return data;
  };
  const executorToolsGroup = (executor: Executor) => {
    const executorToolIds = selectedTools[executor.id] || [];
    const toolsGroup = toolsToGroup(executor.tools, executorToolIds);
    return (
      <Collapse
        // ghost
        bordered={false}
        activeKey={activityKey}
        onChange={(e) => setActivityKey(Array.isArray(e) ? [...e] : [e])}
        defaultActiveKey={'default'}
        items={toolsGroup.map((v) => {
          return {
            key: v.groupName,
            forceRender: true,
            label: (
              <div>
                <Typography.Title level={5} style={{ marginLeft: 10, display: 'inline-block' }}>
                  {v.groupName}
                </Typography.Title>
              </div>
            ),
            children: (
              <div style={{ position: 'relative' }}>
                <label style={{ position: 'absolute', top: -50, right: 10, padding: 10 }}>
                  <Checkbox
                    checked={v.checked}
                    onChange={(e) => {
                      executorToolIds;
                      setSelectedTools((prev) => {
                        const executorTools = prev[executor.id] || [];
                        const newTools = executor.tools
                          .filter((f) => (f.groupName != v.groupName ? executorTools.includes(f.function.name) : e.target.checked))
                          .map((v) => v.function.name);
                        const updated = {
                          ...prev,
                          [executor.id]: newTools,
                        };
                        return updated;
                      });
                    }}
                  ></Checkbox>
                </label>

                <List
                  itemLayout="vertical"
                  dataSource={v.tools}
                  renderItem={(tool) => {
                    const isToolSelected = executorToolIds.includes(tool.function.name);
                    return (
                      <Card key={tool.function.name} size="small" style={{ marginBottom: 8 }}>
                        <Flex gap={12} align="start">
                          <label style={{ padding: '0 5px' }}>
                            <Checkbox
                              checked={isToolSelected}
                              onChange={(e) => {
                                handleToolToggle(executor.id, tool.function.name);
                              }}
                            />
                          </label>
                          <div style={{ flex: 1 }}>
                            <Text strong>
                              {tool.function.name}
                              {tool.function.description && (
                                <Text style={{ marginLeft: 20, color: '#666' }}>{tool.function.description}</Text>
                              )}
                            </Text>
                            {/* <div style={{ marginTop: 8, padding: 0, borderRadius: 4 }}>
                                      <MarkdownView markdown={'```\n'+JSON.stringify(tool, null, 2)+'\n```'} />
                                    </div> */}
                          </div>
                        </Flex>
                      </Card>
                    );
                  }}
                />
              </div>
            ),
          };
        })}
      />
    );
  };
  return (
    <div style={{ width: '100%', maxHeight: screenSize.height - 200, overflow: 'auto' }}>
      {contextHolder}
      {/* 执行器列表 */}
      <div title="执行器列表" style={{ marginBottom: 16 }}>
        {tempExecutors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text>暂无执行器，请刷新重试</Text>
          </div>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={tempExecutors}
            renderItem={(executor) => {
              const isSelected = selectedExecutorId === executor.id;
              const isExpanded = expandedExecutorId === executor.id;
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
                      {executor.tools.length === 0 ? <Text>暂无函数</Text> : executorToolsGroup(executor)}
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
        <Flex gap={10}>
          <Form.Item name={'key'} style={{ flex: 1 }} label={'key'}>
            <Input type="text" name="key" autoComplete="off" />
          </Form.Item>
          <Form.Item label=" ">
            <Button type="primary" htmlType="submit">
              {editExecutorId ? '更新' : '添加'}
            </Button>
          </Form.Item>
        </Flex>
      </Form>
    </div>
  );
};
