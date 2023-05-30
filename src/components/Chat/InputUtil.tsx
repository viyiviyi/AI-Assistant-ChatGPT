import { ApiClient } from "@/core/ApiClient";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { getHistoryMessage, send_message_to_channel } from "@/core/Slack";
import { scrollToBotton } from "@/core/utils";
import { Message } from "@/Models/DataBase";
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
const loadingTopic: { [key: string]: boolean } = {};
export function InputUtil() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(0);
  const { chat, activityTopic, setActivityTopic, loadingMsgs } =
    useContext(ChatContext);
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
    let topic = chat.getActivityTopic();
    if (!chat.config.activityTopicId) isNewTopic = true;
    if (!chat.topics.find((t) => t.id == chat.config.activityTopicId))
      isNewTopic = true;
    if (isNewTopic) {
      await chat.newTopic(text).then((_topic) => {
        topic = _topic;
        setActivityTopic(_topic);
      });
    }
    let topicId = topic.id;
    // 时间戳 每次使用加1 保证顺序不错
    let now = Date.now();
    let msg: Message = {
      id: "",
      groupId: chat.group.id,
      senderId: isBot ? undefined : chat.user.id,
      virtualRoleId: isBot ? chat.virtualRole.id : undefined,
      ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
      text: text,
      timestamp: now++,
      topicId: topicId,
    };
    let result: Message = {
      id: "",
      groupId: chat.group.id,
      virtualRoleId: chat.virtualRole.id,
      ctxRole: "assistant",
      text: "loading...",
      timestamp: now++,
      topicId: topicId,
    };
    let isContinue = false;
    try {
      // 阻止同时对同一个助理发起多个提问
      if (chat.config.enableVirtualRole && loadingTopic[result.virtualRoleId!])
        return (isContinue = true);
      loadingTopic[result.virtualRoleId!] = true;

      // 检查配置
      if (chat.config.botType === "Slack") {
        if (!chat.config.slackChannelId) {
          message.error("缺少频道ID，请在设置中配置后使用");
          return;
        }
      } else if (!KeyValueData.instance().getApiKey()) {
        message.error("缺少apikey，请在设置中配置后使用");
        return;
      }
      // 渲染并滚动到最新内容
      const rendAndScrollView = async (_msg?: Message, _result?: Message) => {
        if (_msg) msg = await chat.pushMessage(_msg);
        if (_result) result = await chat.pushMessage(_result);
        reloadTopic(result.topicId);
        if (msg.topicId == chat.config.activityTopicId)
          scrollToBotton(result.id, true);
      };
      // 接收消息的方法
      const onMessage = async (res: {
        error: boolean;
        text: string;
        end: boolean;
        thread_ts?: string; // 发送给claude的第一条消息的ts
        ts?: string; // claude回复的消息的ts
        send_ts?: string; // 回复claude的消息的ts
        stop?: () => void;
      }) => {
        if (!topic.slack_thread_ts && res.thread_ts) {
          topic.slack_thread_ts = res.thread_ts;
          chat.saveTopic(topic.id, topic.name, res.thread_ts);
        }
        if (!msg.slackTs && res.send_ts) {
          msg.slackTs = res.send_ts;
          await chat.pushMessage(msg);
        }
        if (res.text || res.ts) {
          result.text = res.text + (res.end ? "" : "\n\nloading...");
          result.slackTs = res.ts || result.slackTs;
          chat.pushMessage(result).then((r) => {
            result = r;
            if (res.end) {
              delete loadingMsgs[r.id];
              rendAndScrollView();
            } else {
              loadingMsgs[r.id] = {
                stop: () => {
                  try {
                    res.stop && res.stop();
                  } finally {
                    delete loadingMsgs[r.id];
                  }
                },
              };
            }
            reloadTopic(topicId, r.id);
          });
        }
      };
      // Claude模式时，新建话题的逻辑。当开启了助理模式时，先把助理设定发送给Claude
      if (
        isNewTopic &&
        chat.config.botType === "Slack" &&
        chat.config.enableVirtualRole
      ) {
        setLoading((v) => ++v);
        msg.text = ChatManagement.parseText(chat.virtualRole.bio);
        msg.virtualRoleId = undefined;
        msg.senderId = chat.user.id;
        rendAndScrollView(msg, result);
        await send_message_to_channel(
          chat.config.slackChannelId!,
          msg.text,
          onMessage,
          topic.slack_thread_ts
        );
        setLoading((v) => --v);
        return;
      }
      if (chat.config.botType === "Slack") {
        if (chat.config.enableVirtualRole && !topic.slack_thread_ts)
          return message.error("数据错误，请新建话题后使用");
      }
      setInputText("");
      setLoading((v) => ++v);
      if (chat.config.botType === "Slack") {
        if (msg.text) {
          rendAndScrollView(msg, result);
          await send_message_to_channel(
            chat.config.slackChannelId!,
            msg.text,
            onMessage,
            topic.slack_thread_ts
          );
        } else if (topic.slack_thread_ts) {
          // 如果发送空消息，则获取当前消息列最后一条消息之后的全部消息
          let oldTs: string = "0";
          if (topic.messages.length) {
            oldTs = topic.messages.slice(-1)[0].slackTs || "0";
          }
          await getHistoryMessage(
            chat.config.slackChannelId!,
            topic.slack_thread_ts,
            oldTs,
            topic.messages.length ? 100 : undefined
          ).then((res) => {
            Promise.all(
              res.map((v) => {
                return chat.pushMessage({
                  id: "",
                  groupId: chat.group.id,
                  senderId: v.isClaude ? undefined : chat.user.id,
                  virtualRoleId: v.isClaude ? chat.virtualRole.id : undefined,
                  ctxRole: v.isClaude ? "assistant" : "user",
                  text: v.text,
                  timestamp: v.ts ? Number(v.ts) * 1000 + 1 : now++,
                  topicId: topicId,
                  slackTs: v.ts,
                });
              })
            ).then(() => rendAndScrollView());
          });
        }
        setLoading((v) => --v);
        return;
      }
      rendAndScrollView(msg);
      if (isBot || skipRequest || chat.config.botType === "None")
        return setLoading((v) => --v);
      const messages = chat.getAskContext();
      if (messages.length == 0) {
        setLoading((v) => --v);
        return;
      }
      rendAndScrollView(undefined, result);
      await ApiClient.chatGpt({
        messages,
        model: chat.gptConfig.model,
        max_tokens: chat.gptConfig.max_tokens,
        top_p: chat.gptConfig.top_p,
        temperature: chat.gptConfig.temperature,
        n: chat.gptConfig.n,
        user: chat.getNameByRole(result.ctxRole),
        apiKey: KeyValueData.instance().getApiKey(),
        baseUrl:
          chat.config.botType === "GPTFree"
            ? "https://chat-free.22733.site"
            : chat.config.baseUrl || undefined,
        onMessage: onMessage,
      });
    } finally {
      delete loadingTopic[result.virtualRoleId!];
    }
    if (isContinue) loadingTopic[result.virtualRoleId!] = true;
    setTimeout(() => {
      setLoading((v) => --v);
      reloadTopic(result.topicId, result.id);
      if (msg.topicId == chat.config.activityTopicId)
        scrollToBotton(result.id, true);
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
