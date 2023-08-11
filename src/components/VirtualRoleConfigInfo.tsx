import { CtxRole, VirtualRoleSetting } from "@/Models/DataBase";
import { ChatManagement } from "@/core/ChatManagement";
import { Space, Tag, Typography } from "antd";
import { MarkdownView } from "./Chat/MarkdownView";

export const VirtualRoleConfigInfo = ({
  settings,
  bio,
}: {
  settings: VirtualRoleSetting[];
  bio: string;
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
        ).map((v) => {
          return (
            <>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </>
          );
        })}
        <Typography.Text type="secondary">{"... 上下文"}</Typography.Text>
        {ChatManagement.parseSetting(
          settings.filter((v) => v.postposition)
        ).map((v) => {
          return (
            <>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </>
          );
        })}
      </Space>
    </div>
  );
};
