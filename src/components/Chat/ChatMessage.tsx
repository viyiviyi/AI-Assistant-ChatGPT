import { ChatContext, IChat } from "@/core/ChatManagement";
import { TopicMessage } from "@/Models/Topic";
import {
  CaretRightOutlined,
  DeleteOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import { Collapse, Popconfirm, theme, Typography } from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MessageContext } from "./Chat";
import { MessageList, reloadTopic } from "./MessageList";

const { Panel } = Collapse;

const MemoTopicTitle = React.memo(TopicTitle);
const MemoMessageList = React.memo(MessageList);
export const ChatMessage = () => {
  const { token } = theme.useToken();
  const { chat, setActivityTopic, activityTopic } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState<string[]>([
    chat.config.activityTopicId,
  ]);
  const { onlyOne, closeAll, setCloasAll } = useContext(MessageContext);
  const [none, setNone] = useState([]);
  const onClickTopicTitle = useCallback(
    async (topic: TopicMessage) => {
      let v = [...activityKey];
      if (closeAll) {
        v = [];
        setCloasAll(false);
      }
      if (v.includes(topic.id)) {
        v = v.filter((f) => f !== topic.id);
        setActivityKey(v);
        return;
      }
      v.push(topic.id);
      setActivityKey(v);
      setActivityTopic(topic);
    },
    [activityKey, closeAll, setCloasAll, setActivityTopic]
  );
  useEffect(() => {
    if (!activityTopic) return setNone([]);
    if (closeAll) {
      setCloasAll(false);
      setActivityKey([activityTopic.id]);
    } else if (!activityKey.includes(activityTopic.id)) {
      setActivityKey((v) => [...v, activityTopic.id]);
    }
    if (onlyOne) reloadTopic(activityTopic.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityTopic]);

  if (onlyOne) {
    let topic = activityTopic;
    if (topic) {
      return (
        <div style={{ padding: token.paddingContentVerticalSM }}>
          <MemoMessageList chat={chat} topic={topic}></MemoMessageList>
        </div>
      );
    }
  }

  return (
    <Collapse
      ghost
      bordered={false}
      activeKey={closeAll ? [] : activityKey}
      expandIcon={({ isActive }) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
      )}
    >
      {chat.topics.map((v) => (
        <Panel
          id={v.id}
          header={
            <MemoTopicTitle
              topic={v}
              onClick={() => onClickTopicTitle(v)}
              onRemove={(t) => {
                chat.removeTopic(t).then((v) => {
                  setActivityTopic(
                    activityTopic == t ? undefined : activityTopic
                  );
                  if (
                    activityTopic &&
                    activityTopic != t &&
                    !activityKey.includes(activityTopic?.id || "")
                  )
                    setActivityKey((k) => [activityTopic.id, ...k]);
                  setNone([]);
                });
              }}
            ></MemoTopicTitle>
          }
          key={v.id}
          style={{
            border: "none",
            padding: "0 8px",
          }}
        >
          {activityKey.includes(v.id) && (
            <MemoMessageList chat={chat} topic={v}></MemoMessageList>
          )}
        </Panel>
      ))}
    </Collapse>
  );
};

function TopicTitle({
  topic,
  onClick,
  onRemove,
}: {
  topic: TopicMessage;
  onClick: () => void;
  onRemove: (topic: TopicMessage) => void;
}) {
  const { token } = theme.useToken();
  const { chat } = useContext(ChatContext);
  const [title, setTitle] = useState(topic.name);
  return (
    <div style={{ display: "flex", width: "100%", maxWidth: "100%" }}>
      <Typography.Title
        editable={{
          onChange: (e) => {
            chat.saveTopic(topic.id, e);
            setTitle(e);
          },
        }}
        ellipsis={{ rows: 1 }}
        level={5}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          color:
            chat.config.activityTopicId == topic.id
              ? token.colorPrimary
              : undefined,
          flex: 1,
          maxWidth: "min(100vw - 140px, 800px)",
        }}
      >
        {title}
      </Typography.Title>
      <span style={{ marginLeft: "20px", flex: 1 }}></span>
      <Typography.Title
        level={5}
        style={{ opacity: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Popconfirm title="确定删除？" onConfirm={() => onRemove(topic)}>
          <DeleteOutlined
            style={{ color: "#ff8d8f", padding: "0 5px" }}
          ></DeleteOutlined>
        </Popconfirm>
      </Typography.Title>
      <span style={{ marginLeft: "20px" }}></span>
      <Typography.Title
        level={5}
        style={{ opacity: 0.5, padding: "0 5px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Popconfirm
          title="请选择内容格式。"
          description="当选择对话时，将会给每条消息前加上助理或用户的名字。"
          onConfirm={() => {
            downloadTopic(topic, false, chat);
          }}
          onCancel={() => {
            downloadTopic(topic, true, chat);
          }}
          okText="文档"
          cancelText="对话"
        >
          <DownloadOutlined></DownloadOutlined>
        </Popconfirm>
      </Typography.Title>
    </div>
  );
}

export function downloadTopic(
  topic: TopicMessage,
  useRole: boolean,
  chat: IChat
) {
  let str =
    "#" +
    topic.name
      .replace(/^\\/, "")
      .replace(/^\/:?:?/, "")
      .substring(0, 32);
  str += "\n---\n";
  topic.messages.forEach((v) => {
    let virtualRole = chat.virtualRole;
    if (v.virtualRoleId != chat.virtualRole.id) {
      virtualRole = chat.virtualRoles[v.virtualRoleId || ""] || virtualRole;
    }
    if (useRole && v.ctxRole === "system") str += "系统：\n";
    else if (useRole && v.virtualRoleId) str += virtualRole.name + ":\n";
    else if (useRole && v.senderId) str += chat.user.name + ":\n";
    str += v.text + "\n\n";
  });
  downloadText(str, topic.name + ".md");
}

function downloadText(jsonData: string, filename: string) {
  const blob = new Blob([jsonData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
