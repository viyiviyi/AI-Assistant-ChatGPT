import { ChatContext, ChatManagement, IChat } from "@/core/ChatManagement";
import { Message, Topic } from "@/Models/DataBase";
import {
  CaretRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  RollbackOutlined,
  SaveOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Checkbox,
  Collapse,
  Input,
  message as antd_message,
  Popconfirm,
  theme,
  Typography
} from "antd";
import copy from "copy-to-clipboard";
import { useContext, useState } from "react";
import { MarkdownView } from "./MarkdownView";

const { Panel } = Collapse;

export function scrollToBotton(id: string) {
  setTimeout(() => {
    if (window) {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, 1500);
}
export const ChatMessage = ({
  onlyOne,
  rBak,
  handerCloseAll,
  onCite,
}: {
  onlyOne?: boolean;
  rBak: (v: Message) => void;
  handerCloseAll: (closeAll: () => void) => void;
  onCite: (message: Message) => void;
}) => {
  const { token } = theme.useToken();
  const { chat, setActivityTopic } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState(chat.topics.map((v) => v.id));
  const [topics, setTopics] = useState(chat.topics);
  const [closeAll, setCloasAll] = useState(true);
  function deleteChatMsg(msg: Message): void {
    chat.removeMessage(msg)?.then(() => {
      setTopics([...topics]);
    });
  }
  handerCloseAll(() => {
    if (closeAll) {
      setActivityKey([]);
      setCloasAll(false);
    } else {
      setCloasAll(true);
    }
  });

  async function onClickTopicTitle(
    topic: Topic & {
      messages: Message[];
    }
  ) {
    console.time("test");
    let v = [...activityKey];
    if (closeAll) {
      v = [];
      setCloasAll(false);
    }
    if (v.includes(topic.id)) {
      v = v.filter((f) => f !== topic.id);
      topic = chat.topics.slice(-1)[0];
    } else {
      v.push(topic.id);
    }
    chat.config.activityTopicId = topic.id;
    if (topic.messages.length == 0) await ChatManagement.loadMessage(topic);
    setActivityKey(v);
    setActivityTopic(topic);
    scrollToBotton(topic.messages.slice(-1)[0]?.id);

    console.timeEnd("test");
  }

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
                maxWidth: "calc(100vw - 160px)",
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
        {/* {topic.messages.map((v, i) => {
          return (
            <MessagesBox
              msg={v}
              onDel={deleteChatMsg}
              rBak={rBak}
              onCite={onCite}
              key={v.id}
            ></MessagesBox>
          );
        })} */}
        {(activityKey.includes(topic.id) ||
          topic.id == chat.config.activityTopicId) &&
          topic.messages.map((v, i) => {
            return (
              <MessagesBox
                msg={v}
                onDel={deleteChatMsg}
                rBak={rBak}
                onCite={onCite}
                key={v.id}
              ></MessagesBox>
            );
          })}
      </Panel>
    );
  }
  if (onlyOne) {
    let topic = chat.topics.find((f) => f.id == chat.config.activityTopicId);
    if (topic) {
      return (
        <div style={{ padding: token.paddingContentVerticalSM }}>
          {topic.messages.map((v, i) => (
            <MessagesBox
              msg={v}
              onDel={deleteChatMsg}
              rBak={rBak}
              onCite={onCite}
              key={v.id}
            ></MessagesBox>
          ))}
        </div>
      );
    }
  }

  return (
    <Collapse
      ghost
      bordered={false}
      activeKey={closeAll ? [] : [...activityKey, chat.config.activityTopicId]}
      defaultActiveKey={chat.config.activityTopicId}
      expandIcon={({ isActive }) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
      )}
    >
      {chat.topics.map(rendTopic)}
    </Collapse>
  );
};

const MessagesBox = ({
  msg,
  rBak,
  onDel,
  onCite,
}: {
  msg: Message;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  onCite: (message: Message) => void;
}) => {
  const { chat } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState(msg.text);
  const [none, setNone] = useState([]);

  const utilsEle = (
    <>
      <Checkbox
        checked={msg.checked || false}
        onChange={(e) => {
          msg.checked = e.target.checked;
          chat.pushMessage(msg);
          setNone([]);
        }}
      >
        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
      </Checkbox>
      <span
        onClick={() => {
          setEdit(false);
        }}
        style={{ flex: 1 }}
      ></span>
      {edit ? (
        <SaveOutlined
          onClick={() => {
            msg.text = message;
            chat.pushMessage(msg);
            setEdit(false);
          }}
          style={{ marginLeft: "16px" }}
        />
      ) : (
        <></>
      )}
      <span style={{ marginLeft: "16px" }}></span>
      <EditOutlined
        onClick={() => {
          if (!edit) setMessage(msg.text);
          setEdit(!edit);
        }}
      />
      <span style={{ marginLeft: "16px" }}></span>
      <CopyOutlined
        onClick={() => {
          if (copy(msg.text.toString())) {
            antd_message.success("已复制");
          }
        }}
      />
      <span style={{ marginLeft: "16px" }}></span>
      <RollbackOutlined
        style={{ cursor: "pointer" }}
        onClick={() => {
          rBak(msg);
        }}
      />
      <span style={{ marginLeft: "30px" }}></span>
      <Popconfirm
        title="确定删除？"
        onConfirm={() => {
          onDel(msg);
          setNone([]);
        }}
        okText="确定"
        cancelText="取消"
      >
        <DeleteOutlined style={{ color: "#ff8d8f" }}></DeleteOutlined>
      </Popconfirm>
    </>
  );
  if (msg.ctxRole === "system") {
    return (
      <div style={{ padding: "1em 32px", textAlign: "center" }} id={msg.id}>
        <div>
          {edit ? (
            <Input.TextArea
              value={message}
              autoSize
              style={{ marginBottom: "4px" }}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
          ) : (
            <Typography.Text type="secondary">
              {"系统：" + msg.text}
            </Typography.Text>
          )}
        </div>
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #ccc3",
            justifyContent: "flex-end",
            padding: "5px 5px",
            opacity: 0.5,
          }}
        >
          {utilsEle}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: msg.virtualRoleId ? "flex-start" : "flex-end",
      }}
      id={msg.id}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: msg.virtualRoleId ? "row" : "row-reverse",
        }}
      >
        <Avatar
          src={msg.virtualRoleId ? chat.virtualRole.avatar : chat.user.avatar}
          size={42}
          style={{ minWidth: "42px", minHeight: "42px" }}
          icon={<UserOutlined />}
        />
        <div
          style={{
            display: "flex",
            flex: edit ? 1 : undefined,
            maxWidth: "min(900px, calc(100vw - 100px))",
            wordWrap: "break-word",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              padding: "0 5px",
              flexDirection: msg.virtualRoleId ? "row" : "row-reverse",
            }}
          >
            <span>
              {msg.virtualRoleId ? chat.virtualRole.name : chat.user?.name}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              padding: "5px 10px",
              flexDirection: "column",
              boxSizing: "border-box",
              borderRadius: token.borderRadiusLG,
              border: "1px solid " + token.colorFillAlter,
              backgroundColor: token.colorInfoBg,
              marginBottom: "12px",
              boxShadow: token.boxShadowTertiary,
            }}
          >
            <div>
              {edit ? (
                <Input.TextArea
                  value={message}
                  autoSize
                  style={{ marginBottom: "4px" }}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                />
              ) : (
                <MarkdownView
                  menu={{
                    onClick: (e) => {
                      switch (e.key) {
                        case "1":
                          if (copy(message)) {
                            antd_message.success("已复制");
                          }
                          break;
                        case "2":
                          onCite(msg);
                          break;
                      }
                    },
                    items: [
                      {
                        label: "复制",
                        key: "1",
                      },
                      {
                        label: "引用",
                        key: "2",
                      },
                    ],
                  }}
                  markdown={
                    chat.config.disableStrikethrough
                      ? msg.text.replaceAll("~", "～")
                      : msg.text
                  }
                />
              )}
            </div>
            <div
              style={{
                display: "flex",
                borderTop: "1px solid #ccc3",
                justifyContent: "flex-end",
                opacity: 0.6,
              }}
            >
              {utilsEle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
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
