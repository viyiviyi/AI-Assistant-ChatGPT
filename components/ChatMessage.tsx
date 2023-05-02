import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { Message, Topic } from "@/Models/DataBase";
import {
  CaretRightOutlined,
  CopyOutlined,
  DeleteOutlined,
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
  Popconfirm,
  theme,
  Typography
} from "antd";
import copy from "copy-to-clipboard";
import React, { useContext, useEffect, useState } from "react";
import { MarkdownView } from "./MarkdownView";

const { Panel } = Collapse;

export const lastMsgRef: { ref?: React.RefObject<HTMLDivElement> } = {};

export const ChatMessage = ({
  onlyOne,
  rBak,
  onDel,
  handerCloseAll,
}: {
  onlyOne?: boolean;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  handerCloseAll: (closeAll: () => void) => void;
}) => {
  const { token } = theme.useToken();
  const { chat } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState(
    chat ? [...chat.topics.map((v) => v.id)] : []
  );
  const [closeAll, setCloasAll] = useState(true);
  handerCloseAll(() => {
    if (closeAll) {
      setActivityKey([]);
      setCloasAll(false);
    } else {
      setCloasAll(true);
    }
  });

  function onClickTopicTitle(
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
      v = v.filter((f) => f !== topic.id);
      chat!.config.activityTopicId = chat?.topics.slice(-1)[0].id || "";
      ChatManagement.loadMessage(chat!.topics.slice(-1)[0]).then(() => {
        setActivityKey(v);
      });
    } else {
      chat!.config.activityTopicId = topic.id;
      v.push(topic.id);
      ChatManagement.loadMessage(topic).then(() => {
        setActivityKey(v);
      });
    }
  }
  if (!chat) return <></>;
  function rendTopic(topic: Topic & { messages: Message[] }, idx: number) {
    return (
      <Panel
        header={
          <div style={{ display: "flex" }}>
            <Typography.Title
              editable={{
                onChange: (e) => {
                  chat?.saveTopic(topic.id, e);
                  setActivityKey([...activityKey]);
                },
              }}
              level={5}
              onClick={(e) => {
                e.stopPropagation();
                onClickTopicTitle(topic);
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
        {(activityKey.includes(topic.id) ||
          topic.id == chat?.config.activityTopicId) &&
          topic.messages.map((v, i) => {
            return (
              <MessagesBox
                msg={v}
                onDel={onDel}
                isLast={
                  i === topic.messages.length - 1 &&
                  topic.id == chat?.config.activityTopicId
                }
                rBak={rBak}
                key={i}
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
              onDel={onDel}
              isLast={i === topic!.messages.length - 1}
              rBak={rBak}
              key={i}
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
  isLast,
  rBak,
  onDel,
}: {
  msg: Message;
  isLast?: boolean;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
}) => {
  const { chat } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState(msg.text);
  const newMsgRef = React.createRef<HTMLDivElement>();
  const [none, setNone] = useState([]);
  useEffect(() => {
    if (isLast) lastMsgRef.ref = newMsgRef;
  }, [newMsgRef, isLast]);
  const utilsEle = (
    <>
      {" "}
      <Checkbox
        checked={msg.checked || false}
        onChange={(e) => {
          msg.checked = e.target.checked;
          chat?.pushMessage(msg);
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
      <CopyOutlined
        onClick={() => {
          copy(msg.text.toString());
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
      <DeleteOutlined
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          onDel(msg);
        }}
      />
    </>
  );
  if (msg.ctxRole === "system") {
    return (
      <div ref={newMsgRef} style={{ padding: "1em 64px", textAlign: "center" }}>
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
          }}
        >
          {utilsEle}
        </div>
      </div>
    );
  }
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
                  markdown={
                    chat?.config.disableStrikethrough
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
