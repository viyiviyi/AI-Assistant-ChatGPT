import { CtxRole } from "./CtxRole";

export type VirtualRoleSettingItem = {
  key: string;
  role?: CtxRole;
  content: string;
  checked?: boolean;
};
