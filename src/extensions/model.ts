import { CtxRole } from "./../Models/DataBase";
type ExtensionsType = "";

export interface Extensions {
  id: string;
  name: string;
  tags: string[];
  type: ExtensionsType[];
  permissions: string[];
  prompts: {
    title?: string;
    checked: boolean;
    ctx: { role: CtxRole; content: string }[];
  }[];
  args: {
    name: string;
    key: string;
    explain: string;
    val_type: "number" | "string" | "boolean" | "enum";
    enum?: { name: string; val: string | number }[];
  }[];
}
