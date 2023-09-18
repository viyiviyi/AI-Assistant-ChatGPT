import { nextToken } from "@/core/tokens";
import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { getToken } from "../tokens";
import { IAiService, InputConfig } from "./IAiService";
import { aiServiceType, ServiceTokens } from "./ServiceProvider";
export class QWen implements IAiService {
  customContext = true;
  history = undefined;
  baseUrl: string;
  tokens: ServiceTokens;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.tokens = {};
  }
  serverType: aiServiceType = "QWen";
  models = async () => ["qwen-turbo", "qwen-plus"];
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
    var token = getToken(this.serverType);
    const currentToken = token.current;
    nextToken(token);
    if (!currentToken) {
      return onMessage({
        error: true,
        end: true,
        text: "缺少 token (API-KEY)",
      });
    }
    onMessage({
      end: false,
      error: false,
      text: "",
    });
    await this.generateChatStream(context, config, currentToken, onMessage);
  }
  context2history(
    context: ChatCompletionRequestMessage[]
  ): Array<{ user: string; bot: string }> {
    let history: Array<{ user: string; bot: string }> = [];
    let lastItem: ChatCompletionRequestMessage | undefined = undefined;
    context.forEach((v) => {
      if (v.role != "user") {
        history.push({ bot: v.content, user: lastItem?.content || "" });
        lastItem = undefined;
      } else {
        if (lastItem) {
          history.push({ bot: "", user: lastItem?.content || "" });
        }
        lastItem = v;
      }
    });
    // 最后 lastItem 内可能有一条user的消息，刚好是不需要的
    return history;
  }
  async generateChatStream(
    context: ChatCompletionRequestMessage[],
    config: InputConfig,
    apiKey: string,
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
      Authorization: "Bearer " + apiKey,
      "X-DashScope-SSE": "enable",
    };
    const data = {
      model: config.model,
      input: {
        prompt: context.length ? context.slice(-1)[0].content : "",
        history: this.context2history(context),
        parameters: {
          top_k: config.temperature,
          top_p: config.top_p,
          seed: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER - 1),
        },
      },
    };
    const controller = new AbortController();
    await fetch(
      `${this.baseUrl}/api/v1/services/aigc/text-generation/generation`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        redirect: "follow",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      }
    )
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
            // let d = {
            //   output: { finish_reason: "null", text: "最近" },
            //   usage: { output_tokens: 3, input_tokens: 85 },
            //   request_id: "1117fb64-5dd9-9df0-a5ca-d7ee0e97032d",
            // };
            for (const line of lines) {
              if (line.trim() === "") {
                continue;
              }
              console.log(line);
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
                  data = JSON.parse(line.substring(5));
                } catch (error) {
                  continue;
                }
                const output = data.output;
                if (!output) {
                  if (data.code) {
                    return (
                      onMessage &&
                      (await onMessage({
                        error: false,
                        end: true,
                        text:
                          "```json\n" + JSON.stringify(data, null, 4) + "\n```",
                      }))
                    );
                  }
                  continue;
                }
                const finish_reason = output.finish_reason;
                if (finish_reason == "stop") {
                  onMessage &&
                    (await onMessage({
                      error: false,
                      end: true,
                      text: full_response,
                    }));
                  break;
                }
                const text = output.text;
                if (!text) {
                  continue;
                }
                full_response = text;
                onMessage &&
                  (await onMessage({
                    error: false,
                    end: false,
                    text: full_response,
                    stop: stop,
                  }));
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
