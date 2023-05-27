import { ChatCompletionRequestMessage, OpenAIApi } from "openai";

export async function generateChatStream(
  messages: Array<ChatCompletionRequestMessage>,
  model: string,
  max_tokens = 1024,
  top_p = 0.5,
  user = "user",
  apiKey: string,
  n = 1,
  temperature = 0.7,
  baseUrl = "https://chat.22733.site",
  onMessage?: (msg: {
    error: boolean;
    text: string;
    end: boolean;
    stop?: () => void;
  }) => void
) {
  let full_response = "";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const data = {
    model: model,
    messages: messages,
    stream: true,
    max_tokens,
    temperature,
    top_p,
    n,
    user: user,
  };
  const response = await fetch(
    `${baseUrl || "https://api.openai.com"}/v1/chat/completions`,
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      redirect: "follow",
      referrerPolicy: "no-referrer",
    }
  );
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
                response.clone();
              },
            });
        }
      }
    }
    return full_response;
  }
}

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
    onMessage,
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
    onMessage?: (msg: { error: boolean; end: boolean; text: string }) => void;
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
          "ngrok-skip-browser-warning": 0,
        },
        timeout: 1000 * 60 * 5,
      },
    });
    if (model.startsWith("gpt-3")) {
      return await generateChatStream(
        messages,
        model,
        max_tokens <= 0 ? undefined : max_tokens,
        top_p,
        user,
        apiKey,
        n,
        temperature,
        baseUrl,
        onMessage
      ).catch((error) => {
        return this.handleError(error);
      });
    } else if (model.startsWith("gpt-4")) {
      return await generateChatStream(
        messages,
        model,
        max_tokens <= 0 ? undefined : max_tokens,
        top_p,
        user,
        apiKey,
        n,
        temperature,
        baseUrl,
        onMessage
      ).catch((error) => {
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
    // "text-curie-001",
    // "text-babbage-001",
    // "text-ada-001",
    // "davinci",
    // "curie",
    // "babbage",
    // "ada",
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
      const response = await fetch(`${baseUrl}/v1/balance`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
        },
      });
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
