import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { IAiService, InputConfig } from "./IAiService";
import { aiServiceType, ServiceTokens } from "./ServiceProvider";
export class ChatGLM_GPT implements IAiService {
  customContext = true;
  history = undefined;
  baseUrl: string;
  tokens: ServiceTokens;
  constructor(baseUrl: string, tokens: ServiceTokens) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
  }
  serverType: aiServiceType = "ChatGLM";
  models = async () => [];
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
      end: boolean;
      stop?: (() => void) | undefined;
    }) => Promise<void>;
    config: InputConfig;
  }): Promise<void> {
    if (context.length == 0) {
      return onMessage({ error: true, end: true, text: "请勿发送空内容。" });
    }
    if (!this.baseUrl) {
      return onMessage({
        error: true,
        end: true,
        text: "请使用项目 [https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle](https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle) 部署后把部署的地址填入 设置 > 网络配置 > 自定义服务地址\n\n 或使用ChatGLM官方项目[https://github.com/THUDM/ChatGLM2-6B](https://github.com/THUDM/ChatGLM2-6B) 并使用openai_api.py启动部署后把部署的地址填入 设置 > 网络配置 > 自定义服务地址",
      });
    }
    onMessage({
      end: false,
      error: false,
      text: "",
    });
    await this.generateChatStream(context, config, onMessage);
  }
  async generateChatStream(
    context: ChatCompletionRequestMessage[],
    config: InputConfig,
    onMessage?: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      stop?: () => void;
    }) => void
  ) {
    let full_response = "";
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      model: config.model,
      messages: context,
      stream: true,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      top_p: config.top_p,
      n: config.n,
      user: config.user,
      frequency_penalty: config.frequency_penalty || 0,
      presence_penalty: config.presence_penalty || 0,
    };
    const controller = new AbortController();
    await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      redirect: "follow",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          onMessage &&
            (await onMessage({
              error: true,
              end: true,
              text:
                "\n\n 请求发生错误。\n\n" +
                response.status +
                " " +
                response.statusText +
                "\n\n" +
                (await response.text()),
            }));
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
              onMessage &&
                (await onMessage({
                  error: false,
                  end: true,
                  text: full_response,
                }));
              break;
            }
            const decodedValue = new TextDecoder("utf-8").decode(value);
            const lines = decodedValue.split("\n");
            for (const line of lines) {
              if (line.trim() === "") {
                continue;
              }
              if (line.trim() === "data: [DONE]") {
                onMessage &&
                  (await onMessage({
                    error: false,
                    end: true,
                    text: full_response,
                  }));
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
                if ("content" in delta) {
                  const content = delta.content;
                  full_response += content;
                  onMessage &&
                    (await onMessage({
                      error: false,
                      end: false,
                      text: full_response,
                      stop: stop,
                    }));
                }
              } catch (error) {
                console.error(error);
                console.error("出错的内容：", line);
                continue;
              }
            }
          }
          return full_response;
        }
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          onMessage &&
            onMessage({
              error: true,
              end: true,
              text: full_response + "\n\n 请求已终止。",
            });
        } else {
          onMessage &&
            onMessage({
              error: true,
              end: true,
              text: full_response + "\n\n 请求发生错误。\n\n" + error,
            });
        }
      });
  }
}
