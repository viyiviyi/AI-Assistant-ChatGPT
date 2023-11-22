import { IChat } from "@/core/ChatManagement";
import { IMiddleware } from "../IMiddleware";

export class ReplaceHalfWidthSymbols implements IMiddleware {
  readonly key = "272bae03-8f6d-4a4f-a0ac-97e85fe0af8b";
  readonly name: string = "替换半角符号";
  readonly tags = [];
  readonly description: string =
    `将结果中的这些半角符号[ . ~ ! , ... ]替换为全角符号`;
  readonly onReader = (chat: IChat, result: string) => {
    return result.replaceAll("~", "～").replaceAll(".", "。").replaceAll(",", "，").replaceAll("...", "…").replaceAll("!", "！");
  };
}