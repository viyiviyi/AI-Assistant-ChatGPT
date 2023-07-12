import { ChatContext, IChat } from "@/core/ChatManagement";
import { TopicMessage } from "@/Models/Topic";
import {
  CaretRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MessageOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Input,
  Popconfirm,
  Space,
  theme,
  Typography,
} from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MessageContext } from "./Chat";
import { insertInputRef, MemoInsertInput } from "./InsertInput";
import { MessageList, reloadTopic } from "./MessageList";
import { useSendMessage } from "@/core/hooks";

const { Panel } = Collapse;

const MemoTopicTitle = React.memo(TopicTitle);
const MemoMessageList = React.memo(MessageList);
export const ChatMessage = () => {
  const { token } = theme.useToken();
  const { chat, setActivityTopic, activityTopic, reloadNav } =
    useContext(ChatContext);
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
  const resetActivity = useCallback(
    (activityTopic?: TopicMessage) => {
      if (!activityTopic) return setNone([]);
      if (closeAll) {
        setCloasAll(false);
        setActivityKey([activityTopic.id]);
      } else if (!activityKey.includes(activityTopic.id)) {
        setActivityKey((v) => [...v, activityTopic.id]);
      }
      if (onlyOne) reloadTopic(activityTopic.id);
    },
    [activityKey, closeAll, onlyOne, setCloasAll]
  );
  useEffect(() => {
    resetActivity(activityTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityTopic]);

  const TopUtil = ({ topic: v }: { topic: TopicMessage }) => {
    const [showInsert0, setShowInsert0] = useState(false);
    const { sendMessage } = useSendMessage(chat);
    return (
      <>
        <div
          style={{
            borderBottom: "1px solid #ccc5",
            width: "100%",
            display: "flex",
            marginBottom: 5,
            marginTop: 0,
          }}
        >
          <Button
            shape="circle"
            type="text"
            icon={<PlusOutlined />}
            onClick={() => {
              reloadTopic(v.id, 0);
              setShowInsert0((v) => !v);
              setTimeout(() => {
                insertInputRef.current?.focus();
              }, 200);
            }}
          ></Button>
          <Button
            shape="circle"
            type="text"
            icon={<MessageOutlined />}
            onClick={() => {
              sendMessage(-1, v);
            }}
          ></Button>
          <span style={{ flex: 1 }}></span>
          <Space size={10}>
            <Typography.Title
              level={5}
              style={{ opacity: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Popconfirm
                title="确定删除？"
                onConfirm={() => {
                  chat.removeTopic(v).then(() => {
                    setActivityTopic(
                      activityTopic == v ? undefined : activityTopic
                    );
                    if (
                      activityTopic &&
                      activityTopic != v &&
                      !activityKey.includes(activityTopic?.id || "")
                    )
                      setActivityKey((k) => [activityTopic.id, ...k]);
                    reloadNav(v);
                    setNone([]);
                  });
                }}
              >
                <DeleteOutlined
                  style={{ color: "#ff8d8f", padding: "0 5px" }}
                ></DeleteOutlined>
              </Popconfirm>
            </Typography.Title>
            <Typography.Title
              level={5}
              style={{ opacity: 0.5, padding: "0 5px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Popconfirm
                title="请选择内容格式。"
                description="当选择对话时，将会给每条消息前加上助理或用户的名字。"
                onConfirm={() => {
                  downloadTopic(v, false, chat);
                }}
                onCancel={() => {
                  downloadTopic(v, true, chat);
                }}
                okText="文档"
                cancelText="对话"
              >
                <DownloadOutlined></DownloadOutlined>
              </Popconfirm>
            </Typography.Title>
          </Space>
        </div>
        {showInsert0 && (
          <MemoInsertInput
            key={"insert0_input"}
            insertIndex={0}
            topic={v}
            chat={chat}
            onHidden={() => setShowInsert0(false)}
          />
        )}
      </>
    );
  };

  if (onlyOne) {
    let topic = activityTopic;
    if (topic) {
      return (
        <div style={{ padding: token.paddingContentVerticalSM }}>
          <MemoTopicTitle topic={topic} onClick={() => {}}></MemoTopicTitle>
          <div style={{ marginTop: "15px" }}>
            <TopUtil topic={topic} />
          </div>
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
            ></MemoTopicTitle>
          }
          key={v.id}
          style={{
            border: "none",
            padding: "0 8px",
            width: "100%",
          }}
        >
          {activityKey.includes(v.id) && (
            <>
              <TopUtil topic={v} />
              <MemoMessageList chat={chat} topic={v}></MemoMessageList>
            </>
          )}
        </Panel>
      ))}
    </Collapse>
  );
};

function TopicTitle({
  topic,
  onClick,
}: {
  topic: TopicMessage;
  onClick: () => void;
}) {
  const { token } = theme.useToken();
  const { chat } = useContext(ChatContext);
  const [title, setTitle] = useState(topic.name);
  const [edit, setEdit] = useState(false);
  const cancelEdit = useCallback(() => {
    setEdit(false);
  }, []);
  useEffect(() => {
    document.removeEventListener("click", cancelEdit);
    document.addEventListener("click", cancelEdit);
    return () => {
      document.removeEventListener("click", cancelEdit);
    };
  }, [cancelEdit]);
  return (
    <div style={{ position: "relative", height: "24px" }}>
      {edit ? (
        <Input.TextArea
          placeholder={topic.name}
          autoSize={{ maxRows: 10 }}
          allowClear
          ref={insertInputRef}
          autoFocus={true}
          value={title}
          onKeyUp={(e) => {
            if ((e.key === "s" && e.altKey) || e.key == "Enter") {
              chat.saveTopic(topic.id, title);
              setEdit(false);
            }
          }}
          onChange={(e) => setTitle(e.target.value)}
        />
      ) : (
        <>
          <Typography.Title
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
              width: "calc(100% - 40px)",
              position: "absolute",
            }}
          >
            {title}
          </Typography.Title>
          <Button
            style={{ position: "absolute", right: 0 }}
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setEdit((v) => !v);
            }}
          ></Button>
        </>
      )}
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
