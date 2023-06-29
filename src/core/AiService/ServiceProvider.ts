import { ChatGPT } from "@/core/AiService/ChatGPT";
import { KeyValueData } from "./../KeyValueData";
import { ChatGLM_API } from "./ChatGLM_API";

import { useCallback, useState } from "react";
import { useEnv } from "../hooks";
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
};

export const DefaultBaseUrl: BaseUrlScheam = {
  chatGPT: "https://api.openai.com",
  slackClaude: "https://slack.com",
};
export const ProxyBaseUrl: BaseUrlScheam = {
  chatGPT: "https://chat.22733.site",
  slackClaude: "https://slack.22733.site",
};
export const DevBaseUrl: BaseUrlScheam = {
  chatGPT: ProxyBaseUrl.chatGPT,
  slackClaude: "http://slack.yiyiooo.com",
};

export type aiServiceType =
  | "None"
  | "ChatGPT"
  | "Slack"
  | "GPTFree"
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
    key: "GPTFree",
    name: "ChatGPT(免费)",
  },
  {
    key: "ChatGLM",
    name: "ChatGLM",
  },
];

export const aiServices: {
  current?: IAiService;
} = {};

export function useService() {
  const env = useEnv();
  const [_, setService] = useState(aiServices.current);
  let reloadService = useCallback(
    (chat: IChat, data: KeyValueData) => {
      let baseUrl: BaseUrlScheam = env == "dev" ? DevBaseUrl : ProxyBaseUrl;
      if (!data) return;
      let tokens: ServiceTokens = {
        openai: { apiKey: KeyValueData.instance().getApiKey() },
        slack: {
          slack_user_token: KeyValueData.instance().getSlackUserToken(),
          claude_id: KeyValueData.instance().getSlackClaudeId(),
        },
      };
      let _service: IAiService | undefined = undefined;
      switch (chat.config.botType) {
        case "Slack":
          _service = new SlackClaude(
            KeyValueData.instance().getSlackProxyUrl() || baseUrl.slackClaude,
            tokens
          );
          break;
        case "GPTFree":
          _service = new ChatGPT("https://chat-free.22733.site", {
            openai: { apiKey: "123" },
          });
          break;
        case "ChatGPT":
          _service = new ChatGPT(
            chat.config.baseUrl || baseUrl.chatGPT,
            tokens
          );
          break;
        case "ChatGLM":
          _service = new ChatGLM_GPT(chat.config.userServerUrl || "", tokens);
          break;
        case "Oauther":
          _service = new ChatGLM_API(chat.config.userServerUrl || "", tokens);
      }
      setService(_service);
      aiServices.current = _service;
    },
    [env]
  );

  return { reloadService, aiService: aiServices.current };
}

export const chatGptModels = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0301",
  "gpt-4",
  "gpt-4-0314",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "text-davinci-003",
  "text-davinci-002	",
  // "text-curie-001",
  // "text-babbage-001",
  // "text-ada-001",
  // "davinci",
  // "curie",
  // "babbage",
  // "ada",
];
