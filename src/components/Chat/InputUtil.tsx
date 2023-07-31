import { aiServices } from "@/core/AiService/ServiceProvider";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { loadingMessages, useScreenSize } from "@/core/hooks";
import {
  getUuid,
  onTextareaTab,
  scrollStatus,
  scrollToBotton,
  scrollToTop,
  stopScroll,
} from "@/core/utils";
import { Message } from "@/Models/DataBase";
import style from "@/styles/index.module.css";
import {
  AlignLeftOutlined,
  CommentOutlined,
  MessageOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Space, theme, Tooltip, Typography } from "antd";
import React, { useCallback, useContext, useState } from "react";
import { MemoBackgroundImage } from "../BackgroundImage";
import { MessageContext } from "./Chat";
import { reloadTopic } from "./MessageList";
import { MemoNavigation } from "./Navigation";

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
  const [showNav, setShowNav] = useState(false);
  const { chat, activityTopic, setActivityTopic, loadingMsgs, reloadNav } =
    useContext(ChatContext);
  const { onlyOne, setOnlyOne, closeAll, setCloasAll } =
    useContext(MessageContext);
  const { token } = theme.useToken();
  const screenSize = useScreenSize();
  objs.setInput = setInputText;
  /**
   * 提交内容
   * @param isNewTopic 是否开启新话题
   * @returns
   */
  const onSubmit = useCallback(
    async function (isNewTopic: boolean) {
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
      if (!topic) return;
      let topicId = topic.id;
      // 时间戳 每次使用加1 保证顺序不错
      let now = Date.now();
      let msg: Message = {
        id: "",
        groupId: chat.group.id,
        ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
        text: text,
        timestamp: now++,
        topicId: topicId,
        cloudTopicId: topic.cloudTopicId,
      };
      let result: Message = {
        id: getUuid(),
        groupId: chat.group.id,
        ctxRole: "assistant",
        text: "loading...",
        timestamp: now++,
        topicId: topicId,
      };
      // 防止使用为完成的上下文发起提问
      if (
        topic.messages
          .slice(-chat.gptConfig.msgCount)
          .findIndex((f) => loadingMessages[f.id]) != -1
      )
        return;
      loadingMessages[result.id] = true;

      scrollStatus.enable = true;
      try {
        // 渲染并滚动到最新内容
        const rendAndScrollView = async (_msg?: Message, _result?: Message) => {
          if (_msg) msg = await chat.pushMessage(_msg);
          if (_result) result = await chat.pushMessage(_result);
          reloadTopic(result.topicId);
          if (msg.topicId == chat.config.activityTopicId)
            scrollToBotton(result.id || msg.id);
        };
        const aiService = aiServices.current;
        if (isBot || skipRequest || !aiService) {
          setInputText("");
          await rendAndScrollView(msg);
          if (/^#{1,5}\s/.test(msg.text) || /^#{1,5}\s/.test(result.text))
            reloadNav(topic);
          return;
        }
        // 接收消息的方法
        let isFirst = true;
        const onMessage = async (res: {
          error: boolean;
          text: string;
          end: boolean;
          cloud_topic_id?: string;
          cloud_send_id?: string;
          cloud_result_id?: string;
          stop: () => void;
        }) => {
          if (!topic) return;
          if (!topic.cloudTopicId && res.cloud_topic_id) {
            topic.cloudTopicId = res.cloud_topic_id;
            msg.cloudTopicId = res.cloud_topic_id;
            result.cloudTopicId = res.cloud_topic_id;
            chat.saveTopic(topic.id, topic.name, res.cloud_topic_id);
          }
          if (!msg.cloudMsgId && res.cloud_send_id) {
            msg.cloudMsgId = res.cloud_send_id;
            await chat.pushMessage(msg);
          }
          result.text = res.text + (res.end ? "" : "\n\nloading...");
          result.cloudMsgId = res.cloud_result_id || result.cloudMsgId;
          if (res.end) {
            delete loadingMsgs[result.id];
            reloadTopic(topicId);
            scrollToBotton(result.id);
          }
          if (isFirst) {
            isFirst = false;
            loadingMsgs[result.id] = {
              stop: res.stop,
            };
            reloadTopic(topicId);
          }
          reloadTopic(topicId, result.id);
          if (
            topic &&
            topic.id == activityTopic?.id &&
            topic.messages.slice(-1)[0].id == result.id
          )
            scrollToBotton(result.id);
          await chat.pushMessage(result).then((r) => {
            result = r;
          });
        };
        // Claude模式时，新建话题的逻辑。当开启了助理模式时，先把助理设定发送给Claude
        if (
          isNewTopic &&
          !aiService.customContext &&
          chat.config.enableVirtualRole
        ) {
          setLoading((v) => ++v);
          msg.text = ChatManagement.parseText(chat.virtualRole.bio);
          await rendAndScrollView(msg);
          await aiService.sendMessage({
            msg,
            context: chat.getAskContext(topic),
            onMessage,
            config: {
              channel_id: chat.config.cloudChannelId,
              ...chat.gptConfig,
              user: "user",
              messages: [],
            },
          });
          setLoading((v) => --v);
          return;
        }
        setInputText("");
        setLoading((v) => ++v);
        if (msg.text || aiService.customContext) {
          await rendAndScrollView(msg);
          await aiService.sendMessage({
            msg,
            context: chat.getAskContext(topic),
            onMessage,
            config: {
              channel_id: chat.config.cloudChannelId,
              ...chat.gptConfig,
              user: "user",
              messages: [],
            },
          });
        } else if (aiService.history && topic.cloudTopicId) {
          // 获取历史记录
          let oldTs: string = "0";
          if (topic.messages.length) {
            for (let index = topic.messages.length - 1; index >= 0; index--) {
              const item = topic.messages[index];
              if (item.cloudMsgId) {
                oldTs = item.cloudMsgId;
                break;
              }
            }
          }
          await aiService.history({
            async onMessage(text, isAi, cloudId, err) {
              if (!topic) return;
              await chat.pushMessage({
                id: "",
                groupId: chat.group.id,
                ctxRole: isAi ? "assistant" : "user",
                text: text,
                timestamp: now++,
                topicId: topicId,
                cloudTopicId: topic.cloudTopicId,
                cloudMsgId: cloudId,
              });
            },
            lastMsgCloudId: oldTs,
            topicCloudId: topic.cloudTopicId,
            config: {
              channel_id: chat.config.cloudChannelId,
              ...chat.gptConfig,
              user: "user",
              messages: [],
            },
          });
          reloadTopic(result.topicId);
        }
      } finally {
        delete loadingMessages[result.id];
      }
      if (/^#{1,5}\s/.test(msg.text) || /^#{1,5}\s/.test(result.text))
        reloadNav(topic);
      setTimeout(() => {
        setLoading((v) => --v);
        if (msg.topicId == chat.config.activityTopicId)
          scrollToBotton(result.id);
      }, 500);
    },
    [chat, inputText, loadingMsgs, reloadNav, setActivityTopic]
  );

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
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
            alignItems: "center",
            marginBottom: "3px",
            position: "relative",
          }}
        >
          {inputText && (
            <Space
              size={10}
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                opacity: 0.5,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillContent,
              }}
            >
              <Tooltip title={"作为AI消息"}>
                <Button
                  type="text"
                  size="large"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setInputText((v) => "/" + ChatManagement.parseText(v));
                  }}
                >
                  /
                </Button>
              </Tooltip>
              <Tooltip title={"作为用户消息，不访问AI"}>
                <Button
                  type="text"
                  size="large"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setInputText((v) => "\\" + ChatManagement.parseText(v));
                  }}
                >
                  \
                </Button>
              </Tooltip>
              <Tooltip title={"作为系统消息"}>
                <Button
                  type="text"
                  size="large"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setInputText((v) => "::" + ChatManagement.parseText(v));
                  }}
                >
                  ::
                </Button>
              </Tooltip>
              <Tooltip title={"作为系统消息，不访问AI"}>
                <Button
                  type="text"
                  size="large"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setInputText((v) => "/::" + ChatManagement.parseText(v));
                  }}
                >
                  /::
                </Button>
              </Tooltip>
            </Space>
          )}
          <Space
            size={10}
            direction="vertical"
            style={{
              position: "absolute",
              bottom: "calc(100% + 60px)",
              right: 0,
              opacity: 0.5,
            }}
          >
            <Button
              shape={"circle"}
              size="large"
              icon={<VerticalAlignTopOutlined />}
              onClick={() => {
                stopScroll();
                if (!activityTopic) return;
                scrollStatus.enableTop = true;
                if (onlyOne) {
                  scrollToTop();
                } else scrollToTop(activityTopic.id);
              }}
            />
            <Button
              shape={"circle"}
              size="large"
              // type={lockEnd ? "primary" : undefined}
              icon={<VerticalAlignBottomOutlined />}
              onClick={() => {
                stopScroll();
                if (!activityTopic) return;
                scrollStatus.enable = true;
                if (onlyOne) {
                  scrollToBotton();
                }
                scrollToBotton(activityTopic.id);
              }}
            />
          </Space>
          {screenSize.width < 1200 && (
            <AlignLeftOutlined
              style={{ padding: "8px 12px 8px 0" }}
              onClick={(e) => {
                setShowNav(true);
              }}
            />
          )}
          <Drawer
            placement={"left"}
            closable={false}
            key={"nav_drawer"}
            bodyStyle={{ padding: "1em 0" }}
            open={showNav}
            onClose={() => {
              setShowNav(false);
            }}
          >
            <MemoBackgroundImage />
            <div
              style={{
                position: "relative",
                height: "100%",
                zIndex: 99,
              }}
            >
              <MemoNavigation />
            </div>
          </Drawer>
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
          <span style={{ marginLeft: 16 }}></span>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={<CommentOutlined />}
            onClick={() => {
              onSubmit(true);
            }}
          ></Button>
          <span style={{ marginLeft: 16 }}></span>
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
            placeholder="Ctrl + S 发送    Ctrl + Enter 创建话题"
            autoSize={{ maxRows: 10 }}
            allowClear
            ref={inputRef}
            onFocus={(e) =>
              e.target.scrollIntoView({
                behavior: "smooth",
                block: "end",
              })
            }
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
              setInputText((v) =>
                onTextareaTab(
                  v,
                  e.currentTarget?.selectionStart,
                  e.currentTarget?.selectionEnd,
                  e.currentTarget,
                  e.shiftKey
                )
              ))
            }
          />
        </div>
      </div>
    </>
  );
}
export const MemoInputUtil = React.memo(InputUtil);
