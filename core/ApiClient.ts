export class ApiClient {
  static async chatGptV3({
    messages,
    model,
    max_tokens = 1024,
    top_p = 0.5,
    user = "user",
    api_key: token,
    n,
    temperature = 0.7,
    baseUrl = "https://chat.22733.site",
  }: {
    messages: Array<{
      role: "assistant" | "user" | "system";
      content: string;
      name: string;
    }>;
    model: string;
    max_tokens?: number;
    top_p?: number;
    temperature?: number;
    user?: string;
    api_key: string;
    n?: number;
    baseUrl?: string;
  }): Promise<string> {
    const response = await fetch(
      baseUrl.replace(/\/$/, "") + "/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          temperature,
          top_p,
          max_tokens: max_tokens <= 0 ? undefined : max_tokens,
          n,
          user,
        }),
      }
    );

    const data = await response.json();
    if (response.status !== 200) {
      throw (
        data.error || new Error(`Request failed with status ${response.status}`)
      );
    }
    return data.choices[0].message?.content;
  }

  static callbackList: {
    [key: string]: ((result?: string, error?: any) => void) | undefined;
  } = {};

  static orginUrl = "https://chat.openai.com";
  static isInit = false;
  static init() {
    if (this.isInit) return;
    window.addEventListener("message", (event) => {
      if (event.origin !== this.orginUrl) {
        return;
      }
      let { cbName } = event.data;
      if (typeof this.callbackList[cbName] == "function") {
        this.callbackList[cbName]!(event.data.result, event.data.error);
      }
    });
  }
  /**
   * 这个是用来嵌入chat.openai.com/chat时直接调用官方接口的
   */
  static async sendChatMessage({
    messages,
  }: {
    messages: Array<{
      role: "assistant" | "user" | "system";
      content: string;
      name: string;
    }>;
  }): Promise<string> {
    this.init();
    let cbName = "_cb_" + Date.now();
    return new Promise((res, rej) => {
      this.callbackList[cbName] = (result?: string, error?: any) => {
        this.callbackList[cbName] = undefined;
        if (error) return rej(error);
        if (result) res(result);
      };
      setTimeout(() => {
        this.callbackList[cbName] = undefined;
        rej("timeout");
      }, 1000 * 60);
      window.parent.postMessage({ messages, cbName }, this.orginUrl);
    });
  }
}
