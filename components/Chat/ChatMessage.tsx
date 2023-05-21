import { ChatContext, ChatManagement, IChat } from "@/core/ChatManagement";
import { scrollToBotton } from "@/core/utils";
import { Message, Topic } from "@/Models/DataBase";
import {
  CaretRightOutlined,
  DeleteOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import { Button, Collapse, Popconfirm, theme, Typography } from "antd";
import React, { useContext, useState } from "react";
import { MessageContext } from "./Chat";
import { useInput } from "./InputUtil";
import { MessageItem } from "./MessageItem";

const { Panel } = Collapse;

const MemoMessageList = React.memo(MessageList);
export const ChatMessage = () => {
  const { token } = theme.useToken();
  const { chat, setActivityTopic } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState<string[]>([]);
  const { onlyOne, closeAll, setCloasAll } = useContext(MessageContext);
  async function onClickTopicTitle(
    topic: Topic & {
      messages: Message[];
    }
  ) {
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
  Object.keys(renderTopic).forEach((v) => {
    delete renderTopic[v];
  });

  function rendTopic(topic: Topic & { messages: Message[] }) {
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

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const renderTopic: { [key: string]: () => void } = {};
export function reloadTopic(topicId: string) {
  renderTopic[topicId] && renderTopic[topicId]();
}
function MessageList({
  topic,
  chat,
}: {
  topic: Topic & { messages: Message[] };
  chat: ChatManagement;
}) {
  const { inputRef, setInput } = useInput();
  const [messages, steMessages] = useState(topic.messages);
  const [total, setTotal] = useState(topic.messages.length);
  const [range, setRange] = useState([
    Math.max(0, topic.messages.length - 20),
    topic.messages.length,
  ]);
  const { setCite, onlyOne } = useContext(MessageContext);
  function rBak(v: Message) {
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
  }
  renderTopic[topic.id] = () => {
    steMessages([...topic.messages]);
    setTotal(topic.messages.length);
    setRange([Math.max(0, topic.messages.length - 20), topic.messages.length]);
    // scrollToBotton(messages.slice(-1)[0]?.id);
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
        <MessageItem
          msg={v}
          onDel={(msg) => {
            chat.removeMessage(msg)?.then(() => {
              steMessages([...topic.messages]);
            });
          }}
          rBak={rBak}
          onCite={setCite}
          key={v.id}
        ></MessageItem>
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

function downloadTopic(
  topic: Topic & { messages: Message[] },
  useRole: boolean,
  chat: IChat
) {
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
