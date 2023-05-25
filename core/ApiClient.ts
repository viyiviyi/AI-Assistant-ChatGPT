import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
export class ApiClient {
  static async chatGpt({
    messages,
    model,
    max_tokens = 1024,
    top_p = 0.5,
    user = "user",
    apiKey,
    n,
    temperature = 0.7,
    baseUrl = "https://chat.22733.site",
  }: {
    messages: Array<ChatCompletionRequestMessage>;
    model: string;
    max_tokens?: number;
    top_p?: number;
    temperature?: number;
    user?: string;
    apiKey: string;
    n?: number;
    baseUrl?: string;
  }): Promise<string> {
    baseUrl = baseUrl || "https://chat.22733.site";
    const client = new OpenAIApi({
      basePath: baseUrl + "/v1",
      apiKey: apiKey,
      isJsonMime: (mime: string) => {
        return true;
      },
      baseOptions: {
        headers: {
          Authorization: "Bearer " + apiKey,
          "ngrok-skip-browser-warning":0
        },
        timeout: 1000 * 60 * 5,
      },
    });
    if (model.startsWith("gpt-3")) {
      return await client
        .createChatCompletion({
          model,
          messages,
          stream: false,
          temperature,
          top_p,
          max_tokens: max_tokens <= 0 ? undefined : max_tokens,
          n,
          user,
        })
        .then((res) => {
          return res.data.choices[0].message?.content || "";
        })
        .catch((error) => {
          return this.handleError(error);
        });
    } else if (model.startsWith("gpt-4")) {
      return await client
        .createChatCompletion({
          model,
          messages,
          stream: false,
          temperature,
          top_p,
          max_tokens: max_tokens <= 0 ? undefined : max_tokens,
          n,
          user,
        })
        .then((res) => {
          return res.data.choices[0].message?.content || "";
        })
        .catch((error) => {
          return this.handleError(error);
        });
    } else {
      return await client
        .createCompletion({
          model,
          prompt: messages.map((v) => v.content).join("\n"),
          stream: false,
          temperature,
          top_p,
          max_tokens: max_tokens <= 0 ? undefined : max_tokens,
          n,
          user,
        })
        .then((res) => {
          return res.data.choices[0].text || "";
        })
        .catch((error) => {
          return this.handleError(error);
        });
    }
  }
  private static handleError(error: any) {
    return error.response && error.response.data
      ? "```json\n" + JSON.stringify(error.response.data, null, 4) + "\n```"
      : error.message || error;
  }
  public static textModels = [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0301",
    "gpt-4",
    "gpt-4-0314",
    "gpt-4-32k",
    "gpt-4-32k-0314",
    "text-davinci-003",
    "text-davinci-002	",
    "text-curie-001",
    "text-babbage-001",
    "text-ada-001",
    "davinci",
    "curie",
    "babbage",
    "ada",
  ];
  static async getModelList(
    apiKey: string,
    baseUrl = "https://chat.22733.site",
    modelType: "text" = "text"
  ): Promise<string[]> {
    baseUrl = baseUrl || "https://chat.22733.site";
    const client = new OpenAIApi({
      basePath: baseUrl + "/v1",
      apiKey: apiKey,
      isJsonMime: (mime: string) => {
        return true;
      },
      baseOptions: {
        headers: {
          Authorization: "Bearer " + apiKey,
        },
      },
    });
    return await client
      .listModels()
      .then((res) => {
        const cm = res.data.data.map((m) => m.id);
        if (modelType == "text") {
          return this.textModels.filter((f) => {
            return cm.includes(f);
          });
        }
        return [];
      })
      .catch((err) => {
        if (modelType == "text") {
          return this.textModels;
        }
        return [];
      });
  }
  static callbackList: {
    [key: string]: ((result?: string, error?: any) => void) | undefined;
  } = {};

  static async getOpanAIBalance(
    apiKey: string,
    baseUrl = "https://chat.22733.site"
  ): Promise<string> {
    baseUrl = baseUrl || "https://chat.22733.site";
    try {
      const response = await fetch(
        `${baseUrl}/v1/balance`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
        }
      );
      const account: OpanAIAccount = await response.json();
      return account.total_available;
    } catch (err) {
      return "error";
    }
  }
}

interface OpanAIAccount {
  total_available: string;
}
