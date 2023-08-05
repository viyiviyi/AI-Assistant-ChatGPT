import { CtxRole, VirtualRoleSetting } from "@/Models/DataBase";
import { ArgumentDefine } from "./models/Argument";
import { ExtensionsDefine } from "./models/ExtensionsDefine";
import { Interceptor } from "./models/Interceptor";

export class Extensions implements ExtensionsDefine {
  readonly id: string;
  private extension: ExtensionsDefine;
  readonly name: string;
  readonly tags: string[];
  readonly permissions: string[];
  readonly prompts: {
    title?: string | undefined;
    checked: boolean;
    ctx: { role: CtxRole; content: string }[];
  };
  readonly args: ArgumentDefine[];
  readonly onSendBefore: Interceptor[];
  readonly onSend: Interceptor[];
  readonly onSendAfter: Interceptor[];
  readonly onRender: Interceptor[];
  constructor(extension: ExtensionsDefine) {
    this.id = extension.id;
    this.extension = JSON.parse(JSON.stringify(extension));
    this.name = this.extension.name;
    this.tags = this.extension.tags;
    this.permissions = this.extension.permissions;
    this.prompts = this.extension.prompts;
    this.args = this.extension.args;
    this.onSendBefore = this.extension.onSendBefore;
    this.onSend = this.extension.onSend;
    this.onSendAfter = this.extension.onSendAfter;
    this.onRender = this.extension.onRender;
    Extensions.extensions.push(this);
  }

  getSettings(): VirtualRoleSetting {
    return {
      checked: true,
      ctx: this.prompts.ctx.map((v) => ({
        role: v.role,
        content: v.content,
      })),
      title: this.prompts.title,
      extensionId: this.id,
      tags: ["插件"],
    };
  }

  static extensions: Extensions[] = [];
  static getExtension(id: string): Extensions | undefined {
    return this.extensions.find((f) => f.id == id);
  }
}
