import { getToken, nextToken } from '@/core/tokens';
import { GptConfig, Message } from '@/Models/DataBase';
import axios from 'axios';
import { ChatCompletionRequestMessage, ListModelsResponse, OpenAIApi } from 'openai';
import { IAiService, InputConfig } from './IAiService';
import { aiServiceType, ServiceTokens } from './ServiceProvider';
export class APICenter implements IAiService {
  customContext = true;
  history = undefined;
  client: OpenAIApi;
  baseUrl: string;
  tokens: ServiceTokens;
  constructor(baseUrl: string, tokens: ServiceTokens, config?: GptConfig) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
    this.client = new OpenAIApi();
    this.severConfig = config?.aiServerConfig || { model: '' };
  }
  severConfig: { model: string } = { model: '' };
  setConfig?: ((config: any) => void) | undefined = (config: any) => {
    if (typeof config === 'object' && 'model' in config) {
      if (Array.isArray(config.model)) {
        this.severConfig.model = config.model;
        return this.severConfig;
      }
    }
  };
  serverType: aiServiceType = 'APICenter';
  modelCache: string[] = [];
  needV1Str = (url: string) => {
    return !/\/v\d/.test(url);
  };
  models = async () => {
    if (this.modelCache.length) return this.modelCache;
    var token = getToken(this.serverType);
    if (!token.current) {
      nextToken(token);
      return [];
    }
    return axios
      .get(this.baseUrl + (this.needV1Str(this.baseUrl) ? '/v1' : '') + '/models?t=' + Date.now(), {
        headers: { Authorization: 'Bearer ' + token.current, 'ngrok-skip-browser-warning': 0 },
        timeout: 1000 * 60 * 5,
        responseType: 'json',
      })
      .then((res) => res.data)
      .then((res: ListModelsResponse) => {
        this.modelCache = (res.data || []).map((m) => m.id);
        if (!this.modelCache.includes(this.severConfig.model) && this.modelCache.length) {
          this.severConfig.model = this.modelCache[0];
        }
        return this.modelCache;
      });
  };
  async sendMessage({
    context,
    onMessage,
    config,
  }: {
    msg: Message;
    context: ChatCompletionRequestMessage[];
    onMessage: (msg: {
      error: boolean;
      text: string;
      reasoning_content?: string;
      end: boolean;
      stop?: (() => void) | undefined;
    }) => Promise<void>;
    config: InputConfig;
  }): Promise<void> {
    var token = getToken(this.serverType);
    if (context.length == 0) {
      return await onMessage({
        error: true,
        end: true,
        text: '请勿发送空内容。',
      });
    }
    if (!token.current) {
      return await onMessage({
        error: true,
        end: true,
        text: '请填写API key后继续使用。',
      });
    }
    await onMessage({
      end: false,
      error: false,
      text: '',
    });
    this.tokens.openai!.apiKey = token.current;
    nextToken(token);
    await this.generateChatStream(context, config, onMessage);
  }
  async generateChatStream(
    context: ChatCompletionRequestMessage[],
    config: InputConfig,
    onMessage: (msg: { error: boolean; text: string; reasoning_content: string; end: boolean; stop?: () => void }) => Promise<void>
  ) {
    let full_response = '';
    let reasoning_content = '';
    const headers = {
      Authorization: `Bearer ${this.tokens.openai?.apiKey}`,
      'Content-Type': 'application/json',
    };
    const data = {
      model: this.severConfig.model || config.model,
      messages: context,
      stream: true,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      top_p: config.top_p || undefined,
      n: config.n,
      frequency_penalty: config.frequency_penalty || undefined,
      presence_penalty: config.presence_penalty || undefined,
    };
    const controller = new AbortController();
    try {
      let response = await fetch(`${this.baseUrl + (this.needV1Str(this.baseUrl) ? '/v1' : '')}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (!response.ok) {
        await onMessage({
          error: true,
          end: true,
          text:
            '\n\n 请求发生错误。\n\n' +
            'token: ... ' +
            headers.Authorization.slice(Math.max(-headers.Authorization.length, -10)) +
            '\n\n' +
            response.status +
            ' ' +
            response.statusText +
            '\n\n' +
            (await response.text()),
          reasoning_content,
        });
        return;
      }
      const reader = response.body?.getReader();
      const stop = () => {
        try {
          controller.abort();
        } catch (error) {}
      };
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await onMessage({
              error: false,
              end: true,
              text: full_response,
              reasoning_content,
            });
            break;
          }
          const decodedValue = new TextDecoder('utf-8').decode(value);
          const lines = decodedValue.split('\n');
          for (const line of lines) {
            if (line.trim() === '') {
              continue;
            }
            if (line.trim() === 'data: [DONE]') {
              await onMessage({
                error: false,
                end: true,
                text: full_response,
                reasoning_content,
              });
              break;
            }
            try {
              let data;
              try {
                data = JSON.parse(line.substring(6));
              } catch (error) {
                continue;
              }
              const choices = data.choices;
              if (!choices) {
                continue;
              }
              const delta = choices[0]?.delta;
              if (!delta) {
                continue;
              }
              if ('content' in delta && delta.content && delta.content != 'null') {
                const content = delta.content;
                full_response += content;
              }
              if ('reasoning_content' in delta && delta.reasoning_content && delta.reasoning_content != 'null') {
                const content = delta.reasoning_content;
                reasoning_content += content;
              }
              await onMessage({
                error: false,
                end: false,
                text: full_response,
                reasoning_content,
                stop: stop,
              });
            } catch (error) {
              console.error(error);
              console.error('出错的内容：', line);
              continue;
            }
          }
        }
        return full_response;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        onMessage({
          error: true,
          end: true,
          text: full_response + '\n\n 请求已终止。',
          reasoning_content,
        });
      } else {
        onMessage({
          error: true,
          end: true,
          text: full_response + '\n\n 请求发生错误。\n\n' + error,
          reasoning_content,
        });
      }
    }
  }
}
