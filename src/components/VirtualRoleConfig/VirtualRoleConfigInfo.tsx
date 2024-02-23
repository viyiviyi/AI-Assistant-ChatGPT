import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { onSendBefore } from "@/middleware/execMiddleware";
import { CtxRole } from "@/Models/CtxRole";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { Tag, Typography } from "antd";
import { useContext, useMemo } from "react";
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
  const { chatMgt, activityTopic } = useContext(ChatContext);
  const _chatMgt = useMemo(() => {
    return new ChatManagement({
      id: "",
      ...chatMgt,
      virtualRole: { ...chatMgt.virtualRole, settings: settings },
    });
  }, [chatMgt, settings]);
  const { history, historyAfter, historyBefore } = useMemo(
    () =>
      _chatMgt!.getAskContext({
        ...(activityTopic || {
          id: "",
          groupId: "",
          name: "",
          createdAt: 0,
          messages: [],
          messageMap: {},
          titleTree: [],
        }),
        overrideVirtualRole: topicVirtualRole,
      }),
    [_chatMgt, activityTopic, topicVirtualRole]
  );
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
        {renderContext(historyBefore).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_p"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        <Typography.Text type="secondary">
          {"...动态上下文开始"}
        </Typography.Text>
        {renderContext(history).map((v, idx) => {
          return (
            <div key={idx + "_settint_info_item_e"}>
              {getTag(v.role)}
              <MarkdownView markdown={v.content} />
            </div>
          );
        })}
        <Typography.Text type="secondary">
          {"...动态上下文结束"}
        </Typography.Text>
        {renderContext(historyAfter).map((v, idx) => {
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
