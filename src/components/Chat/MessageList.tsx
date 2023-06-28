import { aiServices } from "@/core/AiService/ServiceProvider";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import {
  pagesUtil,
  scrollStatus,
  scrollToBotton,
  scrollToTop,
  stopScroll,
} from "@/core/utils";
import { Message } from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MessageContext } from "./Chat";
import { useInput } from "./InputUtil";
import { MemoMessageItem } from "./MessageItem";


// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: { [key: string]: (messageId?: string | number) => void } =
  {};
export function reloadTopic(topicId: string, messageId?: string | number) {
  topicRender[topicId] && topicRender[topicId](messageId);
}

const insertInputRef = React.createRef<HTMLInputElement>();
export function MessageList({
  topic,
  chat,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
}) {
  const { loadingMsgs, reloadNav } = useContext(ChatContext);
  const { setCite, onlyOne } = useContext(MessageContext);
  const { inputRef, setInput } = useInput();
  const [pageSize, setPageSize] = useState(onlyOne ? 50 : 20);
  const [repect] = useState(10);
  const [pageCount, setPageCount] = useState(
    Math.ceil(topic.messages.length / pageSize)
  );
  const [pageNumber, setPageNumber] = useState(pageCount);
  const [insertIndex, setInsertIndex] = useState(-1);
  const [renderMessage] = useState<{ [key: string]: () => void }>({});
  const [messages, steMessages] = useState<Message[]>([]);
  const [msgIdIdxMap] = useState(new Map<string, number>());
  const rangeMessage = useCallback(
    (pageNumber: number) => {
      const { range, totalPages, pageIndex } = pagesUtil(
        topic.messages,
        pageNumber,
        pageSize,
        repect
      );
      setPageCount(totalPages);
      steMessages(range);
      setPageNumber(pageIndex);
      topic.messages.forEach((m, idx) => {
        msgIdIdxMap.set(m.id, idx);
      });
      return range;
    },
    [topic, pageSize, repect, msgIdIdxMap]
  );
  useEffect(() => {
    rangeMessage(999999999999); // 为了省事，直接写了一个几乎不可能存在的页数，会自动转换成最后一页的
  }, [pageSize, rangeMessage]);
  useEffect(() => {
    setPageSize(onlyOne ? 50 : 20);
  }, [onlyOne]);
  const rBak = useCallback(
    (v: Message) => {
      setInput(
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
    },
    [inputRef, setInput]
  );
  const onDel = useCallback(
    (msg: Message) => {
      chat.removeMessage(msg)?.then(() => {
        delete renderMessage[msg.id];
        rangeMessage(pageNumber);
        reloadNav(topic);
      });
    },
    [renderMessage, rangeMessage, topic, chat, reloadNav, pageNumber]
  );
  // 整理idx之后的message的timestamp的值, 并获取一个可以使用的值，因为这个值用于排序用，如果前后顺序相同时，需要将后一个+0.01 并且需要递归只到最后一个或者与下一个不一样为止

  const reloadIndex = useCallback(
    (topic: TopicMessage, idx: number) => {
      if (topic.messages.length <= idx + 1) return;
      if (topic.messages[idx].timestamp != topic.messages[idx + 1].timestamp)
        return;
      topic.messages[idx + 1].timestamp += 0.001;
      chat.pushMessage(topic.messages[idx + 1]);
      reloadIndex(topic, idx + 1);
    },
    [chat]
  );
  const onPush = useCallback(async (idx: number) => {
    setInsertIndex(idx);
    setTimeout(() => {
      insertInputRef.current?.focus();
    }, 500);
  }, []);
  const onSend = useCallback(
    async (idx: number) => {
      const aiService = aiServices.current;
      if (!aiService) return;
      let result: Message = {
        id: "",
        groupId: chat.group.id,
        virtualRoleId: chat.virtualRole.id,
        ctxRole: "assistant",
        text: "loading...",
        timestamp: topic.messages[idx].timestamp + 0.001,
        topicId: topic.id,
      };

      aiService.sendMessage({
        msg: topic.messages[idx],
        context: chat.getAskContext(topic, idx),
        onMessage(res) {
          if (!topic) return;
          if (!topic.cloudTopicId && res.cloud_topic_id) {
            topic.cloudTopicId = res.cloud_topic_id;
            result.cloudTopicId = res.cloud_topic_id;
            chat.saveTopic(topic.id, topic.name, res.cloud_topic_id);
          }
          result.text = res.text + (res.end ? "" : "\n\nloading...");
          result.cloudMsgId = res.cloud_result_id || result.cloudMsgId;
          let isFirst = !result.id;
          chat.pushMessage(result, idx).then((r) => {
            result = r;
            if (res.end) {
              delete loadingMsgs[r.id];
              rangeMessage(Math.ceil(idx + 1 / pageSize));
              scrollToBotton(result.id);
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
            if (isFirst) {
              reloadIndex(topic, idx + 1);
              rangeMessage(Math.ceil(idx + 1 / pageSize));
              scrollToBotton(result.id);
            }
            renderMessage[result.id] && renderMessage[result.id]();
          });
        },
        config: {
          channel_id: chat.config.cloudChannelId,
          ...chat.gptConfig,
          user: "user",
        },
      });
    },
    [
      chat,
      reloadIndex,
      topic,
      loadingMsgs,
      renderMessage,
      rangeMessage,
      pageSize,
    ]
  );
  const onSubmit = async function (text: string, idx: number) {
    text = text.trim();
    const isBot = text.startsWith("/");
    const isSys = text.startsWith("/::") || text.startsWith("::");
    const skipRequest = text.startsWith("\\");
    text = ChatManagement.parseText(text);
    let msg: Message = {
      id: "",
      groupId: chat.group.id,
      senderId: isBot ? undefined : chat.user.id,
      virtualRoleId: isBot ? chat.virtualRole.id : undefined,
      ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
      text: text,
      timestamp: topic.messages[idx].timestamp + 0.001,
      topicId: topic.id,
      cloudTopicId: topic.cloudTopicId,
    };
    await chat.pushMessage(msg, idx);
    if (msg.id) {
      reloadIndex(topic, idx + 1);
      rangeMessage(Math.ceil(idx + 1 / pageSize));
    }
    setInsertIndex(-1);
    if (isBot || isSys || skipRequest) return;
    onSend(idx + +(msg.id ? 1 : 0));
  };

  useEffect(() => {
    topicRender[topic.id] = (messageId?: string | number) => {
      if (typeof messageId == "number") {
        rangeMessage(Math.ceil(messageId / pageSize));
        return;
      }
      if (messageId) {
        return renderMessage[messageId] && renderMessage[messageId]();
      }
      rangeMessage(pageCount);
    };
    return () => {
      delete topicRender[topic.id];
    };
  }, [rangeMessage, renderMessage, topic, pageCount, pageSize]);
  return (
    <>
      {pageNumber > 1 ? (
        <Button.Group style={{ width: "100%" }}>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageNumber - 1);
            }}
          >
            上一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(1);
            }}
          >
            顶部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
      {messages.map((v) => {
        let idx = msgIdIdxMap.get(v.id) || topic.messages.length - 1;
        return (
          <div key={v.id}>
            <MemoMessageItem
              renderMessage={renderMessage}
              msg={v}
              onDel={onDel}
              rBak={rBak}
              onCite={setCite}
              onPush={() => {
                onPush(idx);
              }}
              onSned={() => {
                onSend(idx);
              }}
            ></MemoMessageItem>
            {idx === insertIndex && (
              <InsertInput
                key={"insert_input"}
                insertIndex={insertIndex}
                onSubmit={onSubmit}
                onHidden={() => setInsertIndex(-1)}
              />
            )}
            {idx == messages.length - 1 && (
              <div style={{ marginTop: "2em" }}></div>
            )}
          </div>
        );
      })}

      {pageNumber < pageCount ? (
        <Button.Group style={{ width: "100%", marginTop: "2em" }}>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageNumber + 1);
            }}
          >
            下一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageCount);
            }}
          >
            底部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
    </>
  );
}

function InsertInput({
  onSubmit: _onSubmit,
  onHidden,
  insertIndex,
}: {
  onSubmit: (text: string, idx: number) => void;
  onHidden?: () => void;
  insertIndex: number;
}) {
  const [insertText, setInsertText] = useState("");
  const onSubmit = (text: string, idx: number) => {
    _onSubmit(text, idx);
    setInsertText("");
  };
  const onTextareaTab = (
    start: number,
    end: number,
    textarea: EventTarget & HTMLTextAreaElement
  ) => {
    setInsertText((v) => v.substring(0, start) + "    " + v.substring(start));
    setTimeout(() => {
      textarea.selectionStart = start + 4;
      textarea.selectionEnd = end + 4;
    }, 0);
  };
  return (
    <>
      <div
        style={{
          width: "calc(100% - 100px)",
          display: "flex",
          margin: "1.5em auto 0",
        }}
      >
        <Input.TextArea
          placeholder="/开头代替AI发言 ::开头发出系统内容"
          autoSize={{ maxRows: 10 }}
          allowClear
          ref={insertInputRef}
          autoFocus={false}
          value={insertText}
          onKeyUp={(e) =>
            (e.key === "s" && e.altKey && onSubmit(insertText, insertIndex)) ||
            (e.key === "Enter" &&
              e.ctrlKey &&
              onSubmit(insertText, insertIndex))
          }
          onChange={(e) => setInsertText(e.target.value)}
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
        <span style={{ marginLeft: 10 }}></span>
        <Button
          shape="circle"
          size="large"
          onMouseDown={(e) => e.preventDefault()}
          icon={<MessageOutlined />}
          onClick={() => {
            onSubmit(insertText, insertIndex);
          }}
        ></Button>
        <span style={{ marginLeft: 10 }}></span>
        <Button
          shape="circle"
          size="large"
          onMouseDown={(e) => e.preventDefault()}
          icon={<CloseOutlined />}
          onClick={() => {
            onHidden && onHidden();
          }}
        ></Button>
      </div>
    </>
  );
}
