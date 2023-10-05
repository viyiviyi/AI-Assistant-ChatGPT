import { ChatManagement } from "@/core/ChatManagement";
import { CtxRole } from "@/Models/CtxRole";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { Space, Tag, Typography } from "antd";
import { MarkdownView } from "../common/MarkdownView";

export const VirtualRoleConfigInfo = ({
  settings,
  bio,
  topicVirtualRole,
}: {
  settings: VirtualRoleSetting[];
  bio: string;
  topicVirtualRole?: VirtualRoleSetting[];
}) => {
  const getTag = (role: CtxRole) => {
    switch (role) {
      case "assistant":
        return <Tag color="cyan">{"助理"}</Tag>;
      case "system":
        return <Tag color="blue">{"系统"}</Tag>;
      case "user":
        return <Tag color="purple">{"用户"}</Tag>;
    }
  };

  return (
    <div>
      <Space direction="vertical">
        {bio ? (
          <>
            {getTag(ChatManagement.parseTextToRole(bio, "system"))}
            <MarkdownView markdown={bio} />
          </>
        ) : (
          <></>
        )}
        {ChatManagement.parseSetting(
          settings.filter((v) => !v.postposition)
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_p"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        {ChatManagement.parseSetting(
          (topicVirtualRole || []).filter((v) => !v.postposition)
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_p"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        <Typography.Text type="secondary">{"... 上下文"}</Typography.Text>
        {ChatManagement.parseSetting(
          (topicVirtualRole || []).filter((v) => v.postposition)
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_e"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        {ChatManagement.parseSetting(
          settings.filter((v) => v.postposition)
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_e"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
      </Space>
    </div>
  );
};
