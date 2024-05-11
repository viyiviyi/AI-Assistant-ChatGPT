import { getToken, nextToken } from "@/core/tokens";
import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { IAiService, InputConfig } from "./IAiService";
import { aiServiceType, ServiceTokens } from "./ServiceProvider";
export class ChatGPT implements IAiService {
  customContext = true;
  history = undefined;
  client: OpenAIApi;
  baseUrl: string;
  tokens: ServiceTokens;
  constructor(baseUrl: string, tokens: ServiceTokens) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
    this.client = new OpenAIApi({
      basePath: baseUrl + "/v1",
      apiKey: tokens.openai?.apiKey,
      isJsonMime: (mime: string) => {
        return true;
      },
      baseOptions: {
        headers: {
          Authorization: "Bearer " + tokens.openai?.apiKey,
          "ngrok-skip-browser-warning": 0,
        },
        timeout: 1000 * 60 * 5,
      },
    });
  }
  severConfig: any;
  setConfig?: ((config: any) => void) | undefined;
  serverType: aiServiceType = "ChatGPT";
  static modelCache: string[] = [];
  models = async () => {
    if (ChatGPT.modelCache.length) return ChatGPT.modelCache;
    var token = getToken(this.serverType);
    if (!token.current) {
      nextToken(token);
      return [];
    }
    this.client = new OpenAIApi({
      basePath: this.baseUrl + "/v1",
      apiKey: this.tokens.openai?.apiKey,
      isJsonMime: (mime: string) => {
        return true;
      },
      baseOptions: {
        headers: {
          Authorization: "Bearer " + token.current,
          "ngrok-skip-browser-warning": 0,
        },
        timeout: 1000 * 60 * 5,
      },
    });
    return this.client
      .listModels()
      .then((res) => res.data)
      .then((res) => {
        ChatGPT.modelCache = (res.data || [])
          .map((m) => m.id)
          .filter(
            (f) =>
              f.toLowerCase().includes("gpt") ||
              f.toLowerCase().includes("text") ||
              f.toLowerCase().includes("code")
          );
        return ChatGPT.modelCache;
      })
      .catch((err) => this.defaultModels);
  };
  defaultModels = [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0301",
    "gpt-3.5-turbo-16k",
    "gpt-3.5-turbo-0613",
    "gpt-3.5-turbo-16k-0613",
    "gpt-4",
    "gpt-4-0314",
    "gpt-4-32k",
    "gpt-4-32k-0314",
    "text-davinci-003",
    "text-davinci-002	",
  ];
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
    var token = getToken(this.serverType);
    if (context.length == 0) {
      return onMessage({ error: true, end: true, text: "请勿发送空内容。" });
    }
    if (!token.current) {
      return onMessage({
        error: true,
        end: true,
        text: "请填写API key后继续使用。",
      });
    }
    onMessage({
      end: false,
      error: false,
      text: "",
    });
    this.tokens.openai!.apiKey = token.current;
    nextToken(token);
    if (config.model.startsWith("gpt-3")) {
      await this.generateChatStream(context, config, onMessage);
    } else if (config.model.startsWith("gpt-4")) {
      await this.generateChatStream(context, config, onMessage);
    } else {
      this.client = new OpenAIApi({
        basePath: this.baseUrl + "/v1",
        apiKey: this.tokens.openai?.apiKey,
        isJsonMime: (mime: string) => {
          return true;
        },
        baseOptions: {
          headers: {
            Authorization: "Bearer " + this.tokens.openai?.apiKey,
            "ngrok-skip-browser-warning": 0,
          },
          timeout: 1000 * 60 * 5,
        },
      });
      try {
        let res = await this.client.createCompletion({
          model: config.model,
          prompt: context.map((v) => v.content).join("\n"),
          stream: false,
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          n: config.n,
          user: config.user,
          frequency_penalty: config.frequency_penalty || 0,
          presence_penalty: config.presence_penalty || 0,
        });
        await onMessage({
          end: true,
          error: false,
          text: res.data.choices[0].text || "",
        });
      } catch (error: any) {
        await onMessage({
          end: true,
          error: true,
          text:
            error.response && error.response.data
              ? "```json\n" +
                JSON.stringify(error.response.data, null, 4) +
                "\n```"
              : error.message || error,
        });
      }
    }
  }
  async generateChatStream(
    context: ChatCompletionRequestMessage[],
    config: InputConfig,
    onMessage: (msg: {
      error: boolean;
      text: string;
      end: boolean;
      stop?: () => void;
    }) => Promise<void>
  ) {
    let full_response = "";
    const headers = {
      Authorization: `Bearer ${this.tokens.openai?.apiKey}`,
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
    try {
      let response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        redirect: "follow",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      });
      if (!response.ok) {
        await onMessage({
          error: true,
          end: true,
          text:
            "\n\n 请求发生错误。\n\n" +
            "token: ... " +
            headers.Authorization.slice(
              Math.max(-headers.Authorization.length, -10)
            ) +
            "\n\n" +
            response.status +
            " " +
            response.statusText +
            "\n\n" +
            (await response.text()),
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
            });
            break;
          }
          const decodedValue = new TextDecoder("utf-8").decode(value);
          const lines = decodedValue.split("\n");
          for (const line of lines) {
            if (line.trim() === "") {
              continue;
            }
            if (line.trim() === "data: [DONE]") {
              await onMessage({
                error: false,
                end: true,
                text: full_response,
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
              if ("content" in delta) {
                const content = delta.content;
                full_response += content;
                await onMessage({
                  error: false,
                  end: false,
                  text: full_response,
                  stop: stop,
                });
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
    } catch (error: any) {
      if (error.name === "AbortError") {
        onMessage({
          error: true,
          end: true,
          text: full_response + "\n\n 请求已终止。",
        });
      } else {
        onMessage({
          error: true,
          end: true,
          text: full_response + "\n\n 请求发生错误。\n\n" + error,
        });
      }
    }
  }
}
