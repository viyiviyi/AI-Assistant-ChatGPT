// import { WebClient } from "@slack/web-api";
import { WebAPICallResult } from "@slack/web-api";
import axios from "axios";

// 在[Slack App]->[OAuth & Permissions]->[User OAuth Token] (xoxp-...)中找到令牌
let slack_user_token = "";

// claude_id可以在 View App Details（查看应用详情） 中的 Member ID （成员 ID） 中找到
// 本ID是Slack内部使用的ID，不是Slack用户名或bot ID，不要混淆
// 本ID是用来标识Claude回复的消息的，如果不使用本ID，不太容易区分Claude的回复和我们用来发送消息的Bot的回复
// 并且，如果假设在消息列中有实时在线的用户的回复，有ID就可以辨认出来
// 因此也建议用一个专用的Slack工作区，不要和其他用户使用的混在一起
let claude_id = "";

// 使用机器人TOKEN实例化Web客户端
let client = axios.create({
  baseURL: "http://slack.yiyiooo.com/api/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${slack_user_token}`,
  },
});

// 最大重试次数，如果响应时间超过3秒，则更新消息重试，重试次数超过最大次数，则返回未响应
const max_retries = 5;

export function initClient(
  slackUserToken: string,
  _claude_id: string,
  baseUrl?: string
) {
  slack_user_token = slackUserToken;
  claude_id = _claude_id;
  client = axios.create({
    baseURL:
      baseUrl ?? location.origin.startsWith("/localhost")
        ? "http://slack.yiyiooo.com/api/"
        : "https://slack.22733.site/api/",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${slack_user_token}`,
    },
  });
}

export async function send_message_to_channel(
  channel_id: string,
  message_text: string = "",
  onMessage: (msg: {
    error: boolean;
    text: string;
    thread_ts?: string;
  }) => void,
  thread_ts?: string
): Promise<void> {
  try {
    if (slack_user_token.slice(0, 4) !== "xoxp") {
      throw new Error("USER_TOKEN错误，请检查是否填写正确。");
    }
    if (!message_text) return;
    let result = await send_message(channel_id, message_text, thread_ts);
    if (!result.ok) {
      throw new Error(result.error);
    }
    // 记录time stamp用于后续辨认响应消息
    const ts: string = result["ts"] as string;
    if (!thread_ts) thread_ts = ts;
    onMessage({
      error: false,
      text: "loading...",
      thread_ts: thread_ts,
    });
    // 初始化响应为_Typing…_，表示正在等待响应
    let response = "_Typing…_";
    // 记录响应开始时间,重试次数
    let start_time = Date.now();
    let reties = 1;
    // 如果响应以_Typing…_结尾，则继续等待响应
    while (response.trim().endsWith("_Typing…_")) {
      if (reties > max_retries) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const replies = await receive_message(channel_id, thread_ts, ts);
      // 如果replies['ok']为False或消息列表长度小于等于1，则表示没有响应
      if (!replies) {
        throw new Error("未收到Claude响应，请重试。");
      }
      if (!result.ok && replies["error"] == "ratelimited") {
        onMessage({
          error: false,
          text: "被限速了，稍等一会",
        });
        reties += 1;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        start_time = Date.now();
        continue;
      }
      const messages = replies["messages"] as Array<any>;
      if (messages.length <= 1) {
        reties += 1;
        continue;
      }
      const message = messages.find((f) => f.user === claude_id);
      if (!message) {
        reties += 1;
        continue;
      }
      reties = 0;
      response = message["text"];
      if (/Please note:|Oops! Claude was un/.test(response)) continue;
      onMessage({
        error: false,
        text: response,
      });
    }
    return;
  } catch (e: any) {
    console.error(e);
    onMessage({
      error: true,
      text: String(e),
      thread_ts: thread_ts,
    });
  }
}

// 发送@Claude的消息
// 如果thread_ts为空，则发送新消息
// 如果thread_ts不为空，则发送消息列回复
async function send_message(
  channel_id: string,
  text: string,
  thread_ts: string = ""
): Promise<WebAPICallResult> {
  const result = await client.post("/chat.postMessage", {
    channel: channel_id,
    text: `<@${claude_id}>${text}`,
    thread_ts: thread_ts,
  });
  // const result = await client.chat.postMessage({
  //   channel: channel_id,
  //   text: `<@${claude_id}>${text}`,
  //   thread_ts: thread_ts,
  // });
  return result.data;
}

// 获取消息列
async function receive_message(
  channel_id: string,
  ts: string,
  oldest: string,
  limit: number = 2
): Promise<WebAPICallResult> {
  const result = await client.get(
    `/conversations.replies?channel=${channel_id}&ts=${ts}&limit=${limit}&oldest=${oldest}`
  );
  // const result = await client.conversations.replies({
  //   ts: ts,
  //   channel: channel_id,
  //   oldest: oldest,
  // });
  return result.data;
}

// // 更新消息, 用于触发@Claude的响应
// async function update_message(
//   channel_id: string,
//   ts: string,
//   text: string
// ): Promise<WebAPICallResult> {
//   const result = await client.post("/chat.update", {
//     channel: channel_id,
//     ts: ts,
//     text: `<@${claude_id}>${text}`,
//   });
//   // const result = await client.chat.update({
//   //   channel: channel_id,
//   //   ts: ts,
//   //   text: `<@${claude_id}>${text}`,
//   // });
//   return result.data;
// }
