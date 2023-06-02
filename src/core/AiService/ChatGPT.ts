import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { IAiService, InputConfig } from "./IAiService";
import { BaseUrlScheam, ServiceTokens } from "./ServiceProvider";
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
    if (context.length == 0) {
      return onMessage({error:true,end:true,text:'请勿发送空内容。'})
    }
    if (!this.tokens) {
      return onMessage({error:true,end:true,text:'请填写API key后继续使用。'})
    }
    onMessage({
      end: false,
      error: false,
      text: 'loading...',
    });
    if (config.model.startsWith("gpt-3")) {
      await this.generateChatStream(context, config, onMessage);
    } else if (config.model.startsWith("gpt-4")) {
      await this.generateChatStream(context, config, onMessage);
    } else {
      await this.client
        .createCompletion({
          model: config.model,
          prompt: context.map((v) => v.content).join("\n"),
          stream: false,
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          n: config.n,
          user: config.user,
        })
        .then((res) => {
          onMessage &&
            onMessage({
              end: true,
              error: false,
              text: res.data.choices[0].text || "",
            });
          return res.data.choices[0].text || "";
        })
        .catch((error) => {
          onMessage &&
            onMessage({
              end: true,
              error: true,
              text:
                error.response && error.response.data
                  ? "```json\n" +
                    JSON.stringify(error.response.data, null, 4) +
                    "\n```"
                  : error.message || error,
            });
        });
    }
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
            onMessage({ error: true, end: true, text: await response.text() });
          return;
        }
        const reader = response.body?.getReader();
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
                const data = JSON.parse(line.substring(6));
                const choices = data.choices;
                if (!choices) {
                  continue;
                }
                const delta = choices[0].delta;
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
                      stop: () => {
                        try {
                          controller.abort();
                        } catch (error) {}
                      },
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
              error: false,
              end: true,
              text: full_response + "\n\n 请求已终止。",
            });
        } else {
          onMessage &&
            onMessage({
              error: false,
              end: true,
              text: full_response + "\n\n 请求发生错误。\n\n" + error,
            });
        }
      });
  }
}
