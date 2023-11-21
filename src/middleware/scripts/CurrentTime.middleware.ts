import { IChat } from "@/core/ChatManagement";
import { format } from "date-fns";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "../IMiddleware";

export class CurrentTime implements IMiddleware {
  readonly key = "3578cd80-9ef2-428e-ae3c-b68ba234fcf5";
  readonly name: string = "当前时间";
  readonly tags = [];
  readonly description: string = "将在当前上下文最前面增加一个当前时间的上下文";
  readonly onSendBefore: (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => ChatCompletionRequestMessage[] | undefined = (
    chat: IChat,
    context: ChatCompletionRequestMessage[]
  ) => {
    return [
      {
        role: "system",
        content:
          "System note: The current time is " +
          format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      },
      ...context,
    ];
  };
}
