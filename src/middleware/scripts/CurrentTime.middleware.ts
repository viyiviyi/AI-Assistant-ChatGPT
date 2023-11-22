import { IChat } from "@/core/ChatManagement";
import { format } from "date-fns";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";
import { getUuid } from "@/core/utils";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";

export class CurrentTime implements IMiddleware {
  readonly key = "3578cd80-9ef2-428e-ae3c-b68ba234fcf5";
  readonly name: string = "工具词条";
  readonly tags = [];
  readonly description: string = "将在当前上下文最前面增加一个当前时间的上下文";
  readonly setting: VirtualRoleSetting[] | undefined = [
    {
      key: getUuid(),
      checked: true,
      ctx: [
        {
          key: getUuid(),
          checked: true,
          role: "system",
          content:
            "System note: The current time is {{currentTime}}."
          ,
        },
      ],
      title: "当前时间",
      extensionId: this.key,
      tags: ["扩展功能"],
    },
  ]
  readonly onSendBefore: (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => ChatCompletionRequestMessage[] | undefined = (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => {
      context.forEach((v) => {
        v.content = v.content
          ?.replaceAll("{{currentTime}}", format(new Date(), 'yyyy-MM-dd HH:mm:ss'))
      });
      return context;
    };
}
