import { ChatCompletionRequestMessage } from "openai";
import { Message } from "../../Models/DataBase";
export interface IAiService {
  sendMessage(input: {
    msg: Message;
    context: Array<ChatCompletionRequestMessage>;
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      stop?: () => void;
    }) => void;
    config?: InputConfig;
  }): void;
  isContext: boolean;
  history?: (input: {
    lastMsgCloudId?: string;
    topicCloudId: string;
    onMessage: (msg: {
      error: boolean;
      result: Message;
      end: boolean;
      stop?: () => void;
    }) => void;
  }) => void;
}
type chatGPTConfig = {
  model: string;
  max_tokens: number;
  top_p: number;
  user: "assistant" | "system" | "user";
  apiKey: string;
  n: number;
  temperature: number;
};
export type InputConfig = chatGPTConfig;
