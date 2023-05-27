import { ChatContext } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PauseOutlined,
  RollbackOutlined,
  SaveOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Checkbox,
  Input,
  message,
  Popconfirm,
  theme,
  Typography
} from "antd";
import copy from "copy-to-clipboard";
import React, { useContext, useState } from "react";
import { MarkdownView } from "./MarkdownView";

const MemoMarkdownView = React.memo(MarkdownView);
export const MessageItem = ({
  msg,
  renderMessage,
  rBak,
  onDel,
  onCite,
}: {
  msg: Message;
  renderMessage: { [key: string]: () => void };
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  onCite: (message: Message) => void;
}) => {
  const { chat, loadingMsgs } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [edit, setEdit] = useState(false);
  const [messageText, setMessage] = useState(msg.text);
  const [none, setNone] = useState([]);
  renderMessage[msg.id] = () => {
    setNone([]);
  };
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
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setEdit(false);
        }}
        style={{ flex: 1 }}
      ></span>
      {edit ? (
        <SaveOutlined
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            msg.text = messageText;
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
  if (msg.ctxRole === "system") {
    return (
      <div style={{ padding: "1em 32px", textAlign: "center" }} id={msg.id}>
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
            opacity: 0.7,
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
          size={54}
          // style={{ minWidth: "42px", minHeight: "42px" }}
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
                  value={messageText}
                  autoSize
                  style={{ marginBottom: "4px" }}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                />
              ) : (
                <MemoMarkdownView
                  menu={{
                    onClick: (e) => {
                      switch (e.key) {
                        case "1":
                          if (copy(messageText)) {
                            message.success("已复制");
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
