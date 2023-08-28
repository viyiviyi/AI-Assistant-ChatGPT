import { ChatGPT } from "@/core/AiService/ChatGPT";
import { KeyValueData } from "./../KeyValueData";
import { ChatGLM_API } from "./ChatGLM_API";
import { Kamiya } from "./Kamiya API";

import { useCallback, useState } from "react";
import { env } from "../hooks";
import { getToken } from "../tokens";
import { IChat } from "./../ChatManagement";
import { ChatGLM_GPT } from "./ChatGLM_GPT";
import { IAiService } from "./IAiService";
import { SlackClaude } from "./SlackClaude";
export interface ServiceTokens {
  openai?: { apiKey: string };
  slack?: {
    slack_user_token: string;
    claude_id: string;
  };
}

export type BaseUrlScheam = {
  chatGPT: string;
  slackClaude: string;
  Kamiya: string;
};

export const DefaultBaseUrl: BaseUrlScheam = {
  chatGPT: "https://api.openai.com",
  slackClaude: "https://slack.com",
  Kamiya: "https://p0.kamiya.dev",
};
export const ProxyBaseUrl: BaseUrlScheam = {
  chatGPT: "https://chat.eaias.com",
  slackClaude: "https://slack.eaias.com",
  Kamiya: "https://p0.kamiya.dev",
};
export const DevBaseUrl: BaseUrlScheam = {
  chatGPT: ProxyBaseUrl.chatGPT,
  slackClaude: "http://slack.yiyiooo.com",
  Kamiya: ProxyBaseUrl.Kamiya,
};

export type aiServiceType =
  | "None"
  | "ChatGPT"
  | "Slack"
  | "GPTFree"
  | "Kamiya"
  | "ChatGLM"
  | "Oauther";
export const aiServerList: { key: aiServiceType; name: string }[] = [
  {
    key: "None",
    name: "不启用AI",
  },
  {
    key: "ChatGPT",
    name: "ChatGPT",
  },
  {
    key: "Slack",
    name: "Slack(Claude)",
  },
  {
    key: "Kamiya",
    name: "众神之谷",
  },
  // {
  //   key: "GPTFree",
  //   name: "ChatGPT(免费)",
  // },
  {
    key: "ChatGLM",
    name: "ChatGLM",
  },
];

export const aiServices: {
  current?: IAiService;
} = {};
export function getServiceInstance(botType: aiServiceType, chat: IChat) {
  let tokenStore = getToken(botType);
  let tokens: ServiceTokens = {
    openai: { apiKey: tokenStore.current },
    slack: {
      slack_user_token: tokenStore.current,
      claude_id: chat.config.cloudChannelId || "",
    },
  };
  let baseUrl: BaseUrlScheam = env == "prod" ? ProxyBaseUrl : DevBaseUrl;
  switch (botType) {
    case "Slack":
      return new SlackClaude(
        KeyValueData.instance().getSlackProxyUrl() || baseUrl.slackClaude,
        tokens
      );
    case "GPTFree":
      return new ChatGPT("https://chat-free.eaias.com", {
        openai: { apiKey: "123" },
      });
    case "ChatGPT":
      return new ChatGPT(chat.config.baseUrl || baseUrl.chatGPT, tokens);
    case "Kamiya":
      return new Kamiya(baseUrl.Kamiya, tokens);
    case "ChatGLM":
      return new ChatGLM_GPT(chat.config.userServerUrl || "", tokens);
    case "Oauther":
      return new ChatGLM_API(chat.config.userServerUrl || "", tokens);
    case "None":
      return undefined;
  }
}

export function useService() {
  const [_, setService] = useState(aiServices.current);
  let reloadService = useCallback((chat: IChat, data: KeyValueData) => {
    if (!data) return;
    let _service: IAiService | undefined = getServiceInstance(
      chat.config.botType,
      chat
    );
    setService(_service);
    aiServices.current = _service;
  }, []);

  return { reloadService, aiService: aiServices.current };
}
