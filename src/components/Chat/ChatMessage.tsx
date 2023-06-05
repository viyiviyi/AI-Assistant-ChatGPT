import { ChatContext, ChatManagement, IChat } from "@/core/ChatManagement";
import { scrollToBotton } from "@/core/utils";
import { Message } from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import {
  CaretRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Input,
  Modal,
  Popconfirm,
  theme,
  Typography,
} from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MessageContext } from "./Chat";
import { useInput } from "./InputUtil";
import { MessageItem } from "./MessageItem";

const { Panel } = Collapse;

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: { [key: string]: (messageId?: string | number) => void } =
  {};
export function reloadTopic(topicId: string, messageId?: string | number) {
  topicRender[topicId] && topicRender[topicId](messageId);
}

const MemoTopicTitle = React.memo(TopicTitle);
const MemoMessageList = React.memo(MessageList);
const MemoMessageItem = React.memo(MessageItem);
export const ChatMessage = () => {
  const { token } = theme.useToken();
  const { chat, setActivityTopic, activityTopic } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState<string[]>([chat.config.activityTopicId]);
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
    ChatManagement.load().then(() => {
      if (!activityTopic) return setNone([]);
      if (!activityKey.includes(activityTopic.id))
        setActivityKey((v) => [...v, activityTopic.id]);
      setTimeout(() => {
        scrollToBotton(activityTopic.messages.slice(-1)[0].id, true, true);
      }, 500);
    });
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
          header={
            <MemoTopicTitle
              topic={v}
              onClick={() => onClickTopicTitle(v)}
              onRemove={(t) => {
                chat.removeTopic(t);
                setNone([]);
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
        id={topic.id}
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
          maxWidth: "calc(100% - 100px)",
        }}
      >
        {title}
      </Typography.Title>
      <span style={{ marginLeft: "20px" }}></span>
      <Typography.Title level={5} style={{ opacity: 0.5 }}>
        <Popconfirm title="确定删除？" onConfirm={() => onRemove(topic)}>
          <DeleteOutlined
            style={{ color: "#ff8d8f", padding: "0 5px" }}
          ></DeleteOutlined>
        </Popconfirm>
      </Typography.Title>
      <span style={{ marginLeft: "20px" }}></span>
      <Typography.Title level={5} style={{ opacity: 0.5, padding: "0 5px" }}>
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

function MessageList({
  topic,
  chat,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
}) {
  const { inputRef, setInput } = useInput();
  const [messages, steMessages] = useState(topic.messages);
  const [total, setTotal] = useState(topic.messages.length);
  const [renderMessage] = useState<{ [key: string]: () => void }>({});
  const [range, setRange] = useState([
    Math.max(0, topic.messages.length - 20),
    topic.messages.length,
  ]);
  const { setCite } = useContext(MessageContext);
  const rBak = useCallback(
    (v: Message) => {
      setInput(
        (m) =>
          (m ? m + "\n" : m) +
          (!m
            ? v.ctxRole == "system"
              ? "/::"
              : v.virtualRoleId
              ? "/"
              : ""
            : "") +
          v.text
      );
      inputRef.current?.focus();
    },
    [inputRef, setInput]
  );
  const onDel = useCallback(
    (msg: Message) => {
      chat.removeMessage(msg)?.then(() => {
        delete renderMessage[msg.id];
        steMessages([...topic.messages]);
      });
    },
    [renderMessage, steMessages, topic, chat]
  );
  useEffect(() => {
    topicRender[topic.id] = (messageId?: string | number) => {
      if (typeof messageId == "number") {
        if (messageId < range[0] || messageId >= range[1]) {
          setRange([
            Math.max(
              messageId -
                Math.max(10, 20 - (topic.messages.length - messageId)),
              0
            ),
            Math.min(
              topic.messages.length,
              messageId + Math.max(10, 20 - messageId)
            ),
          ]);
        }
        return;
      }
      if (messageId) {
        return renderMessage[messageId] && renderMessage[messageId]();
      }
      steMessages([...topic.messages]);
      setTotal(topic.messages.length);
      setRange([
        Math.max(0, topic.messages.length - 20),
        topic.messages.length,
      ]);
    };
    return () => {
      delete topicRender[topic.id];
    };
  }, [renderMessage, topic, range]);
  return (
    <>
      {range[0] > 0 ? (
        <Button.Group style={{ width: "100%" }}>
          <Button
            block
            type="text"
            onClick={() => {
              setRange([
                Math.max(0, range[0] - 10),
                Math.min(total, Math.max(range[1] - 10, 20)),
              ]);
              scrollToBotton(messages.slice(range[0], range[1])[0]?.id);
            }}
          >
            上一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              setRange([0, Math.min(total, 20)]);
            }}
          >
            顶部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
      {messages.slice(range[0], range[1]).map((v) => (
        <MemoMessageItem
          renderMessage={renderMessage}
          msg={v}
          onDel={onDel}
          rBak={rBak}
          onCite={setCite}
          key={v.id}
        ></MemoMessageItem>
      ))}

      {range[1] < total ? (
        <Button.Group style={{ width: "100%" }}>
          <Button
            block
            type="text"
            onClick={() => {
              setRange([
                Math.min(Math.max(0, total - 20), range[0] + 10),
                Math.min(total, range[1] + 10),
              ]);
              scrollToBotton(messages.slice(range[1], range[1] + 1)[0]?.id);
            }}
          >
            下一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              setRange([
                Math.max(0, topic.messages.length - 20),
                topic.messages.length,
              ]);
              scrollToBotton(messages.slice(-1)[0]?.id);
            }}
          >
            底部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
    </>
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
