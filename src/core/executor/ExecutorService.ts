import { Executor } from '@/Models/Executor';
import { getDbInstance as getInstance } from '../db/IndexDbInstance';
import { message } from 'antd';

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

class ExecutorService {
  // 获取所有执行器
  async getAllExecutors(): Promise<Executor[]> {
    try {
      const executors = await getInstance().queryAll<Executor>({
        tableName: 'Executor',
      });
      return executors || [];
    } catch (error) {
      console.error('Failed to get executors:', error);
      message.error('获取执行器列表失败');
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
      message.error('获取执行器失败');
      return null;
    }
  }

  // 添加执行器
  async addExecutor(url: string, description: string): Promise<Executor> {
    try {
      // 验证URL格式
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('无效的URL格式，必须以http://或https://开头');
      }

      // 尝试从执行器获取tools列表
      const tools = await this.fetchToolsFromExecutor(url);

      const now = Date.now();
      const executor: Executor = {
        id: `executor_${now}`,
        url,
        description,
        tools,
        createdAt: now,
        updatedAt: now,
        enabled: true,
      };

      await getInstance().insert<Executor>({
        tableName: 'Executor',
        data: executor,
      });

      message.success('添加执行器成功');
      return executor;
    } catch (error: any) {
      console.error('Failed to add executor:', error);
      message.error(`添加执行器失败: ${error.message || '未知错误'}`);
      throw error;
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

      message.success('更新执行器成功');
      return updatedExecutor;
    } catch (error) {
      console.error('Failed to update executor:', error);
      message.error('更新执行器失败');
      throw error;
    }
  }

  // 删除执行器
  async deleteExecutor(id: string): Promise<void> {
    try {
      await getInstance().delete_by_primaryKey({
        tableName: 'Executor',
        value: id,
      });

      message.success('删除执行器成功');
    } catch (error) {
      console.error('Failed to delete executor:', error);
      message.error('删除执行器失败');
      throw error;
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
      message.error('获取执行器失败');
      return null;
    }
  }

  // 从执行器获取tools列表
  async fetchToolsFromExecutor(url: string): Promise<Tool[]> {
    try {
      // 尝试调用执行器的API获取tools列表
      // 这里假设执行器提供了一个获取tools的端点
      // 实际实现需要根据执行器的API设计进行调整
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

      const response = await fetch(`${url}/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`获取工具列表失败: ${response.status}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error: any) {
      console.error('Failed to fetch tools from executor:', error);
      // 如果获取失败，返回空数组
      return [];
    }
  }

  // 刷新执行器的tools列表
  async refreshExecutorTools(executorId: string): Promise<Executor | null> {
    try {
      const executor = await this.getExecutorById(executorId);
      if (!executor) {
        message.error('执行器不存在');
        return null;
      }

      const tools = await this.fetchToolsFromExecutor(executor.url);
      executor.tools = tools;
      executor.updatedAt = Date.now();

      const updatedExecutor = await this.updateExecutor(executor);
      return updatedExecutor;
    } catch (error) {
      console.error('Failed to refresh executor tools:', error);
      message.error('刷新工具列表失败');
      return null;
    }
  }
  async exec(data: any): Promise<string> {
    console.log(data);
    return '892374293847562398746';
  }
}

export const executorService = new ExecutorService();
