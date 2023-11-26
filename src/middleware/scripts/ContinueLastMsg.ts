import { IChat } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "./../IMiddleware";
import { CreataMessageForUser } from "./CreataMessageForUser";
export class ContinueLastMsg implements IMiddleware {
  static readonly key = "middleware.ContinueLastMsg";
  key: string = ContinueLastMsg.key;
  name: string = "续写上一条内容";
  tags: string[] = [];
  description: string = "续写上一条内容，与【为用户生成内容】功能冲突";

  setting?: VirtualRoleSetting[] | undefined;
  prompt = `[Continue the following message. Do not include ANY parts of the original message. Use capitalization and punctuation as if your reply is a part of the original message: {{lastChatMessage}}]`;
  onSendBefore = (
    chat: IChat,
    context: {
      allCtx: Array<ChatCompletionRequestMessage>;
      history: Array<ChatCompletionRequestMessage>;
    }
  ): ChatCompletionRequestMessage[] | undefined => {
    if (chat.config.middleware?.includes(CreataMessageForUser.key))
      return context.allCtx;
    if (
      context.history.length &&
      context.history.slice(-1)[0].role == "assistant" &&
      context.history.slice(-1)[0].content
    ) {
      let last = context.history.slice(-1)[0];
      let idx = context.allCtx.lastIndexOf(last);
      if (idx != -1) {
        context.allCtx.splice(idx, 1);
      }
      last.role = "system";
      last.name = "system";
      last.content = this.prompt.replaceAll(
        "{{lastChatMessage}}",
        last.content!
      );
      context.allCtx.push(last)
    }
    return context.allCtx;
  };
}
