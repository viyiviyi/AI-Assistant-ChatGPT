import {
  GptConfig,
  Group,
  Message,
  Topic,
  User,
  VirtualRole,
} from "@/Models/DataBase";
import { message } from "antd";
import { KeyValueData } from "./KeyValueData";
function getUuid() {
  if (typeof crypto === "object") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (
      typeof crypto.getRandomValues === "function" &&
      typeof Uint8Array === "function"
    ) {
      const callback = (c: string) => {
        const num = Number(c);
        return (
          num ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))
        ).toString(16);
      };
      return ([1e7].join("") + -1e3 + -4e3 + -8e3 + -1e11).replace(
        /[018]/g,
        callback
      );
    }
  }
  let timestamp = new Date().getTime();
  let perforNow =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let random = Math.random() * 16;
    if (timestamp > 0) {
      random = (timestamp + random) % 16 | 0;
      timestamp = Math.floor(timestamp / 16);
    } else {
      random = (perforNow + random) % 16 | 0;
      perforNow = Math.floor(perforNow / 16);
    }
    return (c === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}
export class ChatManagement {
  keyValData: KeyValueData;
  constructor(groupName: string) {
    this.keyValData = new KeyValueData(localStorage);
    this.newTopic("新话题");
    this.virtualRole = {
      id: getUuid(),
      name: this.keyValData.getAssistantName() || "助理",
      avatar: "",
      bio:
        this.keyValData.getAssistantPrefix() ||
        `接下来，你将继承设定角色的所有属性！
只能输出设定角色第一人称的台词！
(在[]内输出动作细节!)
设定角色:私人助理,主动,优雅,女性.`,
      settings: [],
    };

    this.group = {
      id: getUuid(),
      name: groupName,
    };
    this.user = {
      id: getUuid(),
      name: "user",
      bio: "",
      avatar: "",
    };
  }
  readonly user: User;
  readonly virtualRole: VirtualRole;
  readonly topic: Topic[] = [];
  private readonly messages: Message[] = [];
  readonly group: Group;
  activityTopicId!: string;
  readonly config = { enableVirtualRole: false };
  gptConfig: GptConfig = {
    id: getUuid(),
    model: "gpt-3.5-turbo",
    role: "assistant",
    max_tokens: 1024,
    top_p: 0.7,
    groupId: "",
    temperature: 0.5,
    msgCount: 4,
  };
  static async getKey() {}
  static async provide(
    groupId?: string,
    groupName = "新对话"
  ): Promise<ChatManagement> {
    if (groupId) {
      let chat = ChatManagement.chatList.find((f) => f.group.id === groupId);
      if (chat) return chat;
    }
    if (groupName == "default") {
      const defaultChat = ChatManagement.chatList.find(
        (f) => f.group.name === "default"
      );
      if (defaultChat) return defaultChat;
    }
    const chat = new ChatManagement(groupName);
    ChatManagement.chatList.push(chat);
    return chat;
  }
  private static readonly chatList: ChatManagement[] = [];
  static async list(): Promise<Group[]> {
    // 暂时这样写，等把数据库功能完成后从数据库获取
    return ChatManagement.chatList.map((v) => v.group);
  }
  static getList(): ChatManagement[] {
    return this.chatList;
  }
  private static async create(name = "new Caht"): Promise<Group> {
    return { id: getUuid(), name };
  }
  private static async query(key: string): Promise<Group> {
    return { id: getUuid(), name: "" };
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
      .filter((f) => f.topicId === this.activityTopicId)
      .slice(-this.gptConfig.msgCount)
      .map((v) => ({
        role: this.gptConfig.role,
        content: v.text,
        name: v.virtualRoleId ? "assistant" : "user",
      }));

    if (this.config.enableVirtualRole) {
      ctx = [
        {
          role: this.gptConfig.role,
          content: this.virtualRole.bio,
          name: "user",
        },
        ...this.virtualRole.settings.map((v) => ({
          role: this.gptConfig.role,
          content: v,
          name: "user",
        })),
        ...ctx,
      ];
    }
    return ctx;
  }

  setVirtualRoleBio(name: string, bio: string, settings: string[]) {
    if (this.group.name === "default") {
      this.keyValData.setAssistantName(name);
      this.keyValData.setAssistantPrefix(bio);
    }
    this.virtualRole.settings = settings.filter((f) => f);
    this.virtualRole.name = name;
    this.virtualRole.bio = bio;
  }
  setGptConfig(config: { [key in keyof GptConfig]?: any }) {
    config.id = this.gptConfig.id;
    Object.assign(this.gptConfig, config);
  }
  getMsgCountByTopic(topicId?: string): number {
    if (!topicId) topicId = this.activityTopicId;
    let count = 0;
    this.messages.forEach((v) => {
      if (v.topicId === topicId) {
        count++;
      }
    });
    return count;
  }
  newTopic(message: string): Topic {
    const topic = {
      id: getUuid(),
      name: message.substring(0, 18),
      createdAt: new Date(),
    };
    this.activityTopicId = topic.id;
    this.topic.push(topic);
    return topic;
  }
  async setMessage(message: Message) {
    var item = this.messages.find((f) => f.id === message.id);
    if (item != null) {
      Object.assign(item, message);
    }
  }
  async pushMessage(
    message: string,
    virtualRoleMsg: boolean,
    topicId = this.activityTopicId,
    group = this.group.id
  ) {
    if (!message.trim()) return;
    if (!this.activityTopicId) {
      if (this.topic.length == 0) {
        this.newTopic(message);
      } else {
        this.activityTopicId = this.topic.slice(-1)[0].id;
      }
    }
    let msg: Message = {
      id: getUuid(),
      timestamp: Date.now(),
      text: message.trim(),
      virtualRoleId: virtualRoleMsg ? this.virtualRole.id : undefined,
      senderId: virtualRoleMsg ? undefined : this.user?.id,
      topicId: topicId,
      groupId: group,
    };
    this.messages.push(msg);
  }
  async removeMessage(message: Message) {
    let delIdx = this.messages.findIndex((f) => f.id === message.id);
    if (delIdx !== -1) {
      this.messages.splice(delIdx, 1);
    }
    let topics = this.topic.filter((f) => this.getMsgCountByTopic(f.id) > 0);
    this.topic.splice(0, this.topic.length);
    this.topic.push(...topics);
    if (topics.length == 0) this.activityTopicId = "";
  }
  removeTopic(topic: Topic) {
    let topics = this.topic.filter((f) => topic.id !== f.id);
    this.topic.splice(0, this.topic.length);
    this.topic.push(...topics);
    let msgs = this.messages.filter((f) => f.topicId !== topic.id);
    this.messages.splice(0, this.messages.length);
    this.messages.push(...msgs);
  }
  async remove() {
    const ls = ChatManagement.chatList.filter(
      (f) => f.group.id != this.group.id
    );
    ChatManagement.chatList.splice(0, ChatManagement.chatList.length);
    ChatManagement.chatList.push(...ls);
    if (ChatManagement.chatList.length == 0) {
      await ChatManagement.provide();
    }
  }
  toJson() {
    const obj = Object.assign({}, this) as any;
    obj.keyValData = undefined;
    return JSON.stringify(obj, null, 4);
  }
  fromJson(json: string) {
    try {
      const obj = JSON.parse(json);
      Object.keys(obj).forEach((key) => {
        if (key in this) {
          if (typeof obj[key] === "object")
            Object.assign((this as any)[key], obj[key]);
          else (this as any)[key] = obj[key];
        }
      });
    } catch (error) {
      console.error(error);
      message.error("错误的json文件");
    }
  }
}
