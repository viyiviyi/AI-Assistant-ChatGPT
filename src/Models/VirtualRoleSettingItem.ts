import { CtxRole } from "./CtxRole";

export type VirtualRoleSettingItem = {
  key: string;
  role?: CtxRole;
  content: string;
  checked?: boolean;
  /**
   * 关键词,当checked为true且上下文中出现关键词时内容会自动选中
   */
  keyWords?: string[];
};
