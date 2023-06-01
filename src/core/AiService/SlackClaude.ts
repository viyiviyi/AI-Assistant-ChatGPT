import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { IAiService } from "./IAiService";
export class SlackClaude implements IAiService {
  sendMessage(input: {
    msg: Message;
    context: ChatCompletionRequestMessage[];
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      stop?: (() => void) | undefined;
    }) => void;
    config?:
      | {
          model: string;
          max_tokens: number;
          top_p: number;
          user: "user" | "assistant" | "system";
          apiKey: string;
          n: number;
          temperature: number;
        }
      | undefined;
  }): void {
    throw new Error("Method not implemented.");
  }
  isContext: boolean = true;
  history = (input: {
    lastMsgCloudId?: string | undefined;
    topicCloudId: string;
    onMessage: (msg: {
      error: boolean;
      result: Message;
      end: boolean;
      stop?: (() => void) | undefined;
    }) => void;
  }) => {};
}
