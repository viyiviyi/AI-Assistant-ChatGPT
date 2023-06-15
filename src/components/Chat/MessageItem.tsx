import { useService } from "@/core/AiService/ServiceProvider";
import { ChatContext } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import style from "@/styles/index.module.css";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  PauseOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Checkbox,
  Divider,
  Input,
  message,
  Popconfirm,
  Space,
  theme
} from "antd";
import copy from "copy-to-clipboard";
import React, { useContext, useEffect, useState } from "react";
import { MarkdownView } from "./MarkdownView";

const MemoMarkdownView = React.memo(MarkdownView);
export const MessageItem = ({
  msg,
  renderMessage,
  rBak,
  onDel,
  onCite,
  onPush,
  onSned,
}: {
  msg: Message;
  renderMessage: { [key: string]: () => void };
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  onCite: (message: Message) => void;
  onPush: () => void;
  onSned: () => void;
}) => {
  const { chat, loadingMsgs, reloadNav } = useContext(ChatContext);
  const { aiService } = useService();
  const { token } = theme.useToken();
  const [edit, setEdit] = useState(false);
  const [messageText, setMessage] = useState("");
  const [none, setNone] = useState([]);
  useEffect(() => {
    renderMessage[msg.id] = () => {
      setNone([]);
    };
    return () => {
      delete renderMessage[msg.id];
    };
  }, [renderMessage, msg]);
  const utilsEle = (
    <>
      <Checkbox
        disabled={!aiService?.customContext}
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
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setEdit(false);
        }}
        style={{ flex: 1 }}
      ></span>
      {edit ? (
        <SaveOutlined
          onMouseDown={(e) => e.preventDefault()}
          onClick={async () => {
            const isReloadNav =
              /^#{1,5}\s/.test(msg.text) || /^#{1,5}\s/.test(messageText);
            msg.text = messageText;
            await chat.pushMessage(msg);
            var topic = chat.topics.find((f) => f.id === msg.topicId);
            if (topic && isReloadNav) reloadNav(topic);
            setEdit(false);
          }}
          style={{ marginLeft: "16px" }}
        />
      ) : (
        <></>
      )}
      <span style={{ marginLeft: "16px" }}></span>
      <EditOutlined
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (!edit) setMessage(msg.text);
          setEdit(!edit);
        }}
      />
      <span style={{ marginLeft: "16px" }}></span>
      <CopyOutlined
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (copy(msg.text.toString())) {
            message.success("已复制");
          }
        }}
      />
      <span style={{ marginLeft: "16px" }}></span>
      <RollbackOutlined
        onMouseDown={(e) => e.preventDefault()}
        style={{ cursor: "pointer" }}
        onClick={() => {
          rBak(msg);
        }}
      />
      <span style={{ marginLeft: "30px" }}></span>
      {loadingMsgs[msg.id] ? (
        <Popconfirm
          title="确定停止？"
          onConfirm={() => {
            loadingMsgs[msg.id]?.stop();
          }}
          okText="确定"
          cancelText="取消"
        >
          <PauseOutlined style={{ color: "#ff8d8f" }}></PauseOutlined>
        </Popconfirm>
      ) : (
        <Popconfirm
          title="确定删除？"
          onConfirm={() => {
            onDel(msg);
          }}
          okText="确定"
          cancelText="取消"
        >
          <DeleteOutlined style={{ color: "#ff8d8f" }}></DeleteOutlined>
        </Popconfirm>
      )}
    </>
  );
  const Extend = (
    <div className={style.message_extend_but}>
      <Divider style={{ margin: 0 }}>
        <Space size={6}>
          {aiService?.customContext && (
            <Button
              shape="circle"
              type="text"
              icon={<MessageOutlined />}
              onClick={onSned}
            ></Button>
          )}
          <Button
            shape="circle"
            type="text"
            icon={<PlusOutlined />}
            onClick={onPush}
          ></Button>
        </Space>
      </Divider>
    </div>
  );
  if (msg.ctxRole === "system") {
    return (
      <div
        style={{
          padding: "1em 42px 0",
          textAlign: "center",
        }}
        id={msg.id}
        className={style.message_box}
      >
        <div>
          {edit ? (
            <Input.TextArea
              value={messageText}
              autoSize
              style={{ marginBottom: "4px" }}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
          ) : (
            <MemoMarkdownView
              markdown={
                chat.config.disableStrikethrough
                  ? ("系统：" + msg.text).replaceAll("~", "～")
                  : "系统：" + msg.text
              }
            />
            // <Typography.Text type="secondary">
            //   {"系统：" + msg.text}
            // </Typography.Text>
          )}
        </div>
        <div
          style={{
            display: "flex",
            borderTop: "1px solid #ccc3",
            justifyContent: "flex-end",
            padding: "5px 5px",
            opacity: 0.7,
          }}
        >
          {utilsEle}
        </div>
        {Extend}
      </div>
    );
  }
  return (
    <div
      className={style.message_box}
      style={{
        display: "flex",
        justifyContent: msg.virtualRoleId ? "flex-start" : "flex-end",
        position: "relative",
        flexDirection: "column",
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
          size={54}
          // style={{ minWidth: "42px", minHeight: "42px" }}
          icon={<UserOutlined />}
        />
        {/* {min(calc(max(1200px, 100vw) - calc(250px + max(min(50px,100vw - 1195px),5px))), calc(100vw - 100px))} */}
        <div
          className={style.message_item}
          style={{
            display: "flex",
            flex: edit ? 1 : undefined,
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
            <span style={{ marginLeft: "30px" }}></span>
            {loadingMsgs[msg.id] ? (
              <Popconfirm
                title="确定停止？"
                onConfirm={() => {
                  loadingMsgs[msg.id]?.stop();
                }}
                okText="确定"
                cancelText="取消"
              >
                <PauseOutlined style={{ color: "#ff8d8f" }}></PauseOutlined>
              </Popconfirm>
            ) : (
              <></>
            )}
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
              lineHeight: 1.7,
            }}
          >
            <div>
              {edit ? (
                <Input.TextArea
                  value={messageText}
                  autoSize
                  style={{ marginBottom: "4px" }}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                />
              ) : (
                <MemoMarkdownView
                  markdown={
                    chat.config.disableStrikethrough
                      ? msg.text.replaceAll("~", "～")
                      : msg.text
                  }
                />
              )}
            </div>
            <div
              className=""
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
      {!loadingMsgs[msg.id] && Extend}
    </div>
  );
};

export const MemoMessageItem = React.memo(MessageItem);
