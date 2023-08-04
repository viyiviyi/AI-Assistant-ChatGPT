import { CtxRole } from "./../Models/DataBase";

interface Interceptor {
  handleType: "replace" | "interrupt" | "if" | "add" | "request";
  children: Interceptor[];
}

export type ArgDefine = {
  name: string;
  key: string;
  explain: string;
  val_type: "number" | "string" | "boolean" | "enum";
  enum?: { name: string; val: string | number }[];
};

export type VariateType =
  | "userName"
  | "userEnName"
  | "assistantName"
  | "assistantEnName"
  | "modelName"
  | "aiType"
  | "tokenTotal"
  | "maxTokens"
  | "contextVariable";

export type Variate = {
  name: string;
  key: VariateType;
  explain: string;
  val_type: "number" | "string" | "boolean" | "enum" | "variates";
  enum?: { name: string; val: string | number }[];
  children: Variate[];
};

export interface ExtensionsDefinition {
  id: string;
  name: string;
  tags: string[];
  permissions: string[];
  prompts: {
    title?: string;
    checked: boolean;
    ctx: { role: CtxRole; content: string }[];
  };
  args: ArgDefine[];
  onSendBefore: Interceptor[];
  onSend: Interceptor[];
  onSendAfter: Interceptor[];
  onRender: Interceptor[];
}
