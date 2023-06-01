import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { IAiService, InputConfig } from "./IAiService";
export class ChatGPT3 implements IAiService {
  sendMessage(input: {
    msg: Message;
    context: ChatCompletionRequestMessage[];
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      stop?: (() => void) | undefined;
    }) => void;
    config?: InputConfig | undefined;
  }): void {
    throw new Error("Method not implemented.");
  }
  isContext = true;
  history = undefined;
}
