import { aiServiceType } from '@/core/AiService/ServiceProvider';
import { getInstance } from 'ts-indexdb';
import { aiServerList } from './AiService/ServiceProvider';
import { KeyValue } from './db/IndexDb';
import { KeyValueData } from './db/KeyValueData';

export type TokenStore = {
  current: string;
  tokens: string[];
};

const cache: { [key in aiServiceType]?: TokenStore } = {};
let isInit = false;
export async function initTokenStore() {
  const tokens = await getInstance().queryAll<KeyValue>({
    tableName: 'GlobalTokens',
  });
  tokens.forEach((v) => {
    let ket: aiServiceType = v.id as aiServiceType;
    cache[ket] = v.data;
  });
  let gptTolen = KeyValueData.instance().getApiKey();
  if (gptTolen && gptTolen != 'undefined') {
    cache['ChatGPT'] = getToken('ChatGPT');
    if (!cache['ChatGPT'].tokens.includes(gptTolen)) {
      cache['ChatGPT'].tokens.push(gptTolen);
      if (!cache['ChatGPT'].current) cache['ChatGPT'].current = gptTolen;
      saveToken('ChatGPT', cache['ChatGPT']);
    }
  }
  [
    ...aiServerList,
    ...KeyValueData.instance()
      .getaiServerList()
      .map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true })),
  ].forEach((s) => {
    if (!cache[s.key]) {
      cache[s.key] = getToken(s.key);
      saveToken(s.key, cache[s.key]!);
    }
  });
  isInit = true;
}

export function getToken(botType: aiServiceType): TokenStore {
  return cache[botType] || { current: '', tokens: [] };
}
export function nextToken(token: TokenStore): TokenStore {
  if (token.tokens.length > 1) {
    let idx = token.tokens.findIndex((f) => f == token.current);
    if (idx == -1) idx = 0;
    else idx += 1;
    if (idx >= token.tokens.length) idx = 0;
    token.current = token.tokens[idx];
  }
  Object.keys(cache).forEach((key) => {
    if (cache[key as aiServiceType] == token) {
      saveToken(key as aiServiceType, token);
    }
  });
  return token;
}
export function saveToken(botType: aiServiceType, token: TokenStore) {
  if (!isInit) return;
  let tokensCache = getToken(botType);
  Object.assign(tokensCache, token);
  cache[botType] = tokensCache;
  getInstance().insert<KeyValue>({
    tableName: 'GlobalTokens',
    data: { id: botType, data: tokensCache },
  });
}
