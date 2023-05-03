import { ChatMessage, scrollToBotton } from "@/components/ChatMessage";
import { ApiClient } from "@/core/ApiClient";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { Message } from "@/Models/DataBase";
import {
  CommentOutlined,
  MessageOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  VerticalAlignMiddleOutlined
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Input,
  Layout,
  message,
  theme,
  Typography
} from "antd";
import React, { useContext, useState } from "react";
import style from "../styles/index.module.css";

const { Content } = Layout;

export const Chat = ({
  togglelistIsShow,
  toggleSettingShow,
  toggleRoleConfig,
}: {
  togglelistIsShow: () => void;
  toggleSettingShow: () => void;
  toggleRoleConfig: () => void;
}) => {
  const inputRef = React.createRef<HTMLInputElement>();
  const { token } = theme.useToken();
  const { chat, activityTopic } = useContext(ChatContext);
  const [loading, setLoading] = useState(0);
  const [messageInput, setmessageInput] = useState("");
  const [onlyOne, setOnlyOne] = useState(false);
  const [none, setNone] = useState([]);
  function deleteChatMsg(msg: Message): void {
    chat.removeMessage(msg)?.then(() => {
      setNone([]);
    });
  }

  /**
   * 提交内容
   * @param isPush 是否对话模式
   * @returns
   */
  async function onSubmit(isPush: boolean) {
    let text = messageInput.trim();
    const isBot = text.startsWith("/");
    const isSys = text.startsWith("/::") || text.startsWith("::");
    const skipRequest = text.startsWith("\\");
    text = ChatManagement.parseText(text);
    if (!isPush) await chat.newTopic(text);
    if (!chat.config.activityTopicId) await chat.newTopic(text);
    await chat.pushMessage({
      id: "",
      groupId: chat.group.id,
      senderId: isBot ? undefined : chat.user.id,
      virtualRoleId: isBot ? chat.virtualRole.id : undefined,
      ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
      text: text,
      timestamp: Date.now(),
      topicId: chat.config.activityTopicId,
    });
    setmessageInput("");
    scrollToBotton();
    if (isBot || skipRequest) return;
    setLoading((v) => ++v);
    await sendMessage(chat);
    setTimeout(() => {
      setLoading((v) => --v);
      scrollToBotton();
    }, 500);
  }
  let closeAllTopic: () => void = () => {};
  const onTextareaTab = (
    start: number,
    end: number,
    textarea: EventTarget & HTMLTextAreaElement
  ) => {
    setmessageInput((v) => v.substring(0, start) + "    " + v.substring(start));
    setTimeout(() => {
      textarea.selectionStart = start + 4;
      textarea.selectionEnd = end + 4;
    }, 0);
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        width: "100%",
        maxHeight: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          flexWrap: "nowrap",
          gap: "16px",
          width: "100%",
          justifyContent: "flex-end",
          display: "flex",
          alignItems: "center",
          marginBottom: "3px",
          padding: "10px",
          borderRadius:
            "0" +
            " 0 " +
            token.borderRadius +
            "px " +
            token.borderRadius +
            "px",
          backgroundColor: token.colorFillContent,
        }}
      >
        <Avatar
          onClick={toggleRoleConfig}
          size={32}
          style={{ minWidth: "32px", minHeight: "32px" }}
          src={chat?.virtualRole.avatar}
        ></Avatar>
        <Typography.Text ellipsis onClick={toggleSettingShow}>
          {chat?.group.name}
        </Typography.Text>
        <span style={{ flex: 1 }}></span>
        <UserAddOutlined onClick={() => toggleRoleConfig()} />
        <SettingOutlined
          onClick={() => toggleSettingShow()}
          style={{ marginLeft: "10px" }}
        />
        <UnorderedListOutlined
          onClick={() => {
            togglelistIsShow();
          }}
          style={{ marginLeft: "10px", marginRight: "10px" }}
        />
      </div>
      <Content
        id="content"
        style={{
          overflow: "auto",
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
        }}
      >
        <ChatMessage
          onlyOne={onlyOne}
          onDel={(m) => {
            deleteChatMsg(m);
          }}
          rBak={(v) => {
            setmessageInput(
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
          }}
          handerCloseAll={(cb) => (closeAllTopic = cb)}
        />
      </Content>
      <div className={style.loading}>
        {loading ? (
          <div className={style.loading}>
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                style={{ backgroundColor: token.colorPrimary }}
                className={style.loadingBar}
              ></div>
            ))}
          </div>
        ) : (
          <div className={style.loading}></div>
        )}
      </div>
      <div
        style={{
          width: "100%",
          padding: "0px 10px 10px",
          marginBottom: "15px",
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
        }}
      >
        <div
          style={{
            flexWrap: "nowrap",
            gap: "16px",
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
            alignItems: "center",
            marginBottom: "3px",
          }}
        >
          <Typography.Text
            style={{
              cursor: "pointer",
              color: onlyOne ? token.colorPrimary : undefined,
            }}
            ellipsis={true}
            onClick={() => {
              setOnlyOne((v) => !v);
            }}
          >
            {activityTopic?.name}
          </Typography.Text>
          <span style={{ flex: 1 }}></span>
          <Button
            shape="round"
            onClick={() => {
              setOnlyOne(false);
              closeAllTopic();
            }}
          >
            <CommentOutlined />
            <VerticalAlignMiddleOutlined />
          </Button>
          <Button
            shape="circle"
            size="large"
            icon={<CommentOutlined />}
            onClick={() => onSubmit(false)}
          ></Button>

          <Button
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={() => onSubmit(true)}
          ></Button>
        </div>
        <div style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="/开头代替AI发言 ::开头发出系统内容"
            autoSize={{ maxRows: 10 }}
            allowClear
            ref={inputRef}
            autoFocus={true}
            value={messageInput}
            onChange={(e) => setmessageInput(e.target.value)}
            onKeyUp={(e) =>
              (e.key === "s" && e.altKey && onSubmit(true)) ||
              (e.key === "Enter" && e.ctrlKey && onSubmit(false))
            }
            onKeyDown={(e) =>
              e.key === "Tab" &&
              (e.preventDefault(),
              onTextareaTab(
                e.currentTarget?.selectionStart,
                e.currentTarget?.selectionEnd,
                e.currentTarget
              ))
            }
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 提交内容
 * @param isPush 是否对话模式
 * @returns
 */
async function sendMessage(chat: ChatManagement) {
  const messages = chat.getAskContext();
  if (messages.length == 0) return;
  let topicId = chat.config.activityTopicId;
  let msg = await chat.pushMessage({
    id: "",
    groupId: chat.group.id,
    virtualRoleId: chat.virtualRole.id,
    ctxRole: "assistant",
    text: "loading...",
    timestamp: Date.now(),
    topicId: topicId,
  });
  try {
    if (KeyValueData.instance().getApiKey()) {
      const res = await ApiClient.chatGpt({
        messages,
        model: chat.gptConfig.model,
        max_tokens: chat.gptConfig.max_tokens,
        top_p: chat.gptConfig.top_p,
        temperature: chat.gptConfig.temperature,
        n: chat.gptConfig.n,
        user: chat.getNameByRole(msg.ctxRole),
        apiKey: KeyValueData.instance().getApiKey(),
        baseUrl: chat.config.baseUrl || undefined,
      });
      msg.text = res;
      return chat.pushMessage(msg);
    } else if ("https://chat.openai.com" == chat.config.baseUrl) {
      const res = await ApiClient.sendChatMessage({ messages });
      return chat.pushMessage({
        id: "",
        groupId: chat.group.id,
        virtualRoleId: chat.virtualRole.id,
        ctxRole: "assistant",
        text: res,
        timestamp: Date.now(),
        topicId: topicId,
      });
    }
    message.error("缺少apikey，请在设置中配置后使用");
  } catch (error: any) {
    msg.text = String(error);
    chat.pushMessage(msg);
  }
}
