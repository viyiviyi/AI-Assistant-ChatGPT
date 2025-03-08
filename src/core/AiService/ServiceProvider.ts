import { ChatGPT } from '@/core/AiService/ChatGPT';
import { KeyValueData } from '../db/KeyValueData';
import { ChatGLM_API } from './ChatGLM_API';
import { Kamiya } from './Kamiya API';

import { useCallback, useState } from 'react';
import { env } from '../hooks/hooks';
import { getToken } from '../tokens';
import { IChat } from './../ChatManagement';
import { APICenter } from './APICenter';
import { ChatGLM_GPT } from './ChatGLM_GPT';
import { CohereAi } from './cohere.ai';
import { IAiService } from './IAiService';
import { QWen } from './QWen';
import { SlackClaude } from './SlackClaude';
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
  dashscope_alyun: string;
  cohereAi: string;
};

export const DefaultBaseUrl: BaseUrlScheam = {
  chatGPT: 'https://api.openai.com',
  slackClaude: 'https://slack.com',
  Kamiya: 'https://p0.kamiya.dev',
  dashscope_alyun: 'https://dashscope.aliyuncs.com',
  cohereAi: 'https://proxy.eaias.com/https://api.cohere.ai',
};
export const ProxyBaseUrl: BaseUrlScheam = {
  chatGPT: 'https://chat.eaias.com',
  slackClaude: 'https://slack.eaias.com',
  Kamiya: 'https://p0.kamiya.dev',
  dashscope_alyun: 'https://dashscope.alyun.proxy.eaias.com',
  cohereAi: 'https://proxy.eaias.com/https://api.cohere.ai',
};
export const DevBaseUrl: BaseUrlScheam = {
  chatGPT: ProxyBaseUrl.chatGPT,
  slackClaude: 'http://slack.yiyiooo.com',
  Kamiya: ProxyBaseUrl.Kamiya,
  dashscope_alyun: 'https://dashscope-proxy.yiyiooo.workers.dev',
  cohereAi: 'https://proxy.eaias.com/https://api.cohere.ai',
};

export const httpProxyUrl = 'https://proxy.eaias.com/';

export type aiServiceType =
  | 'None'
  | 'ChatGPT'
  | 'Slack'
  | 'GPTFree'
  | 'Kamiya'
  | 'ChatGLM'
  | 'QWen'
  | 'APICenter'
  | 'CohereAi'
  | 'Oauther'
  | 'ChatGPT_API'
  | string;
export const aiServerList: {
  key: aiServiceType;
  name: string;
  hasToken: boolean;
}[] = [
  {
    key: 'None',
    name: '不启用AI',
    hasToken: false,
  },
  {
    key: 'ChatGPT',
    name: 'ChatGPT',
    hasToken: true,
  },
  {
    key: 'Slack',
    name: 'Slack(Claude)',
    hasToken: false,
  },
  {
    key: 'APICenter',
    name: '第三方API(兼容ChatGPT)',
    hasToken: true,
  },
  // {
  //   key: "Kamiya",
  //   name: "众神之谷",
  //   hasToken: true,
  // },
  // {
  //   key: 'QWen',
  //   name: '通义千问',
  //   hasToken: true,
  // },
  // {
  //   key: "GPTFree",
  //   name: "ChatGPT(免费)",
  // },
  {
    key: 'CohereAi',
    name: 'cohere.ai',
    hasToken: true,
  },
  // {
  //   key: 'ChatGLM',
  //   name: 'ChatGLM',
  //   hasToken: false,
  // },
];

export const aiServices: {
  current?: IAiService;
} = {};
export function getServiceInstance(botType: aiServiceType, chat: IChat): IAiService | undefined {
  let tokenStore = getToken(botType);
  let tokens: ServiceTokens = {
    openai: { apiKey: tokenStore.current },
    slack: {
      slack_user_token: tokenStore.current,
      claude_id: chat.config.cloudChannelId || '',
    },
  };
  let baseUrl: BaseUrlScheam = env == 'prod' ? ProxyBaseUrl : DevBaseUrl;
  switch (botType) {
    case 'Slack':
      return new SlackClaude(KeyValueData.instance().getSlackProxyUrl() || baseUrl.slackClaude, tokens);
    case 'GPTFree':
      return new ChatGPT('https://chat-free.eaias.com', {
        openai: { apiKey: '123' },
      });
    case 'ChatGPT':
      return new APICenter(chat.config.baseUrl || baseUrl.chatGPT, tokens);
    case 'Kamiya':
      return new Kamiya(baseUrl.Kamiya, tokens);
    case 'ChatGLM':
      return new ChatGLM_GPT(chat.config.userServerUrl || '', tokens);
    case 'Oauther':
      return new ChatGLM_API(chat.config.userServerUrl || '', tokens);
    case 'QWen':
      return new QWen(chat.config.userServerUrl || baseUrl.dashscope_alyun);
    case 'CohereAi':
      return new CohereAi(chat.config.userServerUrl || baseUrl.cohereAi, tokens, chat.gptConfig);
    case 'APICenter':
      return new APICenter(KeyValueData.instance().getApiTransferUrl() || '', tokens);
    case 'None':
      return undefined;
    default:
      const s = new APICenter(botType, tokens, chat.gptConfig);
      s.serverType = botType;
      return s;
  }
}

export function useService() {
  const [_, setService] = useState(aiServices.current);
  let reloadService = useCallback((chat: IChat, data: KeyValueData) => {
    if (!data) return;
    let _service: IAiService | undefined = getServiceInstance(chat.config.botType, chat);
    setService(_service);
    aiServices.current = _service;
  }, []);
  // useEffect(() => {
  //   let ls = KeyValueData.instance().getaiServerList();
  //   ls.map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true })).forEach((v) => {
  //     let item = aiServerList.find((v2) => v2.key == v.key);
  //     if (item) {
  //       Object.assign(item, v);
  //     } else {
  //       aiServerList.push(v);
  //     }
  //   });
  // }, []);

  return { reloadService, aiService: aiServices.current };
}
