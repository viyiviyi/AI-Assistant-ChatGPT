import { aiServiceType } from '@/core/AiService/ServiceProvider';
import { CtxRole } from '@/Models/CtxRole';
import { ChatCompletionRequestMessage, CreateChatCompletionRequest } from 'openai';
import { GroupConfig, Message } from '../../Models/DataBase';
import { ServiceTokens } from './ServiceProvider';
export interface IAiService {
  baseUrl: string;
  tokens: ServiceTokens;
  serverType: aiServiceType;
  severConfig: any;
  /**
   * 是否支持自定义上下文 如果不支持，表示上下文存在服务器
   */
  customContext: boolean;
  models: () => Promise<Array<string>>;
  defaultModel?: string;
  setConfig?: (config: any) => any;
  getCurrentConnectors?: () => { name: string; id: string }[];
  getConnectorsConfig?: () => { name: string; id: string; options?: any }[];
  getConnectors?: () => Promise<{ name: string; id: string }[]>;
  sendMessage(input: {
    msg: Message;
    context: Array<ChatCompletionRequestMessage>;
    onMessage: (msg: {
      error: boolean;
      text: string;
      reasoning_content?: string;
      end: boolean;
      cloud_topic_id?: string;
      cloud_send_id?: string;
      cloud_result_id?: string;
      searchQueries?: string[];
      searchResults?: {
        title: string;
        url: string;
        timestamp: string;
        snippet: string;
      }[];
      stop: () => void;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details: { cached_tokens: number };
        prompt_cache_hit_tokens: number;
        prompt_cache_miss_tokens: number;
      };
    }) => Promise<void>;
    config: InputConfig;
  }): Promise<void>;
  history?: (input: {
    lastMsgCloudId?: string;
    topicCloudId: string;
    onMessage: (text: string, isAiMsg: boolean, msgCloudId: string, error: boolean) => Promise<void>;
    config: InputConfig;
  }) => Promise<void>;
}

type chatGPTConfig = {
  model: string;
  max_tokens?: number;
  top_p?: number;
  user?: CtxRole;
  n?: number;
  temperature?: number;
  modelArgs?: GroupConfig['modelArgs'];
} & CreateChatCompletionRequest;

type slackConfig = {
  channel_id?: string;
};

export type InputConfig = chatGPTConfig & slackConfig;
