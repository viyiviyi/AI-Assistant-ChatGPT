import { aiServiceType } from '@/core/AiService/ServiceProvider';
import { CtxRole } from './CtxRole';
import { VirtualRoleSetting } from './VirtualRoleSetting';

// 用户表
export interface User {
  id: string; // 用户ID
  groupId: string; // 分组ID
  name: string; // 用户名
  enName?: string;
  avatar?: string; // 用户头像
  updateTime?: number;
  bio?: string;
}

// 分组表
export interface Group {
  id: string; // 分组ID
  name: string; // 分组名
  creatorId?: string; // 创建者ID
  index: number; // 排序
  avatar?: string; // 分组头像
  background?: string;
  createTime?: number;
  updateTime?: number;
}

// 分组表
export interface GroupConfig {
  id: string; // 分组ID
  groupId: string;
  enableVirtualRole: boolean;
  baseUrl: string;
  userServerUrl?: string;
  activityTopicId: string; // 激活的话题
  defaultVirtualRole?: string; // 默认助理
  disableStrikethrough?: boolean; // 禁用删除线
  botType: aiServiceType;
  cloudChannelId?: string;
  limitPreHeight?: boolean; // 限制代码块高度 50vh
  renderType?: 'default' | 'document';
  pageSize?: number;
  pageRepect?: number;
  updateTime?: number;
  enableSync?: boolean;
  extensions?: string[];
  middleware?: string[];
  useVirtualRoleImgToBack?: boolean;
  autoWrapCode?: boolean;
  buttomTool?: { sendBtn: boolean };
  toolBarToBottom?: boolean;
  voiceOpen?: boolean;
  voiceName?: string;
  voiceConfigs?: {
    reg: string;
    regOut?: string;
    default: boolean;
    url: string;
    method?: string;
    header?: Record<string, string>;
    disabled?: boolean;
  }[];
  modelArgs?: { enable: boolean; modelName: string; serverUrl: string; value: string }[];
  hiddenMask?: boolean;
}

// 聊天消息表
export interface Message {
  id: string; // 消息ID
  cate?: 'sd-txt2img' | 'sd-img2img' | undefined;
  groupId: string; // 分组ID
  topicId: string; // 话题ID
  ctxRole: CtxRole;
  reasoning_content?: string;
  text: string; // 消息内容
  createTime?: number;
  timestamp: number; // 时间戳
  updateTime?: number;
  deleteTime?: number;
  checked?: boolean;
  importMessage?: string;
  cloudTopicId?: string;
  cloudMsgId?: string;
  model?: string;
  searchQueries?: string[];
  searchResults?: {
    title: string;
    url: string;
    timestamp: string;
    snippet: string;
  }[];
  skipCtx?: boolean;
  imageIds?: string[];
  imagesAlts?: { [key: string]: string };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: { cached_tokens: number };
    prompt_cache_hit_tokens: number;
    prompt_cache_miss_tokens: number;
  };
}

export interface Topic {
  id: string; // 话题 ID
  groupId: string; // 分组ID
  name: string; // 话题名称
  createdAt: number; // 创建时间
  cloudTopicId?: string;
  updateTime?: number;
  deleteTime?: number;
  overrideVirtualRole?: { key: string; ctx: { key: string }[] }[];
  virtualRole?: VirtualRoleSetting[];
  overrideSettings?: {
    renderType?: 'default' | 'document';
    msgCount?: number; // >=0
    useConfig?: boolean;
  };
}

// 虚拟角色表
export interface VirtualRole {
  id: string; // 角色ID
  groupId: string; // 分组ID
  name: string; // 角色名
  enName?: string;
  avatar?: string; // 角色头像
  bio: string; // 角色简介
  settings: VirtualRoleSetting[]; // 角色设定（字符串数组）
  index?: number;
  updateTime?: number;
  tags?: string[];
}

export interface GptConfig {
  id: string;
  groupId: string;
  role: CtxRole;
  model: string | { [key: string]: string };
  max_tokens?: number; // max 4096
  top_p?: number; // 0-1
  temperature?: number; // 0-1
  n: number;
  msgCount: number; // >=0
  msgCountMin?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  updateTime?: number;
  aiServerConfig?: any;
}
