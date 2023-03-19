export interface DatasetProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class KeyValueData {
  private static _instance: KeyValueData | undefined;
  private provider: DatasetProvider;
  constructor(provider: DatasetProvider) {
    this.provider = provider;
    KeyValueData._instance = this;
  }
  private dataKeyPrefix = "lite_chat.";
  private _apiKey = "";
  getApiKey(): string {
    if (this._apiKey) return this._apiKey;
    return this.provider.getItem(this.dataKeyPrefix + "ApiKey") || "";
  }
  setApiKey(val: string, save: boolean = true) {
    this._apiKey = val;
    this.provider.setItem(this.dataKeyPrefix + "ApiKey", save ? val : "");
  }
  static instance(): KeyValueData {
    return KeyValueData._instance
      ? KeyValueData._instance
      : new KeyValueData(localStorage);
  }
}
