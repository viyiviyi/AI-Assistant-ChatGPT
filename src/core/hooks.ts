import { reloadTopic } from "@/components/Chat/MessageList";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { TopicMessage } from "./../Models/Topic";
import { aiServices } from "./AiService/ServiceProvider";
import { getUuid, scrollToBotton } from "./utils";

export function useScreenSize() {
  const [obj, setObj] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const timeout = useRef<any>();
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", () => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setObj({ width: window.innerWidth, height: window.innerHeight });
      }, 1000);
    });
  }, []);
  return obj;
}
export function useDark() {
  const [obj, setObj] = useState(false);
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj(
      window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").onchange = function () {
        setObj(window.matchMedia("(prefers-color-scheme: dark)").matches);
      };
    }
  }, []);

  return obj;
}

export const env: "dev" | "prod" =
  process.env.NEXT_PUBLIC_DOMAIN_ENV === "production" ? "prod" : "dev";

// 整理idx之后的message的timestamp的值, 并获取一个可以使用的值，因为这个值用于排序用，如果前后顺序相同时，需要将后一个+0.01 并且需要递归只到最后一个或者与下一个不一样为止
export function useReloadIndex(chat: ChatManagement) {
  const reloadIndex = useCallback(
    (topic: TopicMessage, idx: number) => {
      if (idx + 1 >= topic.messages.length) return;
      if (idx < 0) return;
      if (topic.messages[idx].timestamp > topic.messages[idx + 1].timestamp)
        return;
      topic.messages[idx + 1].timestamp = topic.messages[idx].timestamp + 0.001;
      chat.pushMessage(topic.messages[idx + 1]);
      reloadIndex(topic, idx + 1);
    },
    [chat]
  );
  return {
    reloadIndex,
  };
}

export const loadingMessages: { [key: string]: boolean } = {};
export function useSendMessage(chat: ChatManagement) {
  const { loadingMsgs } = useContext(ChatContext);
  const { reloadIndex } = useReloadIndex(chat);
  const sendMessage = useCallback(
    async (idx: number, topic: TopicMessage) => {
      const aiService = aiServices.current;
      if (!aiService) return;
      if (idx > topic.messages.length) return;
      let time = Date.now();
      if (idx < 0 && idx < topic.messages.length)
        time = topic.messages[0].timestamp - 1;
      if (idx >= 0 && idx < topic.messages.length)
        time = topic.messages[idx].timestamp + 0.001;
      let result: Message = {
        id: getUuid(),
        groupId: chat.group.id,
        ctxRole: "assistant",
        text: "loading...",
        timestamp: time,
        topicId: topic.id,
      };
      if (
        topic.messages
          .slice(-chat.gptConfig.msgCount)
          .findIndex((f) => loadingMessages[f.id]) != -1
      )
        return;
      loadingMessages[result.id] = true;

      let isFirst = false;
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
          if (res.end) {
            delete loadingMsgs[result.id];
            delete loadingMessages[result.id];
            scrollToBotton(result.id);
          }
          if (isFirst) {
            isFirst = true;
            reloadIndex(topic, idx);
            reloadTopic(topic.id, idx + 1);
            scrollToBotton(result.id);
            loadingMsgs[result.id] = {
              stop: res.stop,
            };
          }
          reloadTopic(topic.id, result.id);
          chat.pushMessage(result, idx + 1).then((r) => {
            result = r;
          });
        },
        config: {
          channel_id: chat.config.cloudChannelId,
          ...chat.gptConfig,
          user: "user",
          messages: [],
        },
      });
    },
    [chat, reloadIndex, loadingMsgs]
  );
  return { sendMessage };
}

export function usePushMessage(chat: ChatManagement) {
  const { sendMessage } = useSendMessage(chat);
  const { reloadIndex } = useReloadIndex(chat);
  const pushMessage = useCallback(
    async function (
      text: string,
      idx: number,
      topic: TopicMessage,
      pushCallback: (msg: Message) => void
    ) {
      if (idx < 0) return;
      text = text.trim();
      const isBot = text.startsWith("/");
      const isSys = text.startsWith("/::") || text.startsWith("::");
      const skipRequest = text.startsWith("\\");
      text = ChatManagement.parseText(text);
      let time = Date.now();
      if (idx == 0 && idx + 1 < topic.messages.length)
        time = topic.messages[idx + 1].timestamp - 1;
      if (idx > 0 && idx < topic.messages.length)
        time = topic.messages[idx - 1].timestamp + 0.001;
      let msg: Message = {
        id: "",
        groupId: chat.group.id,
        ctxRole: isSys ? "system" : isBot ? "assistant" : "user",
        text: text,
        timestamp: time,
        topicId: topic.id,
        cloudTopicId: topic.cloudTopicId,
      };
      await chat.pushMessage(msg, idx);
      if (msg.id) {
        reloadIndex(topic, idx);
        reloadTopic(topic.id, idx);
      }
      pushCallback(msg);
      if (isBot || isSys || skipRequest) return;
      sendMessage(idx, topic);
    },
    [chat, reloadIndex, sendMessage]
  );
  return { pushMessage };
}
