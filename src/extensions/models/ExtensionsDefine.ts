import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ArgumentDefine } from "./Argument";
import { Interceptor } from "./Interceptor";

export interface ExtensionsDefine {
  id: string;
  name: string;
  tags: string[];
  permissions: string[];
  prompts: VirtualRoleSetting;
  args: ArgumentDefine[];
  onSendBefore: Interceptor[];
  onSend: Interceptor[];
  onSendAfter: Interceptor[];
  onRender: Interceptor[];
}
