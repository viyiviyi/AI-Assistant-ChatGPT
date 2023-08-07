import { useService } from "@/core/AiService/ServiceProvider";
import { ChatContext } from "@/core/ChatManagement";
import {
  onTextareaTab,
  scrollStatus,
  scrollToTop,
  stopScroll
} from "@/core/utils";
import { CtxRole, Message } from "@/Models/DataBase";
import styleCss from "@/styles/index.module.css";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  PauseOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Checkbox,
  Divider,
  Input,
  message,
  Popconfirm,
  Segmented,
  Space,
  theme
} from "antd";
import { TextAreaRef } from "antd/es/input/TextArea";
import copy from "copy-to-clipboard";
import Image from "next/image";
import React, {
  createRef,
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { SkipExport } from "../SkipExport";
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
  style,
}: {
  msg: Message;
  renderMessage: { [key: string]: () => void };
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  onCite: (message: Message) => void;
  onPush: () => void;
  onSned: () => void;
  style?: CSSProperties | undefined;
}) => {
  const { chat, loadingMsgs, reloadNav } = useContext(ChatContext);
  const { aiService } = useService();
  const { token } = theme.useToken();
  const [edit, setEdit] = useState(false);
  const [messageText, setMessage] = useState("");
  const [inputRef] = useState(createRef<TextAreaRef>());
  const [none, setNone] = useState([]);
  const [ctxRole, setCtxRole] = useState(msg.ctxRole);
  useEffect(() => {
    renderMessage[msg.id] = () => {
      setNone([]);
    };
    return () => {
      delete renderMessage[msg.id];
    };
  }, [renderMessage, msg]);
  const saveMsg = useCallback(async () => {
    const isReloadNav =
      /^#{1,5}\s/.test(msg.text) || /^#{1,5}\s/.test(messageText);
    msg.text = messageText;
    msg.ctxRole = ctxRole;
    await chat.pushMessage(msg);
    var topic = chat.topics.find((f) => f.id === msg.topicId);
    if (topic && isReloadNav) reloadNav(topic);
    setEdit(false);
  }, [chat, setEdit, reloadNav, messageText, msg, ctxRole]);
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
        <span>
          {new Date(msg.updateTime || msg.timestamp).toLocaleTimeString()}
        </span>
      </Checkbox>
      <span
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setEdit(false);
        }}
        style={{ flex: 1 }}
      ></span>
      {edit ? (
        <SkipExport>
          <SaveOutlined
            onMouseDown={(e) => e.preventDefault()}
            onClick={saveMsg}
            style={{ marginLeft: "16px" }}
          />
        </SkipExport>
      ) : (
        <></>
      )}
      <span style={{ marginLeft: "16px" }}></span>
      <SkipExport>
        <EditOutlined
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!edit) setMessage(msg.text);
            setEdit(!edit);
            stopScroll();
            scrollStatus.enableTop = true;
            scrollToTop(msg.id);
          }}
        />
      </SkipExport>
      <span style={{ marginLeft: "16px" }}></span>
      <SkipExport>
        <CopyOutlined
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (copy(msg.text.toString())) {
              message.success("已复制");
            }
          }}
        />
      </SkipExport>
      <span style={{ marginLeft: "16px" }}></span>
      <SkipExport>
        {" "}
        <RollbackOutlined
          onMouseDown={(e) => e.preventDefault()}
          style={{ cursor: "pointer" }}
          onClick={() => {
            rBak(msg);
          }}
        />
      </SkipExport>
      <span style={{ marginLeft: "30px" }}></span>
      {loadingMsgs[msg.id] ? (
        <SkipExport>
          <Popconfirm
            title="确定停止？"
            onConfirm={() => {
              if (typeof loadingMsgs[msg.id]?.stop == "function")
                loadingMsgs[msg.id]?.stop();
            }}
            okText="确定"
            cancelText="取消"
          >
            <PauseOutlined style={{ color: "#ff8d8f" }}></PauseOutlined>
          </Popconfirm>
        </SkipExport>
      ) : (
        <SkipExport>
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
        </SkipExport>
      )}
    </>
  );
  const Extend = (
    <div className={styleCss.message_extend_but} style={{ ...style }}>
      <Divider style={{ margin: 0 }}>
        <Space size={6}>
          {aiService?.customContext && (
            <Button
              shape="circle"
              type="text"
              icon={
                <SkipExport>
                  <MessageOutlined />
                </SkipExport>
              }
              onClick={onSned}
            ></Button>
          )}
          <Button
            shape="circle"
            type="text"
            icon={
              <SkipExport>
                <PlusOutlined />
              </SkipExport>
            }
            onClick={onPush}
          ></Button>
        </Space>
      </Divider>
    </div>
  );
  const Content = (
    <div>
      {edit ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Segmented
              value={ctxRole}
              style={{ marginBottom: 5 }}
              onChange={(val) => {
                setCtxRole(val as CtxRole);
              }}
              options={[
                { label: "助理", value: "assistant" },
                { label: "系统", value: "system" },
                { label: "用户", value: "user" },
              ]}
            />
            <Button.Group>
              <Button onClick={saveMsg}>保存</Button>
              <Button
                onClick={() =>
                  saveMsg().then(() => {
                    onSned();
                  })
                }
              >
                保存并提交
              </Button>
            </Button.Group>
          </div>
          <Input.TextArea
            value={messageText}
            autoSize={{ maxRows: 10 }}
            style={{ marginBottom: "4px" }}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "s" && e.ctrlKey) {
                e.preventDefault();
                saveMsg();
              }
              if (e.key === "Tab") {
                e.preventDefault();
                setMessage((v) =>
                  onTextareaTab(
                    v,
                    e.currentTarget?.selectionStart,
                    e.currentTarget?.selectionEnd,
                    e.currentTarget,
                    e.shiftKey
                  )
                );
              }
            }}
            onFocus={(e) => {
              e.target.selectionStart = msg.text.length;
              e.target.selectionEnd = msg.text.length;
            }}
            ref={inputRef}
            autoFocus={true}
          />
        </>
      ) : (
        <MemoMarkdownView
          markdown={
            chat.config.disableStrikethrough
              ? msg.text.replaceAll("~", "～")
              : msg.text
          }
          doubleClick={() => {
            setMessage(msg.text);
            setEdit(true);
            stopScroll();
            scrollStatus.enableTop = true;
            scrollToTop(msg.id);
          }}
        />
      )}
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
        className={styleCss.message_box}
      >
        {Content}
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
      className={
        styleCss.message_box + (chat.config.limitPreHeight ? " limt-hight" : "")
      }
      style={{
        display: "flex",
        justifyContent: msg.ctxRole == "assistant" ? "flex-start" : "flex-end",
        position: "relative",
        flexDirection: "column",
      }}
      id={msg.id}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: msg.ctxRole == "assistant" ? "row" : "row-reverse",
        }}
      >
        <Avatar
          src={
            msg.ctxRole == "assistant"
              ? chat.virtualRole.avatar || undefined
              : chat.user.avatar || undefined
          }
          style={{ width: 54, height: 54 }}
          size={54}
          icon={<Image width={54} height={54} src={"/logo.png"} alt="logo" />}
        />
        <div
          className={styleCss.message_item}
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
              flexDirection: msg.ctxRole == "assistant" ? "row" : "row-reverse",
            }}
          >
            <span>
              {msg.ctxRole == "assistant"
                ? chat.virtualRole.name
                : chat.user?.name}
            </span>
            <span style={{ marginLeft: "30px" }}></span>
            {loadingMsgs[msg.id] ? (
              <SkipExport>
                <Popconfirm
                  title="确定停止？"
                  onConfirm={() => {
                    if (typeof loadingMsgs[msg.id]?.stop == "function")
                      loadingMsgs[msg.id]?.stop();
                    else delete loadingMsgs[msg.id];
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <PauseOutlined style={{ color: "#ff8d8f" }}></PauseOutlined>
                </Popconfirm>
              </SkipExport>
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
            {Content}
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
