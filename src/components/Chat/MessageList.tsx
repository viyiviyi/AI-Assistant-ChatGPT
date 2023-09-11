import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { useSendMessage } from "@/core/hooks";
import {
  activityScroll,
  createThrottleAndDebounce,
  pagesUtil
} from "@/core/utils";
import { Message } from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import { Button } from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { Hidden } from "../common/Hidden";
import { MessageContext } from "./Chat";
import { useInput } from "./InputUtil";
import { MemoInsertInput } from "./InsertInput";
import { MemoMessageItem } from "./MessageItem";

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: { [key: string]: (messageId?: string | number) => void } =
  {};
export function reloadTopic(topicId: string, messageId?: string | number) {
  topicRender[topicId] && topicRender[topicId](messageId);
}

export function MessageList({
  topic,
  chat,
  firstMsgIdxRef,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
  firstMsgIdxRef: React.MutableRefObject<number | undefined>;
}) {
  const { reloadNav, forceRender } = useContext(ChatContext);
  const { setCite } = useContext(MessageContext);
  const { inputRef, setInput } = useInput();
  const [pageSize, setPageSize] = useState(
    Math.max(0, chat.config.pageSize || 0) || 20
  );
  const [repect, setRepect] = useState(
    Math.max(0, chat.config.pageRepect || 0) || 10
  );
  const [pageCount, setPageCount] = useState(
    Math.ceil(topic.messages.length / pageSize)
  );
  const [pageNumber, setPageNumber] = useState(pageCount);
  const [insertIndex, setInsertIndex] = useState(-1);
  const [countChar, setCountChar] = useState(0);
  const [ctxCountChar, setCtxCountChar] = useState(0);
  const [renderMessage] = useState<{ [key: string]: () => void }>({});
  const [messages, steMessages] = useState<Message[]>([
    ...(forceRender
      ? topic.messages
      : topic.messages.slice(Math.max(-topic.messages.length, -pageSize))),
  ]);
  const [msgIdIdxMap] = useState(new Map<string, number>());
  const { sendMessage } = useSendMessage(chat);
  /**
   * 更新字数统计 最小更新间隔： 两秒
   */
  const resetCharCount = useCallback(
    createThrottleAndDebounce(() => {
      let charCount = 0;
      topic.messages.forEach((m, idx) => {
        charCount += m.text.length;
      });
      let ctxCountChar = 0;
      chat.getAskContext(topic, topic.messages.length).forEach((v) => {
        ctxCountChar += v.content.length;
      });
      setCountChar(charCount);
      setCtxCountChar(ctxCountChar);
    }, 2000),
    [chat, topic]
  );
  /**
   * 分页
   */
  const rangeMessage = useCallback(
    (pageNumber: number = pageCount + 1, isEnd = true) => {
      const { range, totalPages, pageIndex } = pagesUtil(
        topic.messages,
        pageNumber,
        pageSize,
        repect,
        isEnd
      );
      resetCharCount();
      setPageCount(totalPages);
      steMessages(range);
      setPageNumber(pageIndex);
      msgIdIdxMap.clear();
      topic.messages.forEach((m, idx) => {
        msgIdIdxMap.set(m.id + "", idx);
      });
      return range;
    },
    [topic, pageSize, repect, msgIdIdxMap, pageCount, resetCharCount]
  );
  useEffect(resetCharCount, [resetCharCount]);
  useEffect(() => {
    rangeMessage(999999999999); // 为了省事，直接写了一个几乎不可能存在的页数，会自动转换成最后一页的
  }, [pageSize, rangeMessage]);
  useEffect(() => {
    setPageSize(Math.max(0, chat.config.pageSize || 0) || 20);
    setRepect(Math.max(0, chat.config.pageRepect || 0) || 10);
  }, [chat]);

  useEffect(() => {
    /**
     * 设置当前页第一条消息的索引
     */
    firstMsgIdxRef.current = msgIdIdxMap.get(messages[0]?.id);
    return () => {
      firstMsgIdxRef.current = undefined;
    };
  }, [messages, firstMsgIdxRef, msgIdIdxMap]);

  /**
   * 将消息内容填入输入框
   */
  const rBak = useCallback(
    (v: Message) => {
      setInput(
        (m) =>
          (m ? m + "\n" : m) +
          (!m
            ? v.ctxRole == "system"
              ? "/::"
              : v.ctxRole == "assistant"
              ? "/"
              : ""
            : "") +
          v.text
      );
      inputRef.current?.focus();
    },
    [inputRef, setInput]
  );
  /**
   * 删除消息
   */
  const onDel = useCallback(
    (msg: Message) => {
      chat.removeMessage(msg)?.then(() => {
        let idx = msgIdIdxMap.get(msg.id);
        delete renderMessage[msg.id];
        rangeMessage(idx !== undefined ? idx : pageNumber);
        reloadNav(topic);
      });
    },
    [
      renderMessage,
      rangeMessage,
      topic,
      chat,
      reloadNav,
      pageNumber,
      msgIdIdxMap,
    ]
  );
  useEffect(() => {
    /**
     * 用于在其他组件刷新话题或消息
     */
    topicRender[topic.id] = (messageId?: string | number) => {
      resetCharCount();
      if (typeof messageId == "number") {
        rangeMessage(
          Math.ceil((messageId + 1) / pageSize),
          messageId % pageSize >= pageSize / 2
        );
        return;
      }
      if (messageId) {
        return renderMessage[messageId] && renderMessage[messageId]();
      }
      rangeMessage();
    };
    return () => {
      delete topicRender[topic.id];
      Object.keys(renderMessage).forEach((key) => delete renderMessage[key]);
    };
  }, [rangeMessage, renderMessage, topic, pageSize, resetCharCount]);
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
      {messages.map((v, i) => {
        let idx = msgIdIdxMap.get(v.id);
        if (idx === undefined) idx = messages.length - 1;
        return (
          <div key={v.id}>
            <MemoMessageItem
              renderMessage={renderMessage}
              msg={v}
              onDel={onDel}
              rBak={rBak}
              onCite={setCite}
              onPush={() => {
                setInsertIndex(idx!);
              }}
              onSned={() => {
                activityScroll({ botton: true });
                sendMessage(idx!, topic);
              }}
            ></MemoMessageItem>
            {idx === insertIndex && (
              <MemoInsertInput
                key={"insert_input"}
                insertIndex={idx + 1}
                topic={topic}
                chat={chat}
                onHidden={() => setInsertIndex(-1)}
              />
            )}
            {i == messages.length - 1 && (
              <div style={{ marginTop: "2em" }}></div>
            )}
          </div>
        );
      })}

      <Hidden
        hidden={
          chat.config.renderType != "document" || topic.messages.length < 2
        }
      >
        <div style={{ fontSize: ".8em", textAlign: "center", opacity: 0.5 }}>
          <span>总字数：{countChar}</span>
          <span style={{ marginLeft: 16 }}>上下文：{ctxCountChar}</span>
        </div>
      </Hidden>
      {pageNumber < pageCount ? (
        <Button.Group style={{ width: "100%", marginTop: "2em" }}>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageNumber + 1, false);
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
