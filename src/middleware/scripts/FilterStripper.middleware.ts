import { IChat } from "@/core/ChatManagement";
import { IMiddleware } from "../IMiddleware";

export class FilterStripper implements IMiddleware {
  readonly key = "272bae03-8f6d-4a4f-a0ac-97e85fe0af8b";
  readonly name: string = "替换删除线";
  readonly tags = [];
  readonly description: string =
    "将英文的波浪号替换成中文的波浪号，强行去掉删除线。";
  readonly onRender = (chat: IChat, result: string) => {
    return result.replaceAll("~", "～");
  };
}