import { Assistant, Chat, GptConfig, Message, User } from "@/Models/models";

export class CahtManagement {
  readonly user: User | undefined;
  readonly assistant: Assistant = {
    key: "",
    name: "助理",
    prefix: `接下来，你将继承设定角色的所有属性！
只能输出设定角色第一人称的台词！
(在[]内输出动作细节!)
设定角色:私人助理,主动,优雅,女性.`,
  };
  private messages: Message[] = [];
  readonly config: Chat = { key: "", name: "" };
  gptConfig: GptConfig = {
    key: "",
    model: "gpt-3.5-turbo",
    role: "assistant",
    max_tokens: 300,
    top_p: 1,
    temperature: 0.5,
    msgCount: 4,
  };
  static async provide(chatKey?: string): Promise<CahtManagement> {
    if (chatKey) {
      let chat = CahtManagement.chatList.find(f => f.config.key === chatKey);
      if (chat) return chat;
    }
    return new CahtManagement();
  }
  private static chatList: CahtManagement[] = [];
  static async list(): Promise<Chat[]> {
    return CahtManagement.chatList.map((v) => v.config);
  }
  private static async create(name = "new Caht"): Promise<Chat> {
    return { key: "", name };
  }
  private static async query(key: string): Promise<Chat> {
    return { key: "", name: "" };
  }
  getMessages(): Message[] {
    return this.messages;
  }
  getAskContext(): Array<{
    role: "assistant" | "user" | "system";
    content: string;
    name: string;
  }> {
    let ctx = this.messages
      .filter((f) => !f.isSkip && f.message)
      .slice(-this.gptConfig.msgCount)
      .map((v) => ({
        role: this.gptConfig.role,
        content: v.message,
        name: "user",
      }));

    if (this.config.enableAssistant) {
      ctx = [
        {
          role: this.gptConfig.role,
          content: this.assistant.prefix,
          name: "user",
        },
        ...ctx,
      ];
    }
    return ctx;
  }
  async setMessage(message: Message) {
    var item = this.messages.find((f) => f.key === message.key);
    if (item != null) {
      Object.assign(item, message);
    } else {
      this.messages.push(message);
    }
  }
  async pushMessage(message: string, isPull: boolean, nickname?: string) {
    if (!message.trim()) return;
    let msg = {
      key: "lite_page.data.message" + Date.now(),
      nickname: nickname
        ? nickname
        : isPull
        ? this.config.enableAssistant
          ? this.assistant.name
          : "Bot"
        : "",
      timestamp: Date.now(),
      message: message.trim(),
      isPull: isPull,
      isSkip: false,
    };
    this.messages.push(msg);
  }
  async removeMessage(message: Message) {
    this.messages = this.messages.filter((f) => f.key !== message.key);
  }
  async remove() {}
}
