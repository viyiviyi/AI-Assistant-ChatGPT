export class ApiClient{
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
          max_tokens,
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
}
