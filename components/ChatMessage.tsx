import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { MarkdownView } from "./MarkdownView";
// import style from "../styles/index.module.css";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Message, Topic } from "@/Models/DataBase";
import { ChatManagement } from "@/core/ChatManagement";
import { Avatar, Collapse, Input, theme } from "antd";
import { CaretRightOutlined, UserOutlined } from "@ant-design/icons";
import React from "react";
function scrollToBotton(dom: HTMLElement) {
  dom.scrollIntoView({ behavior: 'smooth' });
}
const { Panel } = Collapse;
export const ChatMessage = ({
  chat,
  rBak,
  onDel,
}: {
  chat?: ChatManagement;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
}) => {
  const { token } = theme.useToken();
  const [activityKey, setActivityKey] = useState("");
  const newMsgRef = React.createRef<HTMLInputElement>();
  useEffect(() => {
    if (newMsgRef != null && newMsgRef.current != null)
      scrollToBotton(newMsgRef.current);
  }, [newMsgRef]);
  if (!chat) return <></>;
  function rendTopic(topic: Topic, idx: number) {
    let messages = chat?.getMessages().filter((f) => f.topicId === topic.id);
    if (messages?.length) {
      return (
        <Panel
          header={
            <div
              onClick={(e) => {
                e.stopPropagation();
                chat!.activityTopicId = topic.id;
                console.log(chat!.activityTopicId);
                setActivityKey(chat!.activityTopicId);
              }}
            >
              {topic.name + " " + topic.createdAt.toLocaleString()}
            </div>
          }
          key={topic.id}
          style={{
            marginBottom: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            border: "none",
          }}
        >
          {chat
            ?.getMessages()
            .filter((f) => f.topicId === topic.id)
            .map((v, i) => (
              <MessagesBox
                msg={v}
                chat={chat}
                newMsgRef={
                  topic.id == chat.activityTopicId && i == messages!.length - 1
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
    return <div key={idx}></div>;
  }

  return (
    <Collapse
      ghost
      accordion
      bordered={false}
      activeKey={activityKey}
      defaultActiveKey={chat.activityTopicId}
      expandIcon={({ isActive }) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
      )}
    >
      {chat.topic.map(rendTopic)}
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
          style={{ width: "32px", height: "32px" }}
          icon={<UserOutlined />}
        />
        <div
          style={{
            display: "flex",
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
                    chat?.setMessage(msg);
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
