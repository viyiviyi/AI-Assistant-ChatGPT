import { ArgumentDefine } from "./Argument";

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

export type GlobalVariate = ArgumentDefine & {
  key: VariateType;
};

export const GlobalVariateList: { [key in VariateType]: GlobalVariate } = {
  userName: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  userEnName: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  assistantName: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  assistantEnName: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  modelName: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  aiType: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  tokenTotal: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  maxTokens: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
  contextVariable: {
    name: "",
    explain: "",
    val_type: "string",
    enum: undefined,
    key: "userName",
  },
};
