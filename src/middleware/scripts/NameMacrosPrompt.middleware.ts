import { IChat } from "@/core/ChatManagement";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";

export class NameMacrosPrompt implements IMiddleware {
  static readonly key ="d003e366-4609-4535-b2d8-4c742ae829b1"
  readonly key = NameMacrosPrompt.key;
  readonly name: string = "角色名替换";
  readonly tags = [];
  readonly description: string =
    "替换上下文中的{{char}}和{{user}}为助理名称和用户名称, {{user_info}}被替换为用户设定";
  readonly onSendBefore: (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => ChatCompletionRequestMessage[] | undefined = (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => {
    context.forEach((v) => {
      v.content = v.content
        ?.replaceAll("{{user_info}}", chat.user.bio || "")
        .replaceAll("{{char}}", chat.virtualRole.name)
        .replaceAll("{{user}}", chat.user.name);
    });
    return context;
  };
}
