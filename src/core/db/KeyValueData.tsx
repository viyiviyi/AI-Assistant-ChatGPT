import { aiServiceType } from "../AiService/ServiceProvider";

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
  private _slackUserToken = "";
  getSlackUserToken(): string {
    if (this._slackUserToken) return this._slackUserToken;
    return this.provider.getItem(this.dataKeyPrefix + "SlackUserToken") || "";
  }
  setSlackUserToken(val: string, save: boolean = true) {
    this._slackUserToken = val;
    this.provider.setItem(
      this.dataKeyPrefix + "SlackUserToken",
      save ? val : ""
    );
  }
  private _slackClaudeId = "";
  getSlackClaudeId(): string {
    if (this._slackClaudeId) return this._slackClaudeId;
    return this.provider.getItem(this.dataKeyPrefix + "SlackClaudeId") || "";
  }
  setSlackClaudeId(val: string, save: boolean = true) {
    this._slackClaudeId = val;
    this.provider.setItem(
      this.dataKeyPrefix + "SlackClaudeId",
      save ? val : ""
    );
  }
  private _slackProxyUrl = "";
  getSlackProxyUrl(): string {
    if (this._slackProxyUrl) return this._slackProxyUrl;
    return this.provider.getItem(this.dataKeyPrefix + "SlackProxyUrl") || "";
  }
  setSlackProxyUrl(val: string, save: boolean = true) {
    this._slackProxyUrl = val;
    this.provider.setItem(
      this.dataKeyPrefix + "SlackProxyUrl",
      save ? val : ""
    );
  }
  private _apiTransferUrl = "";
  getApiTransferUrl(): string {
    if (this._apiTransferUrl) return this._apiTransferUrl;
    return this.provider.getItem(this.dataKeyPrefix + "ApiTransfer") || "";
  }
  setApiTransferUrl(val: string, save: boolean = true) {
    this._apiTransferUrl = val;
    this.provider.setItem(this.dataKeyPrefix + "ApiTransfer", save ? val : "");
  }
  private _UIConfig: UIConfig = {};
  getUIConfig(): UIConfig {
    if (this._slackProxyUrl) return this._UIConfig;
    try {
      return JSON.parse(
        this.provider.getItem(this.dataKeyPrefix + "UIConfig") || "{}"
      );
    } catch {
      return {};
    }
  }
  setUIConfig(val: UIConfig, save: boolean = true) {
    this._UIConfig = { ...this._UIConfig, ...val };
    this.provider.setItem(
      this.dataKeyPrefix + "UIConfig",
      save ? JSON.stringify(this._UIConfig) : "{}"
    );
  }
  private _aiServerConfig: { [key in aiServiceType]?: any } = {};
  getAiServerConfig(aiServerType: aiServiceType): any {
    if (this._slackProxyUrl) return this._aiServerConfig[aiServerType];
    try {
      return JSON.parse(
        this.provider.getItem(this.dataKeyPrefix + "AiServerConfig") || "{}"
      )[aiServerType];
    } catch {
      return undefined;
    }
  }
  setAiServerConfig(
    val: { [key in aiServiceType]?: any },
    save: boolean = true
  ) {
    this._aiServerConfig = { ...this._aiServerConfig, ...val };
    this.provider.setItem(
      this.dataKeyPrefix + "AiServerConfig",
      save ? JSON.stringify(this._aiServerConfig) : "{}"
    );
  }
  static instance(): KeyValueData {
    return KeyValueData._instance
      ? KeyValueData._instance
      : new KeyValueData(localStorage);
  }
}

type UIConfig = { showNav?: boolean; showConfigPanl?: boolean };
