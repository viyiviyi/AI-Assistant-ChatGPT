import { reloadTopic } from "@/components/Chat/Message/MessageList";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import {
  onReader,
  onReaderAfter,
  onReaderFirst,
  onSendBefore
} from "@/middleware/execMiddleware";
import { CtxRole } from "@/Models/CtxRole";
import { Message } from "@/Models/DataBase";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { TopicMessage } from "../../Models/Topic";
import { aiServices } from "../AiService/ServiceProvider";
import {
  createThrottleAndDebounce,
  getUuid,
  scrollToBotton
} from "../utils/utils";

export function useScreenSize() {
  const [obj, setObj] = useState<{
    width: number;
    height: number;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
  }>({
    width: 0,
    height: 0,
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
  });
  const timeout = useRef<any>();
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj({
      width: window.innerWidth,
      height: window.innerHeight,
      screenWidth: window.innerWidth * window.devicePixelRatio,
      screenHeight: window.innerHeight * window.devicePixelRatio,
      devicePixelRatio: window.devicePixelRatio,
    });
    window.addEventListener("resize", () => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setObj({
          width: window.innerWidth,
          height: window.innerHeight,
          screenWidth: window.innerWidth * window.devicePixelRatio,
          screenHeight: window.innerHeight * window.devicePixelRatio,
          devicePixelRatio: window.devicePixelRatio,
        });
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
      if (topic.messages[idx].timestamp < topic.messages[idx + 1].timestamp)
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
const currentPullMessage = { id: "" };

export function useSendMessage(chat: ChatManagement) {
  const { loadingMsgs } = useContext(ChatContext);
  const { reloadIndex } = useReloadIndex(chat);
  const sendMessage = useCallback(
    /**
     * 发送上下文给AI
     * @param idx 最后一条上下文的索引
     * @param topic 话题
     * @returns
     */
    async (idx: number, topic: TopicMessage) => {
      const aiService = aiServices.current;
      if (!aiService) return;
      if (idx >= topic.messages.length) {
        idx = topic.messages.length - 1;
      }
      let time = Date.now();
      if (idx < 0 && topic.messages.length)
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
      result = onReaderFirst(chat.getChat(), topic.messages[idx], result);
      if (
        topic.messages
          .slice(Math.max(0, idx - chat.gptConfig.msgCount), idx + 1)
          .findIndex((f) => loadingMessages[f.id]) != -1
      )
        return;
      loadingMessages[result.id] = true;
      // 因为回调函数引用了chat，而编辑配置时会创建新的chat，导致旧的chat不能被回收，导致内存溢出
      let currentChat: { current: ChatManagement | undefined } = {
        current: chat,
      };
      let isFirst = true;
      let save = createThrottleAndDebounce((isEnd) => {
        // result.text = text;
        chat.pushMessage(result, idx + 1).then((r) => {
          result = r;
        });
        if (isEnd) {
          onReaderAfter(chat.getChat(), [result]).forEach((res, idx) => {
            chat.pushMessage(res, idx + 1 + idx).then((r) => {
              result = r;
            });
          });
        }
      }, 100);
      let { allCtx: ctx, history } = currentChat.current!.getAskContext(
        topic,
        idx + 1
      );
      ctx = onSendBefore(chat.getChat(), { allCtx: ctx, history }) as {
        role: CtxRole;
        content: string;
        name: string;
      }[];
      aiService.sendMessage({
        msg: topic.messages[idx],
        context: ctx,
        async onMessage(res) {
          res.text = onReader(chat.getChat(), res.text || "");
          if (!topic) return res.stop ? res.stop() : undefined;
          if (!topic.cloudTopicId && res.cloud_topic_id) {
            topic.cloudTopicId = res.cloud_topic_id;
            result.cloudTopicId = res.cloud_topic_id;
            currentChat.current?.saveTopic(
              topic.id,
              topic.name,
              res.cloud_topic_id
            );
          }
          result.text = res.text + (res.end ? "" : "\n\nloading...");
          result.cloudMsgId = res.cloud_result_id || result.cloudMsgId;
          loadingMsgs[result.id] = {
            stop: res.stop,
          };
          if (isFirst) {
            isFirst = false;
            currentPullMessage.id = result.id;
            await currentChat.current
              ?.pushMessage(result, idx + 1)
              .then((r) => {
                result = r;
                reloadIndex(topic, idx);
                reloadTopic(topic.id);
                scrollToBotton(currentPullMessage.id);
                delete currentChat.current;
              });
          } else {
            save();
            reloadTopic(topic.id, result.id);
            scrollToBotton(currentPullMessage.id);
          }
          if (res.end) {
            save();
            delete loadingMsgs[result.id];
            delete loadingMessages[result.id];
            reloadTopic(topic.id, result.id);
            scrollToBotton(currentPullMessage.id);
          }
        },
        config: {
          channel_id: currentChat.current!.config.cloudChannelId,
          ...currentChat.current!.gptConfig,
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
  const { getHistory } = useGetHistory(chat);
  const pushMessage = useCallback(
    /**
     *
     * @param text 内容
     * @param idx 目标索引
     * @param topic
     * @param role [消息的角色，是否发送网络请求]
     * @param pushCallback
     * @returns
     */
    async function (
      text: string,
      idx: number,
      topic: TopicMessage,
      role: [CtxRole, boolean],
      pushCallback: (msg: Message) => void
    ) {
      if (idx < 0) return;
      text = text.trim();
      const aiService = aiServices.current;
      if (!text && !aiService?.customContext && aiService?.history) {
        // 当历史记录由服务器保存，且没有上下文时，获取历史记录
        await getHistory(topic);
        return;
      }
      const skipRequest = !role[1];
      text = ChatManagement.parseText(text);
      let time = Date.now();
      if (idx == 0 && idx + 1 < topic.messages.length)
        time = topic.messages[idx + 1].timestamp - 1;
      if (idx > 0 && idx < topic.messages.length)
        time = topic.messages[idx - 1].timestamp + 0.001;
      let msg: Message = {
        id: "",
        groupId: chat.group.id,
        ctxRole: role[0],
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
      if (skipRequest) return;
      await sendMessage(idx, topic);
    },
    [chat, reloadIndex, sendMessage, getHistory]
  );
  return { pushMessage };
}

export function useGetHistory(chat: ChatManagement) {
  const getHistory = useCallback(
    async function (topic: TopicMessage) {
      const aiService = aiServices.current;
      let now = Date.now();
      if (aiService?.history && topic.cloudTopicId) {
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
              topicId: topic.id,
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
        reloadTopic(topic.id);
      }
    },
    [chat]
  );
  return { getHistory };
}
