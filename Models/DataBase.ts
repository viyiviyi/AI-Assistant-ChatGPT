// 用户表
export interface User {
  id: string; // 用户ID
  groupId: string; // 分组ID
  name: string; // 用户名
  avatar?: string; // 用户头像
  bio?: string; // 用户简介
}

// 分组表
export interface Group {
  id: string; // 分组ID
  name: string; // 分组名
  creatorId?: string; // 创建者ID
}

// 分组表
export interface GroupConfig {
  id: string; // 分组ID
  groupId: string;
  enableVirtualRole: boolean;
  saveKey: boolean;
  baseUrl: string;
  activityTopicId: string;
  filterUserName?:boolean
}

// 聊天消息表
export interface Message {
  id: string; // 消息ID
  groupId: string; // 分组ID
  senderId?: string; // 发送者ID
  topicId: string; // 话题ID
  virtualRoleId?: string; // 虚拟角色id
  text: string; // 消息内容
  timestamp: number; // 时间戳
}

export interface Topic {
  id: string; // 话题 ID
  groupId: string; // 分组ID
  name: string; // 话题名称
  createdAt: number; // 创建时间
}

// 虚拟角色表
export interface VirtualRole {
  id: string; // 角色ID
  groupId: string; // 分组ID
  name: string; // 角色名
  avatar?: string; // 角色头像
  bio: string; // 角色简介
  settings: string[]; // 角色设定（字符串数组）
}

export interface GptConfig {
  id: string;
  groupId: string;
  role: "assistant" | "system" | "user";
  model: string;
  max_tokens?: number; // max 4096
  top_p?: number; // 0-1
  temperature?: number; // 0-1
  n: number;
  msgCount: number; // >=0
}
