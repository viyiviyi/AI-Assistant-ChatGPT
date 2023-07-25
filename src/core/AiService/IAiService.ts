import { aiServiceType } from "@/core/AiService/ServiceProvider";
import { ChatCompletionRequestMessage } from "openai";
import { Message } from "../../Models/DataBase";
import { ServiceTokens } from "./ServiceProvider";
export interface IAiService {
  baseUrl: string;
  tokens: ServiceTokens;
  serverType: aiServiceType;
  // 是否支持自定义上下文 如果不支持，表示上下文存在服务器
  customContext: boolean;
  models: () => Promise<Array<string>>;
  sendMessage(input: {
    msg: Message;
    context: Array<ChatCompletionRequestMessage>;
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      cloud_topic_id?: string;
      cloud_send_id?: string;
      cloud_result_id?: string;
      stop?: () => void;
    }) => void;
    config: InputConfig;
  }): Promise<void>;
  history?: (input: {
    lastMsgCloudId?: string;
    topicCloudId: string;
    onMessage: (
      text: string,
      isAiMsg: boolean,
      msgCloudId: string,
      error: boolean
    ) => Promise<void>;
    config: InputConfig;
  }) => Promise<void>;
}

type chatGPTConfig = {
  model: string;
  max_tokens?: number;
  top_p?: number;
  user?: "assistant" | "system" | "user";
  n?: number;
  temperature?: number;
};

type slackConfig = {
  channel_id?: string;
};

export type InputConfig = chatGPTConfig & slackConfig;
