import { VirtualRoleSettingItem } from "./VirtualRoleSettingItem";

export type VirtualRoleSetting = {
  key: string;
  extensionId?: string;
  title?: string;
  postposition?: boolean;
  checked: boolean;
  tags: string[];
  ctx: VirtualRoleSettingItem[];
  /**
   * 开启动态词条，必须有一个子项被匹配到时才生效
   */
  dynamic?: boolean;
  /**
   * 作为历史上下文，受上下文数量控制
   */
  autoCtx?: boolean;
};
