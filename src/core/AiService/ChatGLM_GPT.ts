import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { IAiService, InputConfig } from "./IAiService";
import { ServiceTokens } from "./ServiceProvider";
export class ChatGLM_GPT implements IAiService {
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
      apiKey: "sk-123",
      isJsonMime: (mime: string) => {
        return true;
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
      return onMessage({ error: true, end: true, text: "请勿发送空内容。" });
    }
    if (!this.baseUrl) {
      return onMessage({
        error: true,
        end: true,
        text: "请使用ChatGLM官方项 [https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle](https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle) 部署后把部署的地址填入 设置 > 网络配置 > 自定义服务地址",
      });
    }
    onMessage({
      end: false,
      error: false,
      text: "",
    });
    await this.client
      .createChatCompletion({
        messages: context,
        ...config,
        max_tokens: (config.max_tokens || 2048) * 10,
      })
      .then((res) => {
        onMessage({
          end: true,
          error: false,
          text: res.data.choices[0].message?.content || "",
        });
      })
      .catch((err) => {
        return onMessage({
          error: true,
          end: true,
          text: "出错了\n" + err,
        });
      });
  }
}
