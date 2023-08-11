import { CtxRole, VirtualRoleSetting } from "@/Models/DataBase";
import { ChatManagement } from "@/core/ChatManagement";
import { Space, Tag, Typography } from "antd";

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
    <div style={{ maxHeight: "calc(100vh - 120px)", overflow: "auto" }}>
      <Space direction="vertical">
        {bio ? (
          <>
            {getTag(ChatManagement.parseTextToRole(bio))}
            <Typography.Text>{bio}</Typography.Text>
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
              <Typography.Text>{v.content}</Typography.Text>
            </>
          );
        })}
        <p>{"... 上下文"}</p>
        {ChatManagement.parseSetting(
          settings.filter((v) => v.postposition)
        ).map((v) => {
          return (
            <>
              {getTag(v.role)}
              <Typography.Text>{v.content}</Typography.Text>
            </>
          );
        })}
      </Space>
    </div>
  );
};
