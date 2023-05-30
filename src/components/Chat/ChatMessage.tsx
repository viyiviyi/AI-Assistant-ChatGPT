import { ChatContext, ChatManagement, IChat } from "@/core/ChatManagement";
import { scrollToBotton } from "@/core/utils";
import { Message } from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import {
  CaretRightOutlined,
  DeleteOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import { Button, Collapse, Popconfirm, theme, Typography } from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MessageContext } from "./Chat";
import { useInput } from "./InputUtil";
import { MessageItem } from "./MessageItem";

const { Panel } = Collapse;

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: { [key: string]: (messageId?: string) => void } = {};
export function reloadTopic(topicId: string, messageId?: string) {
  topicRender[topicId] && topicRender[topicId](messageId);
}

const MemoMessageList = React.memo(MessageList);
const MemoMessageItem = React.memo(MessageItem);
export const ChatMessage = () => {
  const { token } = theme.useToken();
  const { chat, setActivityTopic, activityTopic } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState<string[]>([]);
  const { onlyOne, closeAll, setCloasAll } = useContext(MessageContext);
  const [none, setNone] = useState([]);
  async function onClickTopicTitle(topic: TopicMessage) {
    let v = [...activityKey];
    if (closeAll) {
      v = [];
      setCloasAll(false);
    }
    if (v.includes(topic.id)) {
      if (topic.id !== chat.config.activityTopicId) {
        v = v.filter((f) => f !== topic.id);
        topic = chat.topics.slice(-1)[0];
      } else {
        scrollToBotton(topic.messages.slice(-1)[0]?.id);
        return;
      }
    } else {
      v.push(topic.id);
      if (topic.messages.length == 0) await ChatManagement.loadMessage(topic);
      reloadTopic(topic.id);
      scrollToBotton(topic.messages.slice(-1)[0]?.id);
    }
    chat.config.activityTopicId = topic.id;
    setActivityKey(v);
    setActivityTopic(topic);
  }
  useEffect(() => {
    ChatManagement.load().then(() => {
      activityTopic &&
        ChatManagement.loadMessage(activityTopic).then(() => {
          setNone([]);
          if (!activityKey.includes(activityTopic.id))
            setActivityKey((v) => [...v, activityTopic.id]);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityTopic]);
  Object.keys(topicRender).forEach((v) => delete topicRender[v]);

  function rendTopic(topic: TopicMessage) {
    return (
      <Panel
        header={
          <div style={{ display: "flex" }}>
            <Typography.Title
              editable={{
                onChange: (e) => {
                  chat.saveTopic(topic.id, e);
                  setActivityTopic(Object.assign({}, topic));
                },
              }}
              ellipsis={{ rows: 1 }}
              level={5}
              onClick={(e) => {
                e.stopPropagation();
                onClickTopicTitle(topic);
              }}
              style={{
                color:
                  chat.config.activityTopicId == topic.id
                    ? token.colorPrimary
                    : undefined,
                flex: 1,
                maxWidth: "calc(100vw - 140px)",
              }}
            >
              {topic.name}
            </Typography.Title>
            <span style={{ marginLeft: "30px" }}></span>
            <Typography.Title level={5} style={{ opacity: 0.5 }}>
              <Popconfirm
                title="确定删除？"
                onConfirm={() => {
                  chat.removeTopic(topic);
                  setActivityKey([...activityKey]);
                }}
                okText="确定"
                cancelText="取消"
              >
                <DeleteOutlined style={{ color: "#ff8d8f" }}></DeleteOutlined>
              </Popconfirm>
            </Typography.Title>
            <span style={{ marginLeft: "30px" }}></span>
            <Typography.Title level={5} style={{ opacity: 0.5 }}>
              <Popconfirm
                title="选择内容保存格式"
                onConfirm={() => {
                  downloadTopic(topic, false, chat);
                }}
                onCancel={() => {
                  downloadTopic(topic, true, chat);
                }}
                okText="仅内容"
                cancelText="包括角色"
              >
                <DownloadOutlined></DownloadOutlined>
              </Popconfirm>
            </Typography.Title>
          </div>
        }
        key={topic.id}
        style={{
          border: "none",
          padding: "0 8px",
        }}
      >
        {activityKey.includes(topic.id) && (
          <MemoMessageList chat={chat} topic={topic}></MemoMessageList>
        )}
      </Panel>
    );
  }

  if (onlyOne) {
    let topic = chat.topics.find((f) => f.id == chat.config.activityTopicId);
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
      defaultActiveKey={chat.config.activityTopicId}
      expandIcon={({ isActive }) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
      )}
    >
      {chat.topics.map(rendTopic)}
    </Collapse>
  );
};
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
  topicRender[topic.id] = (messageId?: string) => {
    if (messageId)
      return renderMessage[messageId] && renderMessage[messageId]();
    steMessages([...topic.messages]);
    setTotal(topic.messages.length);
    setRange([Math.max(0, topic.messages.length - 20), topic.messages.length]);
  };
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

function downloadTopic(topic: TopicMessage, useRole: boolean, chat: IChat) {
  let str = topic.name.replace(/^\\/, "").replace(/^\/:?:?/, "");
  str += "\n\n";
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
