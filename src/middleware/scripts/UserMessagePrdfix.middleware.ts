import { IChat } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";

export class UserMessagePrdfix implements IMiddleware {
  readonly key = "c2a40193-6fe5-4cb0-8664-71b3e121c72d";
  readonly name: string = "用户消息前缀";
  readonly tags = [];
  readonly description: string = '在所有的用户消息前增加前缀: "用户名："';
  setting: VirtualRoleSetting[] | undefined;
  readonly onSendBefore: (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => ChatCompletionRequestMessage[] | undefined = (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => {
    context.forEach((v) => {
      if (v.role == "user") {
        v.content = chat.user.name + "：" + v.content;
      }
    });
    return context;
  };
}
