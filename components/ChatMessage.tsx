import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { MarkdownView } from "./MarkdownView";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Message, Topic } from "@/Models/DataBase";
import { ChatManagement } from "@/core/ChatManagement";
import { Avatar, Collapse, Input, Popconfirm, theme, Typography } from "antd";
import { CaretRightOutlined, UserOutlined } from "@ant-design/icons";
import React from "react";
function scrollToBotton(dom: HTMLElement) {
  dom.scrollIntoView({ behavior: "smooth" });
}
const { Panel } = Collapse;
export const ChatMessage = ({
  chat,
  rBak,
  onDel,
  handerCloseAll,
}: {
  chat?: ChatManagement;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  handerCloseAll: (closeAll: () => void) => void;
}) => {
  const { token } = theme.useToken();
  const [activityKey, setActivityKey] = useState(
    chat ? [...chat.topics.map((v) => v.id)] : []
  );
  const [closeAll, setCloasAll] = useState(true);
  handerCloseAll(() => {
    setCloasAll(true);
  });
  const newMsgRef = React.createRef<HTMLInputElement>();
  useEffect(() => {
    if (newMsgRef != null && newMsgRef.current != null)
      scrollToBotton(newMsgRef.current);
  }, [newMsgRef]);
  if (!chat) return <></>;
  function rendTopic(topic: Topic & { messages: Message[] }, idx: number) {
    return (
      <Panel
        header={
          <div style={{ display: "flex" }}>
            <Typography.Title
              editable={{
                onChange: (e) => (topic.name = e),
                onCancel: () => {
                  setActivityKey([...activityKey]);
                },
              }}
              level={5}
              onClick={(e) => {
                e.stopPropagation();
                let v = [...activityKey];
                if (closeAll) {
                  v = [];
                  setCloasAll(false);
                }
                if (v.includes(topic.id)) {
                  v = v.filter((f) => f !== topic.id);
                  chat!.config.activityTopicId =
                    chat?.topics.slice(-1)[0].id || "";
                } else {
                  chat!.config.activityTopicId = topic.id;
                  v.push(topic.id);
                }
                setActivityKey(v);
              }}
              style={{
                color:
                  chat!.config.activityTopicId == topic.id
                    ? token.colorPrimary
                    : undefined,
              }}
            >
              {topic.name}
            </Typography.Title>
            <span style={{ marginLeft: "30px" }}></span>
            <Typography.Title level={5}>
              <Popconfirm
                title="确定删除？"
                onConfirm={() => {
                  chat?.removeTopic(topic);
                  setActivityKey([...activityKey]);
                }}
                okText="确定"
                cancelText="取消"
              >
                <DeleteOutlined></DeleteOutlined>
              </Popconfirm>
            </Typography.Title>
          </div>
        }
        key={topic.id}
        style={{
          border: "none",
        }}
      >
        {topic.messages.map((v, i) => (
          <MessagesBox
            msg={v}
            chat={chat}
            newMsgRef={
              topic.id == chat?.config.activityTopicId &&
              i == topic.messages!.length - 1
                ? newMsgRef
                : undefined
            }
            onDel={onDel}
            rBak={rBak}
            key={i}
          ></MessagesBox>
        ))}
      </Panel>
    );
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

function MessagesBox({
  msg,
  chat,
  newMsgRef,
  rBak,
  onDel,
}: {
  msg: Message;
  chat?: ChatManagement;
  newMsgRef?: React.RefObject<HTMLInputElement>;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
}) {
  const { token } = theme.useToken();
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState(msg.text);
  return (
    <div
      ref={newMsgRef}
      style={{
        display: "flex",
        justifyContent: msg.virtualRoleId ? "flex-start" : "flex-end",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: msg.virtualRoleId ? "row" : "row-reverse",
        }}
      >
        <Avatar
          src={msg.virtualRoleId ? chat?.virtualRole.avatar : chat?.user.avatar}
          size={"large"}
          style={{ minWidth: "40px", minHeight: "40px" }}
          icon={<UserOutlined />}
        />
        <div
          style={{
            display: "flex",
            flex: edit ? 1 : undefined,
            maxWidth: "calc(100vw - 100px)",
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
              {msg.virtualRoleId ? chat?.virtualRole.name : chat?.user?.name}
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
              backgroundColor: token.colorFillContent,
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
                <MarkdownView markdown={msg.text} />
              )}
            </div>
            <div
              style={{
                display: "flex",
                borderTop: "1px solid #ccc3",
                justifyContent: "flex-end",
              }}
            >
              <span
                onClick={() => {
                  setEdit(false);
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ flex: 1 }}></span>
              {edit ? (
                <SaveOutlined
                  onClick={() => {
                    msg.text = message;
                    chat?.pushMessage(msg);
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
              <CopyToClipboard text={msg.text}>
                <CopyOutlined />
              </CopyToClipboard>
              <span style={{ marginLeft: "16px" }}></span>
              <RollbackOutlined
                style={{ cursor: "pointer" }}
                onClick={() => {
                  rBak(msg);
                }}
              />
              <span style={{ marginLeft: "30px" }}></span>
              <DeleteOutlined
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  onDel(msg);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
