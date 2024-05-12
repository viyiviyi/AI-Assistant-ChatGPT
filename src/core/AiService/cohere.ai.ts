import { getToken, nextToken } from "@/core/tokens";
import { Message } from "@/Models/DataBase";
import axios from "axios";
import { ChatCompletionRequestMessage } from "openai";
import { KeyValueData } from "../db/KeyValueData";
import { CtxRole } from "./../../Models/CtxRole";
import { IAiService, InputConfig } from "./IAiService";
import { aiServiceType, ServiceTokens } from "./ServiceProvider";
export class CohereAi implements IAiService {
  customContext = true;
  history = undefined;
  baseUrl: string;
  tokens: ServiceTokens;
  severConfig: { connectors?: any[] } = {};
  constructor(baseUrl: string, tokens: ServiceTokens) {
    this.baseUrl = baseUrl;
    this.tokens = tokens;
    this.severConfig =
      KeyValueData.instance().getAiServerConfig(this.serverType) || {};
  }
  serverType: aiServiceType = "CohereAi";
  static modelCache: string[] = [];
  setConfig = (config: any) => {
    if (typeof config === "object" && "connectors" in config) {
      if (Array.isArray(config.connectors)) {
        this.severConfig.connectors = config.connectors
          .filter((v: any) => v)
          .map((v: any) => {
            if ("id" in v) {
              return { id: v.id };
            }
          });
        KeyValueData.instance().setAiServerConfig({
          [this.serverType]: this.severConfig,
        });
      }
    }
  };
  models = async () => {
    if (CohereAi.modelCache.length) return CohereAi.modelCache;
    var token = getToken(this.serverType);
    if (!token.current) {
      nextToken(token);
      return [];
    }
    return axios
      .get(this.baseUrl + "/v1/models", {
        headers: { Authorization: `Bearer ${this.tokens.openai?.apiKey}` },
      })
      .then((res) => res.data)
      .then(
        (res: {
          models: [
            {
              name: "string";
              endpoints: ["chat"];
              finetuned: true;
              context_length: 0;
              tokenizer_url: "string";
              default_endpoints: ["chat"];
            }
          ];
        }) => {
          CohereAi.modelCache = (res.models || []).map((m) => m.name);
          return CohereAi.modelCache;
        }
      )
      .catch((err) => this.defaultModels);
  };
  defaultModels = ["command-r-plus"];
  getCurrentConnectors = () => {
    return this.severConfig.connectors || [];
  };
  async getConnectors(): Promise<{ name: string; id: string }[]> {
    var token = getToken(this.serverType);
    if (!token.current) {
      nextToken(token);
      return [];
    }
    return await axios
      .get(this.baseUrl + "/v1/connectors", {
        headers: { Authorization: `Bearer ${this.tokens.openai?.apiKey}` },
      })
      .then((res) => res.data)
      .then((res: { connectors: any[] }) => {
        return res.connectors;
      })
      .catch((err) => []);
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
    if (context.slice(-1)[0].role != "user") {
      return onMessage({
        error: true,
        end: true,
        text: "最后一条消息的身份必须是用户，请注意设定内的最后一条设定的身份。",
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
  getrRoleName(role: CtxRole): "USER" | "CHATBOT" | "SYSTEM" {
    if (role == "user") return "USER";
    if (role == "assistant") return "CHATBOT";
    if (role == "system") return "SYSTEM";
    return "USER";
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
      chat_history: context.slice(0, context.length - 1).map((ctx) => ({
        role: this.getrRoleName(ctx.role),
        message: ctx.content,
      })),
      message: context.slice(-1)[0].content,
      connectors: [...(this.severConfig.connectors || [])],
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      frequency_penalty: config.frequency_penalty
        ? config.frequency_penalty
        : undefined,
      presence_penalty: config.frequency_penalty
        ? undefined
        : config.presence_penalty,
      model: config.model,
      p: config.top_p,
      stream: true,
    };
    const controller = new AbortController();
    try {
      let response = await fetch(`${this.baseUrl}/v1/chat`, {
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
            try {
              let data;
              try {
                data = JSON.parse(line);
              } catch (error) {
                continue;
              }
              if (data.event_type == "stream-end") {
                await onMessage({
                  error: false,
                  end: true,
                  text: full_response,
                });
                break;
              }
              if (data.event_type == "text-generation") {
                const content = data.text;
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
