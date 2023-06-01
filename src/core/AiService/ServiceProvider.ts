import { ChatGPT } from "@/core/AiService/ChatGPT";
import { KeyValueData } from "./../KeyValueData";

import { ChatContext, ChatManagement, IChat } from "./../ChatManagement";
import { useCallback, useContext, useEffect, useState } from "react";
import { useEnv } from "../hooks";
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
// const services: { [key: string]: IAiService | undefined } = {};
// function clear() {
//   Object.keys(services).forEach((key) => delete services[key]);
// }
export function useService(): [IAiService | undefined, (chat: IChat) => void] {
  const env = useEnv();
  const [data, setData] = useState<KeyValueData>();
  let [service, setService] = useState<IAiService | undefined>();
  useEffect(() => {
    setData(KeyValueData.instance());
  }, []);
  
  let reloadService = (chat: IChat) => {
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
        _service = new ChatGPT(chat.config.baseUrl || baseUrl.chatGPT, tokens);
    }
    setService(_service);
  };

  return [service, reloadService];
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
