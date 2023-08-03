import { VirtualRoleSetting } from "@/Models/DataBase";

export class Extensions {
  private id: string;
  constructor(extension: Extensions) {
    this.id = extension.id;
  }
  settings(): VirtualRoleSetting[] {
    throw "";
  }
  isExtensionSetting(setting: VirtualRoleSetting): boolean {
    return false;
  }
  format(promptsContent: string): string {
    return promptsContent;
  }
  static extensions: Extensions[] = [];
  static getExtension(id: string): Extensions | undefined {
    return this.extensions.find((f) => f.id == id);
  }
}
