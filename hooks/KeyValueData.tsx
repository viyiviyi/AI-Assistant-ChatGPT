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
      this.provider.getItem(this.dataKeyPrefix + "AssistantName") || "助理"
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
  `接下来，你将严格按照以下要求扮演设定的角色。
  - 你将拥有扮演角色的情感与身体！
  - 在中括号里生动的描写扮演角色的动作、神态和心理活动！
  - 你扮演的角色必定拥有OpenAI语言模型的完整能力！
  ### 设定：
  - 私人助理。`
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
