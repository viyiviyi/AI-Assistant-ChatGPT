import { CtxItem } from '@/Models/CtxItem';
import { Message } from '@/Models/DataBase';
import axios from 'axios';
import { ChatManagement } from '../ChatManagement';
import { IAiService, InputConfig } from './IAiService';
import { aiServiceType, ServiceTokens } from './ServiceProvider';

interface ChatRequest {
  prompt: string;
  history: [string, string][];
  max_length?: number;
  top_p?: number;
  temperature?: number;
}

interface ChatResponse {
  response: string;
  history: string[];
  time: string;
}

export class ChatGLM_API implements IAiService {
  customContext = true;
  history = undefined;
  baseUrl: string;
  tokens: ServiceTokens;
  serverType: aiServiceType = 'Oauther';
  constructor(baseUrl: string, tokens: ServiceTokens) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
  }
  severConfig: any;
  setConfig?: ((config: any) => void) | undefined;
  models = async () => [];

  async sendMessage({
    msg,
    context,
    onMessage,
    config,
  }: {
    msg: Message;
    context: CtxItem[];
    onMessage: (msg: { error: boolean; text: string | string[]; end: boolean; stop?: (() => void) | undefined }) => Promise<void>;
    config: InputConfig;
  }): Promise<void> {
    if (context.length == 0) {
      return onMessage({ error: true, end: true, text: '请勿发送空内容。' });
    }
    if (!this.baseUrl) {
      return onMessage({
        error: true,
        end: true,
        text: '请使用ChatGLM官方项目 [https://github.com/THUDM/ChatGLM2-6B](https://github.com/THUDM/ChatGLM2-6B) 部署后把部署的地址填入 设置 > 网络配置 > 自定义服务地址',
      });
    }
    await this.chat(this.baseUrl, {
      prompt: ChatManagement.getMsgContent(msg),
      history: this.convert_to_history(context),
      max_length: (config.max_tokens || 2048) * 10,
      top_p: config.top_p,
      temperature: config.temperature,
    })
      .then((res) => {
        onMessage({ error: false, text: res.response, end: true });
      })
      .catch((err) => {
        return onMessage({
          error: true,
          end: true,
          text: '出错了\n' + err,
        });
      });
  }
  convert_to_history(data: CtxItem[]): [string, string][] {
    const messages: [string, string][] = [];
    let user = '';
    let assistant = '';
    for (const item of data) {
      if (item.role === 'user' || item.role === 'system') {
        user = item.content || '';
      } else if (item.role === 'assistant') {
        assistant = item.content || '';
      }
      if (assistant) {
        messages.push([user, assistant]);
        user = '';
        assistant = '';
      }
    }
    return messages;
  }
  async chat(baseUrl: string, request: ChatRequest): Promise<ChatResponse> {
    const { prompt, history, max_length, top_p, temperature } = request;
    const url = '/';
    const json_post = JSON.stringify({
      prompt,
      history,
      max_length,
      top_p,
      temperature,
    });
    const response = await axios.post(baseUrl + url, json_post);
    const { response: chatResponse, history: newHistory } = response.data;
    const now = new Date();
    const time = now.toISOString();
    return { response: chatResponse, history: newHistory, time };
  }
}
