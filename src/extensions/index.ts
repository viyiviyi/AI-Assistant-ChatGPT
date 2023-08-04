import { VirtualRoleSetting } from "@/Models/DataBase";
import { ExtensionsDefinition } from "./model";

export class Extensions {
  private id: string;
  private extension: ExtensionsDefinition;
  constructor(extension: ExtensionsDefinition) {
    this.id = extension.id;
    this.extension = JSON.parse(JSON.stringify(extension));
    Extensions.extensions.push(this);
  }
  
  getSettings(): VirtualRoleSetting {
    return {
      checked: true,
      ctx: this.extension.prompts.ctx.map(v => ({role:v.role,content:v.content})),
      title:this.extension.prompts.title,
      extensionId: this.id,
      tags: ["插件"],
    };
  }
  isExtensionSetting(setting: VirtualRoleSetting): boolean {
    return false;
  }

  static extensions: Extensions[] = [];
  static getExtension(id: string): Extensions | undefined {
    return this.extensions.find((f) => f.id == id);
  }
}
