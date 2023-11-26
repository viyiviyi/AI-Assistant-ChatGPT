import { IChat } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";

export class UserMessagePrdfix implements IMiddleware {
  readonly key = "c2a40193-6fe5-4cb0-8664-71b3e121c72d";
  readonly name: string = "消息前缀";
  readonly tags = [];
  readonly description: string =
    "将用户名和助理名增加在消息前面，同时删除响应数据里的角色名前缀。（也许会导致内容出现错误）";
  setting: VirtualRoleSetting[] | undefined;
  readonly onSendBefore = (
    chat: IChat,
    context: {
      allCtx: Array<ChatCompletionRequestMessage>;
      history: Array<ChatCompletionRequestMessage>;
    }
  ): ChatCompletionRequestMessage[] => {
    context.allCtx.forEach((v) => {
      if (v.role == "user") {
        v.content = chat.user.name + "：" + v.content;
      } else if (v.role == "assistant") {
        v.content = chat.virtualRole.name + "：" + v.content;
      }
    });
    return context.allCtx;
  };
  readonly onReader: (chat: IChat, result: string) => string = (
    chat: IChat,
    result: string
  ) => {
    let reg = new RegExp(
      `(^|\n)(${chat.user.name}|${chat.virtualRole.name})(:|：)\s*`,
      "g"
    );
    return result.replace(reg, "$1");
  };
}
