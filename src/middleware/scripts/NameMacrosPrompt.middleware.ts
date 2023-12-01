import { IChat } from "@/core/ChatManagement";
import { format } from "date-fns";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";

export class NameMacrosPrompt implements IMiddleware {
  static readonly key = "d003e366-4609-4535-b2d8-4c742ae829b1";
  readonly key = NameMacrosPrompt.key;
  readonly name: string = "参数替换";
  readonly tags = [];
  readonly description: string = `{{char}}->助理名；
{{user}}->用户名；
{{user_info}}->用户设定；
{{current_time}}->当前时间`;
  readonly onSendBefore = (
    chat: IChat,
    context: {
      allCtx: Array<ChatCompletionRequestMessage>;
      history: Array<ChatCompletionRequestMessage>;
    }
  ): ChatCompletionRequestMessage[] => {
    context.allCtx.forEach((v) => {
      v.content = NameMacrosPrompt.format(chat, v.content);
    });
    return context.allCtx;
  };
  static format(chat: IChat, input: string | undefined): string | undefined {
    return input
      ?.replaceAll("{{user_info}}", chat.user.bio || "")
      .replaceAll("{{current_time}}", format(new Date(), "yyyy-MM-dd HH:mm:ss"))
      .replaceAll("{{char}}", chat.virtualRole.name)
      .replaceAll("{{user}}", chat.user.name)
      .replaceAll("<BOT>", chat.virtualRole.name)
      .replaceAll("<USER>", chat.user.name);
  }
}
