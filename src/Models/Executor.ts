import { Tool } from "@/core/executor/ExecutorService";

// 执行器数据模型
export interface Executor {
  id: string; // 执行器ID（主键）
  url: string; // 执行器访问地址
  description: string; // 执行器备注说明
  tools: Tool[]; // 执行器提供的工具列表
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
  enabled: boolean; // 是否启用
}

// 执行器配置（用于组件状态管理）
export interface ExecutorConfig {
  selectedExecutorId: string | null; // 当前选中的执行器ID
  enable: boolean;
  selectedTools: string[]; // 每个执行器选中的工具名称列表
}

export type ToolCalls = {
  function: { name: string; arguments: string };
  id: string;
  index: 0;
  type: 'function';
};
