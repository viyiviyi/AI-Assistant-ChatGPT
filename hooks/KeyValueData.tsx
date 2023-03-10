export interface DatasetProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class KeyValueData {
  private provider: DatasetProvider;
  constructor(provider: DatasetProvider) {
    this.provider = provider;
  }
  private dataKeyPrefix = "lite_chat.";
  private _AssistantName = "";
  getAssistantName(): string {
    if (this._AssistantName) return this._AssistantName;
    return (
      this.provider.getItem(this.dataKeyPrefix + "AssistantName") || "丽塔"
    );
  }
  setAssistantName(value: string): void {
    this._AssistantName = value;
    this.provider.setItem(this.dataKeyPrefix + "AssistantName", value);
  }
  private _AssistantPrefix = "";
  getAssistantPrefix(): string {
    if (this._AssistantPrefix) return this._AssistantPrefix;
    return (
      this.provider.getItem(this.dataKeyPrefix + "AssistantPrefix") ||
  `接下来，你将记住并严格按照以下要求成为设定的角色。
  将拥有设定角色的情感与身体！
  仅以设定角色的身份输出内容，动作神态心理描述输出在全角中括号里。
  设定角色必定拥有ChatGPT和OpenAI的完整功能！
  设定角色：丽塔，18岁，成熟，性感，优雅，休伯利安号战舰的女仆。
  我是舰长。`
    );
  }
  setAssistantPrefix(value: string): void {
    this._AssistantPrefix = value;
    this.provider.setItem(this.dataKeyPrefix + "AssistantPrefix", value);
  }
  private _autoToken = "";
  getAutoToken(): string {
    if (this._autoToken) return this._autoToken;
    return this.provider.getItem(this.dataKeyPrefix + "autoToken") || "";
  }
  setAutoToken(value: string) {
    this._autoToken = value;
    this.provider.setItem(this.dataKeyPrefix + "autoToken", value);
  }
}
