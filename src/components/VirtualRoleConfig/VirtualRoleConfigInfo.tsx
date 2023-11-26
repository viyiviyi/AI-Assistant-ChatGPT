import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { onSendBefore } from "@/middleware/execMiddleware";
import { CtxRole } from "@/Models/CtxRole";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { Tag, Typography } from "antd";
import { useContext } from "react";
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
  const { chatMgt } = useContext(ChatContext);
  const renderContext = (
    ctx: Array<{
      role: CtxRole;
      content: string;
    }>
  ): {
    role: CtxRole;
    content: string;
  }[] => {
    return onSendBefore(chatMgt.getChat(), { allCtx: ctx, history: [] }) as {
      role: CtxRole;
      content: string;
    }[];
  };
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
    <div style={{ wordWrap: "break-word", padding: 8 }}>
      <div>
        {bio ? (
          <>
            {getTag(ChatManagement.parseTextToRole(bio, "system"))}
            <MarkdownView
              markdown={
                renderContext([
                  {
                    content: bio,
                    role: ChatManagement.parseTextToRole(bio, "system"),
                  },
                ])[0].content
              }
            />
          </>
        ) : (
          <></>
        )}
        {renderContext(
          ChatManagement.parseSetting(settings.filter((v) => !v.postposition))
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_p"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        {renderContext(
          ChatManagement.parseSetting(
            (topicVirtualRole || []).filter((v) => !v.postposition)
          )
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_p"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        <Typography.Text type="secondary">{"... 上下文"}</Typography.Text>
        {renderContext(
          ChatManagement.parseSetting(
            (topicVirtualRole || []).filter((v) => v.postposition)
          )
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_e"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        {renderContext(
          ChatManagement.parseSetting(settings.filter((v) => v.postposition))
        ).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_e"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
