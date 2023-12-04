import { IChat } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { IMiddleware } from "../IMiddleware";

export class RemoveNamePrdfix implements IMiddleware {
  readonly key = "middleware.RemoveNamePrdfix";
  readonly name: string = "删除消息里的名字前缀";
  readonly tags = [];
  readonly description: string = "删除响应数据里的角色名字前缀。";
  setting: VirtualRoleSetting[] | undefined;

  readonly onReader: (chat: IChat, result: string) => string = (
    chat: IChat,
    result: string
  ) => {
    let reg = new RegExp(`(^)(${chat.virtualRole.name})(:|：)\s*`, "g");
    return result.replace(reg, "$1");
  };
}
