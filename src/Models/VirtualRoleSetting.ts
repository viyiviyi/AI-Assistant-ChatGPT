import { VirtualRoleSettingItem } from "./VirtualRoleSettingItem";

export type VirtualRoleSetting = {
  key: string;
  extensionId?: string;
  title?: string;
  postposition?: boolean;
  checked: boolean;
  tags: string[];
  ctx: VirtualRoleSettingItem[];
};
