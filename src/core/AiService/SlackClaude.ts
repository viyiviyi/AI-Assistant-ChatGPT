import { Message } from "@/Models/DataBase";
import { WebAPICallResult } from "@slack/web-api";
import axios, { AxiosInstance } from "axios";
import { ChatCompletionRequestMessage } from "openai";
import { IAiService, InputConfig } from "./IAiService";
import { aiServiceType, ServiceTokens } from "./ServiceProvider";
export class SlackClaude implements IAiService {
  baseUrl: string;
  tokens: ServiceTokens;
  customContext = false;
  client: AxiosInstance;
  max_retries = 5;
  constructor(baseUrl: string, tokens: ServiceTokens) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
    this.client = axios.create({
      baseURL: `${baseUrl}/api/`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.slack?.slack_user_token}`,
      },
    });
  }
  serverType: aiServiceType = "Slack";

  models = async () => [];
  async sendMessage({
    msg,
    onMessage,
    config,
  }: {
    msg: Message;
    context: ChatCompletionRequestMessage[];
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      cloud_topic_id?: string;
      cloud_send_id?: string;
      cloud_result_id?: string;
      stop?: () => void;
    }) => void;
    config: InputConfig;
  }): Promise<void> {
    if (!config.channel_id)
      return onMessage({
        error: true,
        text: "缺少频道id，请在设置添加频道id后使用",
        end: true,
      });
    if (!this.tokens.slack?.slack_user_token.startsWith("xoxp-"))
      return onMessage({
        error: true,
        text: "错误的slack_user_token，请在设置页面配置后使用",
        end: true,
      });
    onMessage({
      error: false,
      text: "发送中...",
      end: false,
    });

    await this.send_message_to_channel(
      config.channel_id,
      msg.text,
      onMessage,
      msg.cloudTopicId
    );
  }
  history = async ({
    lastMsgCloudId,
    topicCloudId,
    onMessage,
    config,
  }: {
    lastMsgCloudId?: string | undefined;
    topicCloudId: string;
    onMessage: (
      msg: string,
      isAiMsg: boolean,
      msgCloudId: string,
      error: boolean
    ) => Promise<void>;
    config: InputConfig;
  }) => {
    if (!config.channel_id)
      return onMessage("缺少频道id，请在设置添加频道id后使用", true, "", true);
    const list = await this.getHistoryMessage(
      config.channel_id,
      topicCloudId,
      lastMsgCloudId,
      999
    );
    for (const item of list) {
      await onMessage(item.text, item.isClaude, item.ts, false);
    }
  };

  private async send_message_to_channel(
    channel_id: string,
    message_text: string = "",
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      cloud_topic_id?: string;
      cloud_send_id?: string;
      cloud_result_id?: string;
      stop?: () => void;
    }) => void,
    thread_ts?: string
  ): Promise<void> {
    let response = "_Typing…_";
    try {
      if (!message_text) return;
      let result = await this.send_message(channel_id, message_text, thread_ts);
      if (!result.ok) {
        throw new Error(result.error);
      }
      // 记录time stamp用于后续辨认响应消息
      const ts: string = result["ts"] as string;
      if (!thread_ts) thread_ts = ts;
      onMessage({
        error: false,
        end: false,
        text: "",
        cloud_topic_id: thread_ts,
        cloud_send_id: ts,
      });
      // 记录响应开始时间,重试次数
      let reties = 1;
      let isStop = false;
      // 如果响应以_Typing…_结尾，则继续等待响应
      while (!isStop && response.trim().endsWith("_Typing…_")) {
        if (reties > this.max_retries) {
          onMessage({
            error: true,
            end: true,
            text: "连续多次未获取到消息，已结束请求。",
          });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const replies = await this.receive_message(channel_id, thread_ts, ts);
        // 如果没有响应，直接报错，结束等待
        if (!replies) {
          throw new Error("未收到Claude响应，请重试。");
        }
        if (!result.ok && replies["error"] == "ratelimited") {
          onMessage({
            error: false,
            end: false,
            text: "被限速了，稍等一会",
            stop: () => {
              isStop = true;
            },
          });
          reties += 1;
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        const messages = replies["messages"] as Array<any>;
        if (messages.length <= 1) {
          reties += 1;
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        const message = messages.find(
          (f) => f.user === this.tokens.slack?.claude_id
        );
        if (!message) {
          reties += 1;
          continue;
        }
        reties = 0;
        response = message["text"];
        if (/Please note:|Oops! Claude was un/.test(response)) continue;
        onMessage({
          error: false,
          end: false,
          text: response.replace(/[\s\n]*_Typing…_$/, ""),
          cloud_result_id: message.ts,
          stop: () => {
            isStop = true;
          },
        });
      }
      onMessage({
        error: false,
        end: true,
        text:
          response.replace(/[\s\n]*_Typing…_$/, "") +
          (isStop ? "\n\n 请求已终止。" : ""),
      });
      return;
    } catch (e: any) {
      onMessage({
        error: true,
        end: true,
        text:
          response.replace(/[\s\n]*_Typing…_$/, "") +
          "\n\n 请求发生错误。\n\n" +
          String(e),
      });
    }
  }
  private async getHistoryMessage(
    channel_id: string,
    thread_ts: string,
    oldest?: string,
    limit: number = 2
  ): Promise<{ text: string; ts: string; isClaude: boolean }[]> {
    const replies = await this.receive_message(
      channel_id,
      thread_ts,
      oldest,
      limit
    );
    if (!replies || !replies.ok) {
      return [
        { text: replies.error || "获取历史记录出错", ts: "", isClaude: true },
      ];
    }
    const messages = replies["messages"] as Array<any>;
    if (!messages) return [];
    return messages
      .filter(
        (f) =>
          !/Please note:|Oops! Claude was un/.test(f.text) &&
          f.ts != oldest &&
          f.ts != thread_ts
      )
      .map((v) => ({
        text: v.text.replace(`<@${this.tokens.slack?.claude_id}>`, ""),
        ts: v.ts,
        isClaude: v.user === this.tokens.slack?.claude_id,
      }));
  }

  // 发送@Claude的消息
  // 如果thread_ts为空，则发送新消息
  // 如果thread_ts不为空，则发送消息列回复
  private async send_message(
    channel_id: string,
    text: string,
    thread_ts: string = ""
  ): Promise<WebAPICallResult> {
    const result = await this.client.post("/chat.postMessage", {
      channel: channel_id,
      text: `<@${this.tokens.slack?.claude_id}>${text}`,
      thread_ts: thread_ts,
    });
    return result.data;
  }

  // 获取消息列
  private async receive_message(
    channel_id: string,
    ts: string,
    oldest?: string,
    limit: number = 2
  ): Promise<WebAPICallResult> {
    const result = await this.client.get(
      `/conversations.replies?channel=${channel_id}&ts=${ts}&limit=${limit}&oldest=${oldest}`
    );
    return result.data;
  }
}
