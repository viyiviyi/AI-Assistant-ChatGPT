import { Executor } from '@/Models/Executor';
import { getDbInstance as getInstance } from '../db/IndexDbInstance';
import { getUuid } from '../utils/utils';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../ChatManagement';

export type Tool = {
  type: 'function';
  function: {
    name: string; // 函数名（与本地函数一致）
    description: string;
    parameters: {
      type: string;
      properties: {
        [key: string]: {
          type: string;
          description: string;
        };
      };
      required: string[]; // 必传参：city
    };
  };
};

// 新开会话工具定义
const CREATE_NEW_SESSION_TOOL: Tool = {
  type: 'function',
  function: {
    name: 'create_new_session',
    description: '当需要时将任务分配给新的会话（新会使用全新的上下文）。',
    parameters: {
      type: 'object',
      properties: {
        task_guidance: {
          type: 'string',
          description: '以system的身份输入到新会话上下文的第一条引导任务执行的消息。',
        },
      },
      required: ['task_guidance'],
    },
  },
};
// 等待工具定义
const WAIT_TOOL: Tool = {
  type: 'function',
  function: {
    name: 'wait',
    description: '等待一段时间并返回自定义内容。用于模拟延迟操作或等待特定条件。',
    parameters: {
      type: 'object',
      properties: {
        duration: {
          type: 'integer',
          description: '等待时间（秒）。最小值为1秒，最大值为120秒。',
        },
        message: {
          type: 'string',
          description: '等待完成后返回的消息内容。',
        },
      },
      required: ['duration', 'message'],
    },
  },
};

// letthis.message.= { error: (err: string) => {} };

class ExecutorService {
  message = { error: (err: string) => { } };
  // 获取所有执行器
  async getAllExecutors(): Promise<Executor[]> {
    try {
      const executors = await getInstance().queryAll<Executor>({
        tableName: 'Executor',
      });
      return executors || [];
    } catch (error) {
      console.error('Failed to get executors:', error);
      this.message.error('获取执行器列表失败');
      return [];
    }
  }

  // 根据ID获取执行器
  async getExecutorById(id: string): Promise<Executor | null> {
    try {
      const executors = await getInstance().query<Executor>({
        tableName: 'Executor',
        condition: (v) => v.id == id,
      });
      return executors[0] || null;
    } catch (error) {
      console.error('Failed to get executor:', error);
      this.message.error('获取执行器失败');
      return null;
    }
  }

  // 添加执行器
  async addExecutor(executor: Executor): Promise<Executor> {
    try {
      // 验证URL格式
      if (!executor.url.startsWith('http://') && !executor.url.startsWith('https://')) {
        throw new Error('无效的URL格式，必须以http://或https://开头');
      }

      const now = Date.now();
      Object.assign(executor, {
        id: getUuid(),
        tools: executor.tools || [],
        createdAt: now,
        updatedAt: now,
        enabled: true,
      });

      await getInstance().insert<Executor>({
        tableName: 'Executor',
        data: executor,
      });

      return executor;
    } catch (error: any) {
      console.error('Failed to add executor:', error);
      this.message.error(`添加执行器失败: ${error.message || '未知错误'}`);
      return executor;
    }
  }

  // 更新执行器
  async updateExecutor(executor: Executor): Promise<Executor> {
    try {
      const updatedExecutor = {
        ...executor,
        updatedAt: Date.now(),
      };

      await getInstance().update_by_primaryKey<Executor>({
        tableName: 'Executor',
        value: executor.id,
        handle: (r) => {
          return Object.assign(r, updatedExecutor);
        },
      });

      return updatedExecutor;
    } catch (error) {
      console.error('Failed to update executor:', error);
      this.message.error('更新执行器失败');
      return executor;
    }
  }

  // 删除执行器
  async deleteExecutor(id: string): Promise<void> {
    try {
      await getInstance().delete_by_primaryKey({
        tableName: 'Executor',
        value: id,
      });
    } catch (error) {
      console.error('Failed to delete executor:', error);
      this.message.error('删除执行器失败');
      return;
    }
  }

  // 根据ID获取执行器（使用主键查询）
  async getExecutorByPrimaryKey(id: string): Promise<Executor | null> {
    try {
      const executor = await getInstance().query_by_primaryKey<Executor>({
        tableName: 'Executor',
        value: id,
      });
      return executor;
    } catch (error) {
      console.error('Failed to get executor by primary key:', error);
      this.message.error('获取执行器失败');
      return null;
    }
  }

  async fetchHealth(executor: Executor): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      const response = await fetch(`${executor.url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // 从执行器获取tools列表（包含固定的新开会话工具）
  async fetchToolsFromExecutor(executor: Executor): Promise<Tool[]> {
    try {
      // 调用执行器的API获取tools列表
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

      const response = await fetch(`${executor.url}/tools`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + executor.key,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`获取工具列表失败: ${response.status}`);
      }

      let data = await response.json();
      if (data && data.tools) data = data.tools;
      let tools: Tool[] = [];
      if (Array.isArray(data) && !data[0].type && data[0].name) {
        tools = data.map((v) => ({ type: 'function', function: v }));
      } else {
        tools = data || [];
      }

      // 添加固定的新开会话工具和等待工具到工具列表
      return [...tools, CREATE_NEW_SESSION_TOOL, WAIT_TOOL];
    } catch (error: any) {
      console.error('Failed to fetch tools from executor:', error);
      // 如果获取失败，返回空数组
      this.message.error('获取工具列表失败: ' + error.message);
      return [];
    }
  }

  // 刷新执行器的tools列表
  async refreshExecutorTools(executorId: string): Promise<Executor | null> {
    try {
      const executor = await this.getExecutorById(executorId);
      if (!executor) {
        this.message.error('执行器不存在');
        return null;
      }

      const tools = await this.fetchToolsFromExecutor(executor);
      executor.tools = tools;
      console.log(tools);
      executor.updatedAt = Date.now();

      const updatedExecutor = await this.updateExecutor(executor);
      return updatedExecutor;
    } catch (error) {
      console.error('Failed to refresh executor tools:', error);
      this.message.error('刷新工具列表失败');
      return null;
    }
  }

  // 执行函数
  // 执行函数
  async exec(executor: Executor, call_data: any): Promise<string> {
    try {
      // 检查是否是等待工具调用
      if (call_data?.name === 'wait'||call_data?.function?.name === 'wait') {
        return await this.handleWaitTool(call_data);
      }
      
      // 调用执行器的API获取tools列表
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600 * 1000); // 600秒超时
      const response = await fetch(`${executor.url}/execute`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + executor.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(call_data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return '调用出错 status code:' + response.status;
      }

      const data = await response.json();
      return JSON.stringify(data, null, 2) || '无返回内容';
    } catch (error: any) {
      console.error('Failed to fetch tools from executor:', error);
      // 如果获取失败，返回空数组
      return '调用出错 err:' + error['message'] || JSON.stringify(error);
    }
  }

  // 处理等待工具
  private async handleWaitTool(call_data: any): Promise<string> {
    try {
      const args = JSON.parse(call_data?.function?.arguments || '{}');
      const duration = args.duration;
      const message = args.message;

      // 验证参数
      if (typeof duration !== 'number' || duration < 1 || duration > 120) {
        return JSON.stringify({
          error: 'duration参数必须为1-120秒之间的数字'
        }, null, 2);
      }

      if (typeof message !== 'string') {
        return JSON.stringify({
          error: 'message参数必须为字符串'
        }, null, 2);
      }

      // 等待指定时间（将秒转换为毫秒）
      await new Promise(resolve => setTimeout(resolve, duration * 1000));

      // 返回结果
      return JSON.stringify({
        success: true,
        duration: duration,
        message: message,
        timestamp: Date.now()
      }, null, 2);
    } catch (error: any) {
      return JSON.stringify({
        error: '等待工具执行失败: ' + (error.message || '未知错误')
      }, null, 2);
    }
  }
}

export const executorService = new ExecutorService();

export const useExecutor = () => {
  const { chatMgt } = useContext(ChatContext);
  const curtExecutor = useRef<Executor | null>();
  useEffect(() => {
    if (chatMgt.config.executorConfig?.selectedExecutorId)
      executorService.getExecutorById(chatMgt.config.executorConfig?.selectedExecutorId).then((res) => {
        curtExecutor.current = res;
      });
  }, [chatMgt.config.executorConfig?.selectedExecutorId]);
  const execFunctionCall = useCallback(async (call_data: any) => {
    if (curtExecutor.current) {
      return await executorService.exec(curtExecutor.current, call_data);
    } else {
      return '执行器不存在';
    }
  }, []);
  return {
    curtExecutor,
    setExecutor: (executor: Executor | undefined) => {
      curtExecutor.current = executor;
    },
    execFunctionCall,
  };
};
