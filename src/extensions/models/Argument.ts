export type ArgumentVal = {
  value: string;
  children: ArgumentVal[];
};
export type ArgumentDefine = {
  name: string;
  key: string;
  explain: string;
  val_type: "number" | "string" | "boolean" | "enum";
  enum?: { name: string; val: string | number }[];
};
