import { IChat } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "./../IMiddleware";
export class CreataMessageForUser implements IMiddleware {
  static readonly key = "middleware.CreataMessageForUser";
  key: string = CreataMessageForUser.key;
  name: string = "为用户生成内容";
  tags: string[] = [];
  description: string = "为用户生成内容，会导致【续写上一条内容】的功能无效";

  setting?: VirtualRoleSetting[] | undefined;
  prompt = `[Write your next reply from the point of view of {{user}}, using the chat history so far as a guideline for the writing style of {{user}}. Write 1 reply only in internet RP style. Don't write as {{char}} or system. Don't describe actions of {{char}}.]`;
  onSendBefore = (
    chat: IChat,
    context: {
      allCtx: Array<ChatCompletionRequestMessage>;
      history: Array<ChatCompletionRequestMessage>;
    }
  ): ChatCompletionRequestMessage[] | undefined => {
    if (
      context.history.length &&
      context.history.slice(-1)[0].role == "assistant"
    ) {
      context.allCtx.push({
        content: this.prompt,
        role: "system",
        name: "system",
      });
    }
    return context.allCtx;
  };
  onReaderFirst = (chat: IChat, send: Message, result: Message): Message => {
    if (result.ctxRole == "assistant" && send && send.ctxRole == "assistant") {
      result.ctxRole = "user";
    }
    return result;
  };
}
