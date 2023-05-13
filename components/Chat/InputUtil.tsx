import { ApiClient } from "@/core/ApiClient";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { scrollToBotton } from "@/core/utils";
import style from "@/styles/index.module.css";
import {
  CommentOutlined,
  MessageOutlined,
  VerticalAlignMiddleOutlined
} from "@ant-design/icons";
import { Button, Input, message, theme, Typography } from "antd";
import React, { useContext, useState } from "react";
import { MessageContext } from "./Chat";
import { reloadTopic } from "./ChatMessage";

const inputRef = React.createRef<HTMLInputElement>();
const objs = { setInput: (s: string | ((s: string) => string)) => {} };
export function useInput() {
  return {
    inputRef,
    setInput: (s: string | ((s: string) => string)) => {
      return objs.setInput(s);
    },
  };
}
export function InputUtil() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(0);
  const { chat, activityTopic, setActivityTopic } = useContext(ChatContext);
  const { onlyOne, setOnlyOne, closeAll, setCloasAll } =
    useContext(MessageContext);
  const { token } = theme.useToken();
  objs.setInput = setInputText;
  /**
   * 提交内容
   * @param isNewTopic 是否开启新话题
   * @returns
   */
  const onSubmit = async function (isNewTopic: boolean) {
    let text = inputText.trim();
    const isBot = text.startsWith("/");
    const isSys = text.startsWith("/::") || text.startsWith("::");
    const skipRequest = text.startsWith("\\");
    text = ChatManagement.parseText(text);
    if (!chat.config.activityTopicId) isNewTopic = true;
    if (isNewTopic) {
      await chat.newTopic(text).then((topic) => {
        setActivityTopic(topic);
      });
    }
    let topicId = chat.config.activityTopicId;
    const msg = await chat.pushMessage({
      id: "",
      groupId: chat.group.id,
      senderId: isBot ? undefined : chat.user.id,
      virtualRoleId: isBot ? chat.virtualRole.id : undefined,
      ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
      text: text,
      timestamp: Date.now(),
      topicId: topicId,
    });
    topicId = msg.topicId;
    setInputText("");
    if (topicId == chat.config.activityTopicId) scrollToBotton(msg.id);
    reloadTopic(msg.topicId);
    if (isBot || skipRequest || chat.config.disableChatGPT) return;
    setLoading((v) => ++v);
    const messages = chat.getAskContext();
    if (messages.length == 0) {
      setLoading((v) => --v);
      reloadTopic(topicId);
      return;
    }
    let result = await chat.pushMessage({
      id: "",
      groupId: chat.group.id,
      virtualRoleId: chat.virtualRole.id,
      ctxRole: "assistant",
      text: "loading...",
      timestamp: Date.now(),
      topicId: topicId,
    });
    if (result.timestamp == msg.timestamp) result.timestamp += 1;
    reloadTopic(result.topicId);
    if (msg.topicId == chat.config.activityTopicId) scrollToBotton(result.id);
    try {
      if (KeyValueData.instance().getApiKey()) {
        const res = await ApiClient.chatGpt({
          messages,
          model: chat.gptConfig.model,
          max_tokens: chat.gptConfig.max_tokens,
          top_p: chat.gptConfig.top_p,
          temperature: chat.gptConfig.temperature,
          n: chat.gptConfig.n,
          user: chat.getNameByRole(result.ctxRole),
          apiKey: KeyValueData.instance().getApiKey(),
          baseUrl: chat.config.baseUrl || undefined,
        });
        result.text = res;
        await chat.pushMessage(result);
      } else {
        message.error("缺少apikey，请在设置中配置后使用");
      }
    } catch (error: any) {
      result.text = String(error);
      await chat.pushMessage(result);
    }
    setTimeout(() => {
      setLoading((v) => --v);
      reloadTopic(result.topicId);
      if (msg.topicId == chat.config.activityTopicId) scrollToBotton(result.id);
    }, 500);
  };

  const onTextareaTab = (
    start: number,
    end: number,
    textarea: EventTarget & HTMLTextAreaElement
  ) => {
    setInputText((v) => v.substring(0, start) + "    " + v.substring(start));
    setTimeout(() => {
      textarea.selectionStart = start + 4;
      textarea.selectionEnd = end + 4;
    }, 0);
  };

  return (
    <>
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOnlyOne(!onlyOne);
            }}
          >
            {activityTopic?.name}
          </Typography.Text>
          <span style={{ flex: 1 }}></span>
          <Button
            shape="round"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              setOnlyOne(false);
              setCloasAll(!closeAll);
            }}
          >
            <CommentOutlined />
            <VerticalAlignMiddleOutlined />
          </Button>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={<CommentOutlined />}
            onClick={() => {
              onSubmit(true);
            }}
          ></Button>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={<MessageOutlined />}
            onClick={() => {
              onSubmit(false);
            }}
          ></Button>
        </div>
        <div style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="/开头代替AI发言 ::开头发出系统内容"
            autoSize={{ maxRows: 10 }}
            allowClear
            ref={inputRef}
            autoFocus={false}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyUp={(e) =>
              (e.key === "s" && e.altKey && onSubmit(false)) ||
              (e.key === "Enter" && e.ctrlKey && onSubmit(true))
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
    </>
  );
}
