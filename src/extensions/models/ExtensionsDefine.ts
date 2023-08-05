import { CtxRole } from "../../Models/DataBase";
import { ArgumentDefine } from "./Argument";
import { Interceptor } from "./Interceptor";

export interface ExtensionsDefine {
  id: string;
  name: string;
  tags: string[];
  permissions: string[];
  prompts: {
    title?: string;
    checked: boolean;
    ctx: { role: CtxRole; content: string }[];
  };
  args: ArgumentDefine[];
  onSendBefore: Interceptor[];
  onSend: Interceptor[];
  onSendAfter: Interceptor[];
  onRender: Interceptor[];
}
