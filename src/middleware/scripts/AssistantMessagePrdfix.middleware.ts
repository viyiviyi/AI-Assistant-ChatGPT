import { IChat } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";
import { NameMacrosPrompt } from "./NameMacrosPrompt.middleware";

export class AssistantMessagePrdfix implements IMiddleware {
  readonly key = "middleware.AssistantMessagePrdfix";
  readonly name: string = "助理消息前缀";
  readonly tags = [];
  readonly description: string =
    "助理名增加在AI的消息前面，同时删除响应数据里的助理名前缀。";
  setting: VirtualRoleSetting[] | undefined;
  prompt = "{{char}}：{{message}}";
  readonly onSendBefore = (
    chat: IChat,
    context: {
      allCtx: Array<ChatCompletionRequestMessage>;
      history: Array<ChatCompletionRequestMessage>;
    }
  ): ChatCompletionRequestMessage[] => {
    let reg = new RegExp(`(^)(${chat.virtualRole.name})(:|：)\s*`, "g");
    context.allCtx.forEach((v) => {
      if (v.role == "assistant" && !reg.test(v.content || "")) {
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
