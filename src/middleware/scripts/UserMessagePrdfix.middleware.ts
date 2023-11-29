import { IChat } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";
import { NameMacrosPrompt } from "./NameMacrosPrompt.middleware";

export class UserMessagePrdfix implements IMiddleware {
  readonly key = "c2a40193-6fe5-4cb0-8664-71b3e121c72d";
  readonly name: string = "用户消息前缀";
  readonly tags = [];
  readonly description: string =
    "发送消息时将用户名增加在用户消息前面，同时删除响应数据里的助理名前缀。";
  setting: VirtualRoleSetting[] | undefined;
  prompt = "{{user}}：{{message}}";
  readonly onSendBefore = (
    chat: IChat,
    context: {
      allCtx: Array<ChatCompletionRequestMessage>;
      history: Array<ChatCompletionRequestMessage>;
    }
  ): ChatCompletionRequestMessage[] => {
    let reg = new RegExp(`(^)(${chat.user.name})(:|：)\s*`, "g");
    context.allCtx.forEach((v) => {
      if (v.role == "user" && !reg.test(v.content || "")) {
        v.content = NameMacrosPrompt.format(chat, this.prompt)?.replaceAll(
          "{{message}}",
          v.content || ""
        );
      }
    });
    return context.allCtx;
  };
  readonly onReader: (chat: IChat, result: string) => string = (
    chat: IChat,
    result: string
  ) => {
    let reg = new RegExp(`(^)(${chat.virtualRole.name})(:|：)\s*`, "g");
    return result.replace(reg, "$1");
  };
}
