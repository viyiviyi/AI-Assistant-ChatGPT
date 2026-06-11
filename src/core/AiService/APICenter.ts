import { getToken, nextToken } from '@/core/tokens';
import { CtxItem } from '@/Models/CtxItem';
import { GptConfig, Message } from '@/Models/DataBase';
import axios from 'axios';
import { ListModelsResponse, OpenAIApi } from 'openai';
import { AiServerConf, ApiVendorType } from '../db/KeyValueData';
import { safeJsonParse } from '../utils/ObjectToText';
import { IAiService, InputConfig } from './IAiService';
import { aiServiceType, ServiceTokens } from './ServiceProvider';
export class APICenter implements IAiService {
  customContext = true;
  history = undefined;
  client: OpenAIApi;
  baseUrl: string;
  tokens: ServiceTokens;
  tools?: any[];
  vendorType?: ApiVendorType;
  compatibleOnly1System?: boolean;
  compatibleNoToolImg?: boolean;
  constructor(
    baseUrl: string,
    tokens: ServiceTokens,
    config?: GptConfig,
    tools?: any[],
    vendorType?: ApiVendorType,
    compatibleOnly1System?: boolean,
    compatibleNoToolImg?: boolean,
  ) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
    this.client = new OpenAIApi();
    this.severConfig = config?.aiServerConfig || { model: '' };
    this.tools = tools;
    this.vendorType = vendorType;
    this.compatibleOnly1System = compatibleOnly1System;
    this.compatibleNoToolImg = compatibleNoToolImg;
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
  qwen3Models = [
    'qwen3-235b-a22b',
    'qwen3-30b-a3b',
    'qwen3-32b',
    'qwen3-14b',
    'qwen3-8b',
    'qwen3-4b',
    'qwen3-1.7b',
    'qwen3-0.6b',
    'qwen-plus-latest',
    'qwen-turbo-2025-04-28',
    'qwen-plus-2025-04-28',
    'qwen-turbo-latest',
    'qwq-plus',
    'qwq-plus-2025-03-05',
    'qwq-plus-latest',
  ];
  models = async () => {
    if (this.modelCache.length) return this.modelCache.sort();
    var token = getToken(this.serverType);
    if (!token.current) {
      nextToken(token);
      return [];
    }
    return axios
      .get(this.baseUrl + (this.needV1Str(this.baseUrl) ? '/v1' : '') + '/models?t=' + Date.now(), {
        headers: { Authorization: 'Bearer ' + token.current },
        timeout: 1000 * 60 * 5,
        responseType: 'json',
      })
      .then((res) => res.data)
      .then((res: ListModelsResponse) => {
        this.modelCache = [];
        (res.data || []).forEach((m) => {
          if (!this.modelCache.includes(m.id)) this.modelCache.push(m.id);
        });
        if (this.baseUrl.includes('https://dashscope.aliyuncs.com/compatible-mode')) {
          this.qwen3Models.forEach((v) => {
            if (!this.modelCache.includes(v)) {
              this.modelCache.push(v);
            }
          });
        }
        return this.modelCache.sort();
      })
      .catch((e) => {
        if (this.modelCache.length) return this.modelCache.sort();
        return [];
      });
  };
  async sendMessage({
    context,
    onMessage,
    config,
  }: {
    msg: Message;
    context: CtxItem[];
    onMessage: (msg: {
      error: boolean;
      text: string | string[];
      reasoning_content?: string | string[];
      tool_calls?: any[];
      end: boolean;
      stop?: (() => void) | undefined;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details: { cached_tokens: number };
        prompt_cache_hit_tokens: number;
        prompt_cache_miss_tokens: number;
      };
    }) => Promise<void>;
    config: InputConfig;
  }): Promise<void> {
    var token = getToken(this.serverType);
    if (context.length == 0) {
      return await onMessage({
        error: true,
        end: true,
        text: ['请勿发送空内容。'],
      });
    }
    if (!token.current) {
      return await onMessage({
        error: true,
        end: true,
        text: ['请填写API key后继续使用。'],
      });
    }
    await onMessage({
      end: false,
      error: false,
      text: [''],
    });
    this.tokens.openai!.apiKey = token.current;
    nextToken(token);
    if (this.compatibleNoToolImg) {
      context.forEach((f) => {
        if (f.role == 'tool' && Array.isArray(f.content)) {
          f.role = 'user';
        }
      });
    }
    if (this.compatibleOnly1System && context.length > 1) {
      let c: CtxItem[] = [context[0]];
      let lastRelu = context[0].role;
      context.forEach((v, i) => {
        if (i == 0) return;
        if (v.role == 'system' && typeof c[0].content == 'string') {
          if (lastRelu != v.role) {
            v.role = 'user';
          } else {
            c[0].content += '\n\n';
            c[0].content += v.content;
            return;
          }
        }
        lastRelu = v.role;
        c.push(v);
      });
      context = c;
    }
    await this.generateChatStream(context, config, onMessage);
  }
  isAnthropicAPI() {
    // 如果显式指定了供应商类型，优先使用配置
    if (this.vendorType === 'anthropic') return true;
    if (this.vendorType === 'openai') return false;
    // 否则自动检测（向后兼容）
    return this.baseUrl.includes('/anthropic');
  }

  // 将OpenAI格式的消息转换为Anthropic格式
  convertToAnthropicFormat(context: CtxItem[]) {
    const messages: any[] = [];
    let systemMessage = '';

    // 分离system消息
    let lastRule = '';
    for (const item of context) {
      if (item.role === 'system') {
        if (systemMessage) {
          systemMessage += '\n\n' + item.content;
        } else {
          systemMessage = item.content as string;
        }
      } else {
        // 转换其他消息格式
        const message: any = {
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: [],
        };
        if (item.reasoning_details && item.role === 'assistant') {
          message.content.push({
            type: 'thinking',
            text: item.reasoning_details,
          });
        }
        if (typeof item.content === 'string') {
          if (item.role == 'tool' && lastRule == item.role) {
            // Anthropic 有多个调用时，返回的结果需要在一个user消息内
            const lastMsg = messages[messages.length - 1];
            lastMsg.content.push({
              type: item.role == 'tool' ? 'tool_result' : 'text',
              tool_use_id: item.tool_call_id,
              is_error: item.content.includes('"success":false') || item.content.includes('"success": false'),
              name: item.tool_call_name,
              ...(item.role == 'tool' ? { content: item.content } : { text: item.content }),
            });
            lastRule = item.role;
            continue;
          } else {
            message.content.push({
              type: item.role == 'tool' ? 'tool_result' : 'text',
              tool_use_id: item.tool_call_id,
              is_error: item.content.includes('"success":false') || item.content.includes('"success": false'),
              name: item.tool_call_name,
              ...(item.role == 'tool' ? { content: item.content } : { text: item.content }),
            });
          }
        } else if (Array.isArray(item.content)) {
          // 处理多模态内容
          for (const contentItem of item.content) {
            if (typeof contentItem === 'string') {
              message.content.push({
                type: item.role == 'tool' ? 'tool_result' : 'text',
                tool_use_id: item.tool_call_id,
                is_error: false,
                name: item.tool_call_name,
                ...(item.role == 'tool' ? { content: contentItem } : { text: contentItem }),
              });
            } else if (contentItem.type === 'image_url' && contentItem.image_url && contentItem.image_url.url) {
              // 转换图像格式
              const imageUrl = contentItem.image_url.url;
              if (imageUrl.startsWith('data:image')) {
                const matches = imageUrl.match(/data:image\/(\w+);base64,(.+)/);
                if (matches) {
                  message.content.push({
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: `image/${matches[1]}`,
                      data: matches[2],
                    },
                  });
                }
              }
            }
          }
        }
        if (item.tool_calls && item.role === 'assistant' && item.tool_calls.length) {
          item.tool_calls.forEach((v) => {
            message.content.push({
              type: 'tool_use',
              id: v.id,
              tool_use_id: v.id,
              name: v.function.name,
              input: safeJsonParse(v.function.arguments),
            });
          });
        }
        lastRule = item.role;
        messages.push(message);
      }
    }

    return {
      messages,
      system: systemMessage || undefined,
    };
  }

  // 转换工具格式
  convertToolsToAnthropicFormat(tools: any[]) {
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  // 解析Anthropic流式响应
  parseAnthropicStreamLine(line: string, full_response: string[], reasoning_content: string[], tool_calls: any[], isToolCall: boolean) {
    if (!line.startsWith('data: ')) return { success: false, isToolCall };

    try {
      const data = JSON.parse(line.substring(6));

      if (data.type === 'content_block_delta') {
        const delta = data.delta;
        if (delta.type === 'text_delta') {
          // 普通文本内容
          full_response[0] = (full_response[0] || '') + delta.text;
        } else if (delta.type === 'input_json_delta') {
          // 工具参数更新
          if (tool_calls[0] && tool_calls[0].length > 0) {
            const lastTool = tool_calls[0][tool_calls[0].length - 1];
            lastTool.function.arguments = (lastTool.function.arguments || '') + data.delta.partial_json;
          }
        } else if (delta.type === 'thinking_delta') {
          // 思考内容
          reasoning_content[0] = (reasoning_content[0] || '') + delta.thinking;
        }
      } else if (data.type === 'message_start') {
        // 消息开始，可以处理metadata
      } else if (data.type === 'message_delta') {
        // 消息结束，可以处理usage
      } else if (data.type === 'content_block_start') {
        // 内容块开始
        if (data.content_block.type === 'tool_use') {
          isToolCall = true;
          tool_calls[0] = tool_calls[0] || [];
          tool_calls[0].push({
            id: data.content_block.id,
            type: 'function',
            function: { arguments: '', name: data.content_block.name },
          });
        } else if (data.content_block.type === 'thinking') {
          // 思考内容块开始
          reasoning_content[0] = reasoning_content[0] || '';
        }
      }
      return { success: true, isToolCall };
    } catch (error) {
      return { success: false, isToolCall };
    }
  }
  async generateChatStream(
    context: CtxItem[],
    config: InputConfig,
    onMessage: (msg: {
      error: boolean;
      text: string[];
      reasoning_content: string[];
      tool_calls?: any[];
      end: boolean;
      stop?: () => void;
      isToolCall?: boolean;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details: { cached_tokens: number };
        prompt_cache_hit_tokens: number;
        prompt_cache_miss_tokens: number;
      };
    }) => Promise<void>,
  ) {
    let full_response: string[] = [];
    let reasoning_content: string[] = [];
    let isToolCall = false;
    let tool_calls: any[] = [];
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${this.tokens.openai?.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.baseUrl.includes('https://openrouter.ai/')) {
      Object.assign(headers, { 'HTTP-Referer': 'https://eaias.com', 'X-Title': 'eaias.com' });
    }
    // 检查是否为Anthropic API
    const isAnthropic = this.isAnthropicAPI();

    let data: any;
    let endpoint: string;

    if (isAnthropic) {
      // Anthropic API格式
      const anthropicFormat = this.convertToAnthropicFormat(context);
      data = {
        model: this.severConfig.model || config.model,
        messages: anthropicFormat.messages,
        stream: true,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        top_p: config.top_p || undefined,
        top_k: config.top_k || undefined,
        // Anthropic不支持frequency_penalty和presence_penalty
      };

      // 添加system消息
      if (anthropicFormat.system) {
        data.system = anthropicFormat.system;
      }

      // 添加工具
      if (this.tools && this.tools.length) {
        data.tools = this.convertToolsToAnthropicFormat(this.tools);
      }

      endpoint = '/messages';
    } else {
      // OpenAI兼容格式
      data = {
        model: this.severConfig.model || config.model,
        messages: context,
        stream: true,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        top_p: config.top_p || undefined,
        n: config.n,
        frequency_penalty: config.frequency_penalty || undefined,
        presence_penalty: config.presence_penalty || undefined,
        tools: this.tools && this.tools.length ? this.tools : undefined,
        tool_choice: this.tools && this.tools.length ? 'auto' : undefined,
      };
      endpoint = '/chat/completions';
    }
    if (config.modelArgs?.length) {
      config.modelArgs
        .filter((f) => f.enable && f.modelName == this.serverType)
        .forEach(({ value: argStr }) => {
          if (argStr) {
            try {
              const args = JSON.parse(argStr);
              Object.assign(data, args);
            } catch (error) {}
          }
        });
    }
    const controller = new AbortController();
    try {
      // 构建请求URL
      const basePath = this.baseUrl + (this.needV1Str(this.baseUrl) ? '/v1' : '');
      const requestUrl = `${basePath}${endpoint}`;

      // 对于Anthropic API，需要添加特定的版本头
      if (isAnthropic) {
        headers['anthropic-version'] = '2023-06-01';
        headers['x-api-key'] = this.tokens.openai?.apiKey || '';
        // Anthropic使用x-api-key而不是Bearer token
        delete headers.Authorization;
      }

      let response = await fetch(requestUrl, {
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
          text: [
            '\n\n 请求发生错误。\n\n' +
              'token: ... ' +
              this.tokens.openai?.apiKey.slice(Math.max(-this.tokens.openai?.apiKey.length, -10)) +
              '\n\n' +
              response.status +
              '  ' +
              response.statusText +
              '\n```\n' +
              (await response.text()),
          ],
          reasoning_content,
        });
        return;
      }
      let isError = false;
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
              tool_calls,
              isToolCall,
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
              break;
            }

            if (isAnthropic) {
              // 处理Anthropic流式响应
              const result = this.parseAnthropicStreamLine(line, full_response, reasoning_content, tool_calls, isToolCall);
              isError = !result.success;
              isToolCall = result.isToolCall;
              await onMessage({
                error: !result.success,
                end: false,
                text: full_response,
                reasoning_content,
                stop: stop,
                usage: undefined, // Anthropic流式响应中不包含usage
                isToolCall,
              });
            } else {
              // 处理OpenAI兼容流式响应
              try {
                let data;
                try {
                  data = JSON.parse(line.substring(6));
                } catch (error) {
                  continue;
                }
                if (data.error) {
                  console.error(data.error);
                  full_response = [data.error?.message ? data.error?.message : data.error];
                  continue;
                }
                const choices: any[] = data.choices;
                if (!choices || choices.length == 0) {
                  continue;
                }
                for (let i = 0; i < choices.length; i++) {
                  const choice = choices[i];
                  const delta = choice.delta;
                  if (!delta) {
                    continue;
                  }
                  if ('content' in delta && delta.content && delta.content != 'null') {
                    const content = delta.content;
                    full_response[i] = (full_response[i] || '') + content;
                  }
                  if ('reasoning_content' in delta && delta.reasoning_content && delta.reasoning_content != 'null') {
                    const content = delta.reasoning_content;
                    reasoning_content[i] = (reasoning_content[i] || '') + content;
                  }
                  if ('tool_calls' in delta && delta.tool_calls && delta.tool_calls != 'null') {
                    isToolCall = true;
                    const content = delta.tool_calls;
                    if (tool_calls[i]) {
                      if (Array.isArray(content)) {
                        content.forEach((func) => {
                          // 使用 func.index 来找到对应的 tool_call，而不是用数组索引
                          const targetIndex = func.index !== undefined ? func.index : 0;
                          if (!tool_calls[i][targetIndex]) {
                            // 初始化新的 tool_call
                            tool_calls[i][targetIndex] = {
                              id: func.id || '',
                              type: func.type || 'function',
                              function: {
                                name: func.function?.name || '',
                                arguments: func.function?.arguments || '',
                              },
                            };
                          } else {
                            // 累积 arguments
                            if (func.id) tool_calls[i][targetIndex].id = func.id;
                            if (func.function?.name) tool_calls[i][targetIndex].function.name = func.function.name;
                            if (func.function?.arguments) tool_calls[i][targetIndex].function.arguments += func.function.arguments;
                          }
                        });
                      }
                    } else {
                      tool_calls[i] = content;
                    }
                  }
                }
                await onMessage({
                  error: false,
                  end: false,
                  text: full_response,
                  reasoning_content,
                  stop: stop,
                  usage: data.usage,
                  isToolCall,
                });
              } catch (error) {
                console.error(error);
                console.error('出错的内容：', line);
                continue;
              }
            }
          }
        }
        await onMessage({
          error: isError,
          end: true,
          text: full_response,
          reasoning_content,
          tool_calls,
          isToolCall,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        onMessage({
          error: true,
          end: true,
          text: full_response.map((v) => v + '\n\n 请求已终止。'),
          reasoning_content,
        });
      } else {
        onMessage({
          error: true,
          end: true,
          text: full_response.map((v) => v + '\n\n 请求发生错误。\n\n' + error),
          reasoning_content,
        });
      }
    }
  }
}
