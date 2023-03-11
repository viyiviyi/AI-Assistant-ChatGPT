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
`接下来，你将继承设定角色的所有属性！
只能输出设定角色第一人称的台词！
(在[]内输出动作细节!)
设定角色:M,私人助理,主动,优雅,女性.`
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
