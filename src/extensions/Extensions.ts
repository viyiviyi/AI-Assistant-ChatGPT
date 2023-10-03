import { IChat } from "@/core/ChatManagement";
import { IndexedDB } from "@/core/db/IndexDb";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { useEffect, useState } from "react";
import { getInstance } from "ts-indexdb";
import { ArgumentDefine } from "./models/Argument";
import { ExtensionsDefine } from "./models/ExtensionsDefine";
import { Interceptor } from "./models/Interceptor";

export class Extensions implements ExtensionsDefine {
  readonly id: string;
  private extension: ExtensionsDefine;
  readonly name: string;
  readonly tags: string[];
  readonly permissions: string[];
  readonly prompts: VirtualRoleSetting;
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
      key: this.prompts.key,
      checked: true,
      ctx: this.prompts.ctx.map((v) => ({
        ...v,
      })),
      title: this.prompts.title,
      extensionId: this.id,
      tags: ["插件"],
    };
  }

  static extensions: Extensions[] = [];
  static loadAwait: Promise<void>;
  static async initExtensions() {
    if (this.loadAwait) return this.loadAwait;
    this.loadAwait = new Promise(async (res) => {
      await IndexedDB.init();
      const extensions = await getInstance().queryAll<ExtensionsDefine>({
        tableName: "Extensions",
      });
      if (Array.isArray(extensions))
        this.extensions.push(...extensions.map((v) => new Extensions(v)));
    });
  }
  static getExtension(id: string): Extensions | undefined {
    return this.extensions.find((f) => f.id == id);
  }
  static useExtension = useExtension;
}

function useExtension(chat: IChat) {
  const [extensions, setExtensions] = useState<Extensions[]>([]);
  useEffect(() => {
    setExtensions(
      Extensions.extensions.filter((f) =>
        chat.config.extensions?.includes(f.id)
      )
    );
  }, [chat]);
  return { extensions };
}
