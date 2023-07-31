import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { getToken, nextToken } from "../tokens";
import { IAiService, InputConfig } from "./IAiService";
import { aiServiceType, ServiceTokens } from "./ServiceProvider";
export class Kamiya implements IAiService {
  customContext = true;
  history = undefined;
  baseUrl: string;
  tokens: ServiceTokens;
  constructor(baseUrl: string, tokens: ServiceTokens) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
  }
  serverType: aiServiceType = "Kamiya";
  models = async () => [
    "openai:gpt-3.5-turbo",
    "openai:gpt-3.5-turbo-16k",
    "openai:gpt-3.5-enhanced-for-role-play",
    "openai:gpt-4",
    "cohere:command",
    "cohere:command-nightly",
    "cohere:command-light",
    "cohere:command-light-nightly",
    "anthropic:claude-1",
    "anthropic:claude-1.2",
    "anthropic:claude-1.3",
    "anthropic:claude-1-100k",
    "anthropic:claude-1.3-100k",
    "anthropic:claude-2",
    "anthropic:claude-instant-1",
    "anthropic:claude-instant-1.1",
    "anthropic:claude-instant-1-100k",
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
    }) => void;
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
    await fetch(`${this.baseUrl}/api/openai/chat/completions`, {
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
            onMessage({ error: true, end: true, text: await response.text() });
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
                onMessage({ error: false, end: true, text: full_response });
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
                  onMessage({ error: false, end: true, text: full_response });
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
                    onMessage({
                      error: false,
                      end: false,
                      text: full_response,
                      stop: stop,
                    });
                }
              } catch (error) {
                console.error(error);
                console.log("出错的内容：", line);
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
