import { isXML } from "@/components/Chat/MarkdownView";
import { IndexedDB } from "@/core/IndexDb";
import {
  GptConfig,
  Group,
  GroupConfig,
  Message,
  Topic,
  User,
  VirtualRole
} from "@/Models/DataBase";
import { TitleTree, TopicMessage } from "@/Models/Topic";
import React from "react";
import { getInstance } from "ts-indexdb";
import { BgConfig } from "./BgImageStore";
import { getUuid } from "./utils";

const defaultChat: IChat = {
  user: { id: "", name: "", groupId: "" },
  group: { id: "", name: "", index: 0 },
  virtualRole: { id: "", name: "", groupId: "", bio: "", settings: [] },
  virtualRoles: {},
  topics: [],
  config: {
    id: "",
    groupId: "",
    defaultVirtualRole: "",
    enableVirtualRole: false,
    activityTopicId: "",
    baseUrl: "",
    botType: "ChatGPT",
  },
  gptConfig: {
    id: "",
    groupId: "",
    model: "",
    role: "user",
    n: 1,
    msgCount: 1,
  },
};

export interface IChat {
  user: User;
  virtualRole: VirtualRole;
  virtualRoles: { [key: string]: VirtualRole | undefined };
  topics: TopicMessage[];
  group: Group;
  config: GroupConfig;
  gptConfig: GptConfig;
}

export class ChatManagement implements IChat {
  constructor(chat: IChat) {
    this.topics = chat.topics || [];
    this.config = chat.config;
    this.group = chat.group;
    this.gptConfig = chat.gptConfig;
    this.user = chat.user;
    this.virtualRole = chat.virtualRole;
  }
  readonly topics: TopicMessage[];
  readonly config: GroupConfig;
  readonly user: User;
  readonly virtualRole: VirtualRole;
  readonly group: Group;
  readonly gptConfig: GptConfig;

  readonly virtualRoles: { [key: string]: VirtualRole | undefined } = {};

  private static readonly chatList: IChat[] = [];
  static getGroups(): IChat[] {
    return this.chatList;
  }
  static loadAwait: Promise<void>; // = false;
  static async load() {
    if (this.loadAwait) return this.loadAwait;
    this.loadAwait = new Promise(async (res) => {
      await IndexedDB.init();
      const groups = await getInstance()
        .queryAll<Group>({
          tableName: "Group",
        })
        .then((gs) => gs.sort((l, n) => (l.index || 0) - (n.index || 0)));
      if (!groups.length) {
        await this.createGroup().then((v) => groups.push(v));
      }
      const users = await getInstance().queryAll<User>({
        tableName: "User",
      });
      const groupConfigs = await getInstance().queryAll<GroupConfig>({
        tableName: "GroupConfig",
      });
      const virtualRoles = await getInstance().queryAll<VirtualRole>({
        tableName: "VirtualRole",
      });
      const gptConfigs = await getInstance().queryAll<GptConfig>({
        tableName: "GptConfig",
      });
      for (let i = 0; i < groups.length; i++) {
        let g = groups[i];
        let user = users.find((f) => f.groupId == g.id);
        if (!user) {
          user = await this.createUser(g.id);
        }
        let gptConfig = gptConfigs.find((f) => f.groupId == g.id);
        if (!gptConfig) gptConfig = await this.createGptConfig(g.id);
        let config = groupConfigs.find((f) => f.groupId == g.id);
        if (!config) config = await this.createConfig(g.id);
        let virtualRole = virtualRoles.find((f) => f.groupId == g.id);
        let thisVirtualRoles: { [key: string]: VirtualRole | undefined } = {};
        virtualRoles
          .filter((f) => f.groupId == g.id)
          .forEach((v, idx) => {
            if (idx == 0) virtualRole = v;
            if (v.id == config?.defaultVirtualRole) virtualRole = v;
            thisVirtualRoles[v.id] = v;
          });
        if (!virtualRole) virtualRole = await this.createVirtualRoleBio(g.id);
        let topics: TopicMessage[] = [];
        const chat = {
          group: g,
          user,
          gptConfig,
          config,
          virtualRole,
          virtualRoles: thisVirtualRoles,
          topics,
        };
        if (!chat.group.createTime) {
          chat.group.createTime = Date.now();
          chat.gptConfig.role = "user";
        }
        this.chatList.push(chat);
      }
      res();
    });
    return this.loadAwait;
  }
  static async loadTopics(chat: IChat) {
    let topics: TopicMessage[] = [];
    topics = await getInstance()
      .query<Topic>({
        tableName: "Topic",
        condition: (v) => v.groupId == chat.group.id,
      })
      .then((v) => {
        return v
          .sort((s, n) => s.createdAt - n.createdAt)
          .map((t) => ({
            ...t,
            messages: [],
            messageMap: {},
            titleTree: [],
          }));
      });
    chat.topics = topics;
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      if (topic.id === chat.config.activityTopicId) {
        await this.loadMessage(topic);
        break;
      }
      if (i == topics.length - 1) {
        chat.config.activityTopicId = topic.id;
        await this.loadMessage(topic);
      }
    }
  }
  static async loadMessage(topic: TopicMessage) {
    if (topic.messages.length) return;
    let msgs = await getInstance().query<Message>({
      tableName: "Message",
      condition: (v) => v.groupId == topic.groupId && v.topicId == topic.id,
    });
    // 兼容旧数据
    msgs
      .sort((s, n) => s.timestamp - n.timestamp)
      .map((v) => {
        if (!v.ctxRole) v.ctxRole = v.virtualRoleId ? "assistant" : "user";
        topic.messageMap[v.id] = v;
      });
    topic.messages = msgs;
    this.loadTitleTree(topic);
  }
  static lastLoadTime = Date.now();
  static loadTimeout: any = 0;
  static async loadTitleTree(topic: TopicMessage) {
    // 因为这里会遍历整个列表，可能有性能问题，所以做了节流
    clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(
      () => {
        if (Date.now() - this.lastLoadTime < 1500) return;
        this.lastLoadTime = Date.now();
        let tree: TitleTree[] = [];
        topic.messages.forEach((v) => {
          let lv = -1;
          let m = v.text.match(/^#+/);
          if (m) lv = m[0].length;
          if (lv > 5) lv = -1;
          if (lv != -1) {
            tree.push({
              lv: lv as 1 | 2 | 3 | 4 | 5,
              title: v.text.substring(0, 50).replace(/^#+/, "").trim(),
              msgId: v.id,
            });
          }
        });
        topic.titleTree = tree;
      },
      // 当距离上次刷新已经超过5秒，则让下次刷新的延迟为0（还是有极小小几率不刷新）
      Date.now() - this.lastLoadTime > 5000 ? 0 : 1500
    );
  }

  static async toFirst(group: Group): Promise<void> {
    let chat = ChatManagement.chatList.find((f) => f.group.id === group.id);
    if (!chat) return;
    let list = ChatManagement.chatList.filter((f) => f.group.id !== group.id);
    ChatManagement.chatList.splice(0, ChatManagement.chatList.length);
    ChatManagement.chatList.push(chat!);
    ChatManagement.chatList.push(...list);
    ChatManagement.chatList;
    await ChatManagement.saveSort();
  }
  getAskContext(index?: number): Array<{
    role: "assistant" | "user" | "system";
    content: string;
    name: string;
  }> {
    const topic = this.topics.find((f) => f.id == this.config.activityTopicId);
    let ctx: Array<{
      role: "assistant" | "user" | "system";
      content: string;
      name: string;
    }> = [];
    if (topic) {
      let messages = topic.messages;
      if (index) messages = messages.slice(0, index + 1);
      if (
        this.gptConfig.msgCount > 0 &&
        messages.length > this.gptConfig.msgCount
      ) {
        // 不在记忆范围内 且勾选了的消息
        messages
          .slice(0, messages.length - this.gptConfig.msgCount)
          .filter((v) => v.checked)
          .forEach((v) => {
            let virtualRole = this.virtualRoles[v.virtualRoleId || ""];
            ctx.push({
              role: ChatManagement.parseMsgToRole(v, this.gptConfig.role),
              content: v.text,
              name: this.getNameByRole(v.ctxRole, virtualRole),
            });
          });
        // 表示这中间省略了很多内容
        let lastMsg = messages
          .slice(0, messages.length - this.gptConfig.msgCount)
          .slice(-1)[0];
        if (!lastMsg.checked) {
          ctx.push({
            role: "system",
            content: "...",
            name: "system",
          });
        }
      }
      // 勾选的消息
      messages.slice(-this.gptConfig.msgCount).forEach((v) => {
        let virtualRole = this.virtualRoles[v.virtualRoleId || ""];
        ctx.push({
          role: ChatManagement.parseMsgToRole(v, this.gptConfig.role),
          content: v.text,
          name: this.getNameByRole(v.ctxRole, virtualRole),
        });
      });
    }
    // 置顶助理全局配置
    if (this.config.enableVirtualRole) {
      let virtualRole =
        this.virtualRoles[this.config.defaultVirtualRole || ""] ||
        this.virtualRole;
      ctx = [
        {
          role: ChatManagement.parseTextToRole(virtualRole.bio, "system"),
          content: ChatManagement.parseText(virtualRole.bio),
          name: this.getNameByRole(
            ChatManagement.parseTextToRole(virtualRole.bio, "system"),
            virtualRole
          ),
        },
        ...(this.user.bio
          ? [
              {
                role: "system" as any,
                content: `对方是: ${this.user.name}\n简介：${this.user.bio}`,
                name: this.user.enName || "user",
              },
            ]
          : []),
        {
          role: "system",
          content: `current time is: ${new Date().toLocaleString()}`,
          name: "system",
        },
        ...virtualRole.settings.map((v) => ({
          role: ChatManagement.parseTextToRole(v, this.gptConfig.role),
          content: ChatManagement.parseText(v),
          name: this.getNameByRole(
            ChatManagement.parseTextToRole(v),
            virtualRole
          ),
        })),
        ...ctx,
      ];
    }
    return ctx;
  }

  getNameByRole(
    role: "assistant" | "system" | "user",
    virtualRole?: VirtualRole
  ) {
    return role === "system"
      ? "system"
      : role === "assistant"
      ? (virtualRole || this.virtualRole).enName || "assistant"
      : this.user.enName || "user";
  }
  static parseText(text: string): string {
    return text
      .trim()
      .replace(/^\//, "")
      .replace(/^\\/, "")
      .replace(/^::?/, "")
      .replace(/^\/::?/, "");
  }
  static parseTextToRole(
    text: string,
    defaultRole: "assistant" | "system" | "user" = "user"
  ): "assistant" | "system" | "user" {
    if (text.startsWith("::") || text.startsWith("/::")) return "system";
    if (text.startsWith("/")) return "assistant";
    if (text.startsWith("\\")) return "user";
    return defaultRole;
  }
  static parseMsgToRole(
    msg: Message,
    replaceUser: "assistant" | "system" | "user" = "user"
  ): "assistant" | "system" | "user" {
    if (msg.ctxRole) return msg.ctxRole == "user" ? replaceUser : msg.ctxRole;
    if (msg.virtualRoleId) return "assistant";
    return replaceUser;
  }
  async newTopic(name: string) {
    let topic = await ChatManagement.createTopic(
      this.group.id,
      name.substring(0, 100) || new Date().toLocaleString()
    );
    let _topic: TopicMessage = {
      ...topic,
      messages: [],
      messageMap: {},
      titleTree: [],
    };
    this.topics.push(_topic);
    this.config.activityTopicId = topic.id;
    return _topic;
  }
  getActivityTopic(): TopicMessage {
    return (
      this.topics.find((f) => f.id === this.config.activityTopicId) ||
      this.topics.slice(-1)[0]
    );
  }
  async saveTopic(topicId: string, name: string, cloudTopicId?: string) {
    const t = this.topics.find((f) => f.id == topicId);
    if (t) {
      t.name = name;
      t.cloudTopicId = cloudTopicId;
      await getInstance().update_by_primaryKey<Topic>({
        tableName: "Topic",
        value: t.id,
        handle: (r) => {
          r.name = name;
          r.cloudTopicId = cloudTopicId;
          return r;
        },
      });
    }
  }
  async saveConfig() {
    await getInstance().update_by_primaryKey<GroupConfig>({
      tableName: "GroupConfig",
      value: this.config.id,
      handle: (r) => {
        Object.assign(r, this.config);
        return r;
      },
    });
  }
  async saveUser() {
    await getInstance().update_by_primaryKey<User>({
      tableName: "User",
      value: this.user.id,
      handle: (r) => {
        Object.assign(r, this.user);
        return r;
      },
    });
  }
  async saveGroup() {
    await getInstance().update_by_primaryKey<Group>({
      tableName: "Group",
      value: this.group.id,
      handle: (r) => {
        Object.assign(r, this.group);
        return r;
      },
    });
  }
  async saveVirtualRoleBio() {
    await getInstance().update_by_primaryKey<VirtualRole>({
      tableName: "VirtualRole",
      value: this.virtualRole.id,
      handle: (r) => {
        Object.assign(r, this.virtualRole);
        return r;
      },
    });
  }
  async saveGptConfig() {
    await getInstance().update_by_primaryKey<GptConfig>({
      tableName: "GptConfig",
      value: this.gptConfig.id,
      handle: (r) => {
        Object.assign(r, this.gptConfig);
        return r;
      },
    });
  }
  static async createTopic(
    groupId: string,
    name?: string,
    topic?: Topic
  ): Promise<Topic> {
    const data: Topic = topic || {
      id: getUuid(),
      groupId,
      name: name || "",
      createdAt: Date.now(),
    };
    await getInstance().insert<Topic>({ tableName: "Topic", data });
    return data;
  }
  static async createConfig(
    groupId: string,
    groupConfig?: GroupConfig
  ): Promise<GroupConfig> {
    const data: GroupConfig = groupConfig || {
      id: getUuid(),
      groupId,
      enableVirtualRole: false,
      baseUrl: "",
      activityTopicId: "",
      botType: "ChatGPT",
    };
    await getInstance().insert<GroupConfig>({ tableName: "GroupConfig", data });
    return data;
  }
  static async createUser(groupId: string, user?: User): Promise<User> {
    const data: User = user || {
      id: getUuid(),
      groupId,
      name: "user",
    };
    await getInstance().insert<User>({ tableName: "User", data });
    return data;
  }
  static async createGroup(group?: Group): Promise<Group> {
    if (group && !group.createTime) group.createTime = Date.now();
    const data: Group = group || {
      id: getUuid(),
      name: "新建会话",
      index: this.chatList.length,
      createTime: Date.now(),
    };
    await getInstance().insert<Group>({ tableName: "Group", data });
    return data;
  }
  static async createVirtualRoleBio(
    groupId: string,
    virtualRole?: VirtualRole
  ): Promise<VirtualRole> {
    const data: VirtualRole = virtualRole || {
      id: getUuid(),
      name: "助理",
      groupId,
      bio: `接下来，你需要以私人助理的语气和行为输出内容，尽可能的详细与严谨。`,
      settings: [],
    };
    await getInstance().insert<VirtualRole>({ tableName: "VirtualRole", data });
    return data;
  }
  static async createGptConfig(
    groupId: string,
    gptConfig?: GptConfig
  ): Promise<GptConfig> {
    const data: GptConfig = gptConfig || {
      id: getUuid(),
      groupId,
      role: "user",
      model: "gpt-3.5-turbo",
      max_tokens: 1000,
      top_p: 0.7,
      temperature: 0.5,
      n: 1,
      msgCount: 10,
    };
    await getInstance().insert<GptConfig>({ tableName: "GptConfig", data });
    return data;
  }
  static async createMessage(message: Message) {
    await getInstance().insert<Message>({
      tableName: "Message",
      data: message,
    });
  }
  static async createChat(): Promise<IChat> {
    let group = await this.createGroup();
    let user = await this.createUser(group.id);
    let gptConfig = await this.createGptConfig(group.id);
    let config = await this.createConfig(group.id);
    let virtualRole = await this.createVirtualRoleBio(group.id);
    let chat: IChat = {
      group,
      user,
      gptConfig,
      config,
      virtualRole,
      virtualRoles: { [virtualRole.id]: virtualRole },
      topics: [],
    };
    this.chatList.push(chat);
    return chat;
  }
  async pushMessage(message: Message): Promise<Message> {
    if (!message.text || !message.text.trim()) return message;
    message.text = message.text.trim();
    // 让纯xml内容显示正常
    if (/^</.test(message.text) && isXML(message.text)) {
      message.text = "```xml\n" + message.text + "\n```";
    }
    // 让换行符正常换行
    message.text = message.text.replace(
      /([!\?~。！？】）～：；”……])\n([^\n])/g,
      "$1\n\n$2"
    );

    let topic = this.topics.find((f) => f.id == message.topicId);
    if (!topic) topic = await await this.newTopic(message.text);
    message.topicId = topic.id;
    message.groupId = this.group.id;
    let previousMessage: Message;
    let insertIndex = -1;
    if (message.previousMessage) {
      insertIndex = topic.messages.findIndex(
        (f) => f.id == message.previousMessage
      );
      if (insertIndex !== -1) previousMessage = topic.messages[insertIndex];
    }
    if (message.id) {
      let msg = topic.messages.find((f) => f.id == message.id);
      if (!msg) {
        if (insertIndex !== -1)
          topic.messages.splice(insertIndex, 1, ...[previousMessage!, message]);
        else topic.messages.push(message);
        topic.messageMap[message.id] = message;
        await ChatManagement.createMessage(message);
        ChatManagement.loadTitleTree(topic);
        return message;
      }
      await getInstance().update_by_primaryKey<Message>({
        tableName: "Message",
        value: msg.id,
        handle: (r) => {
          r = Object.assign(r, message);
          return r;
        },
      });
      ChatManagement.loadTitleTree(topic);
      return msg;
    } else {
      message.id = getUuid();
      if (insertIndex !== -1)
        topic.messages.splice(insertIndex, 1, ...[previousMessage!, message]);
      else topic.messages.push(message);
      topic.messageMap[message.id] = message;
      await ChatManagement.createMessage(message);
      ChatManagement.loadTitleTree(topic);
      return message;
    }
  }
  removeMessage(message: Message) {
    let topic = this.topics.find((f) => f.id == message.topicId);
    if (topic) {
      let delIdx = topic.messages.findIndex((f) => f.id == message.id);
      if (delIdx > -1) {
        topic.messages.splice(delIdx, 1);
      }
      delete topic.messageMap[message.id];
    }
    if (message.id) {
      return getInstance().delete_by_primaryKey({
        tableName: "Message",
        value: message.id,
      });
    }
  }
  async removeTopic(topic: Topic) {
    const delIdx = this.topics.findIndex((f) => f.id == topic.id);
    if (delIdx > -1) {
      this.topics.splice(delIdx, 1);
      await getInstance().delete_by_primaryKey({
        tableName: "Topic",
        value: topic.id,
      });
    }
    if (this.topics.length && this.config.activityTopicId == topic.id)
      this.config.activityTopicId = this.topics.slice(-1)[0]?.id;
    else this.config.activityTopicId = "";
  }
  static async saveSort() {
    this.chatList.forEach((chat, idx) => {
      getInstance().update_by_primaryKey<Group>({
        tableName: "Group",
        value: chat.group.id,
        handle: (r) => {
          r.index = idx;
          return r;
        },
      });
    });
  }
  static async remove(groupId: string, replace?: IChat) {
    await getInstance().delete<User>({
      tableName: "User",
      condition: (v) => v.groupId == groupId,
    });
    await getInstance().delete<Group>({
      tableName: "Group",
      condition: (v) => v.id == groupId,
    });
    await getInstance().delete<GroupConfig>({
      tableName: "GroupConfig",
      condition: (v) => v.groupId == groupId,
    });
    await getInstance().delete<VirtualRole>({
      tableName: "VirtualRole",
      condition: (v) => v.groupId == groupId,
    });
    await getInstance().delete<GptConfig>({
      tableName: "GptConfig",
      condition: (v) => v.groupId == groupId,
    });
    await getInstance().delete<Topic>({
      tableName: "Topic",
      condition: (v) => v.groupId == groupId,
    });
    await getInstance().delete<Message>({
      tableName: "Message",
      condition: (v) => v.groupId == groupId,
    });
    let delIdx = this.chatList.findIndex((f) => f.group.id == groupId);
    if (delIdx > -1) {
      if (!replace) {
        this.chatList.splice(delIdx, 1);
        this.saveSort();
      } else {
        replace.group.index = this.chatList[delIdx].group.index;
        this.chatList.splice(delIdx, 1, replace);
      }
    }
  }
  toJson(): IChat {
    let chat = {
      user: this.user,
      group: this.group,
      config: this.config,
      virtualRole: this.virtualRole,
      virtualRoles: this.virtualRoles,
      gptConfig: this.gptConfig,
      topics: this.topics,
    };
    chat = JSON.parse(JSON.stringify(chat));
    chat.topics.forEach((v) => {
      v.titleTree = [];
      v.messageMap = {};
    });
    return chat;
  }
  async fromJson(json: IChat) {
    if (!json.group.createTime) json.gptConfig.role = "user";
    await ChatManagement.remove(this.group.id, json);
    Object.assign(this.group, json.group, { id: getUuid() });
    await ChatManagement.createGroup(this.group).then();
    Object.assign(this.config, json.config, {
      id: getUuid(),
      groupId: this.group.id,
    });
    await ChatManagement.createConfig(this.group.id, this.config);
    Object.assign(this.virtualRole, json.virtualRole, {
      id: getUuid(),
      groupId: this.group.id,
    });
    if (Object.keys(this.virtualRoles).length == 0) {
      await ChatManagement.createVirtualRoleBio(
        this.group.id,
        this.virtualRole
      );
      this.virtualRoles[this.virtualRole.id] = this.virtualRole;
    } else {
      let prs: Promise<VirtualRole>[] = [];
      Object.keys(this.virtualRoles).forEach((key) => {
        if (!this.virtualRoles[key]) return;
        let e = this.config.defaultVirtualRole == this.virtualRoles[key]!.id;
        this.virtualRoles[key]!.groupId = this.group.id;
        this.virtualRoles[key]!.id = getUuid();
        if (e) {
          Object.assign(this.virtualRole, this.virtualRoles[key]);
          this.config.defaultVirtualRole = this.virtualRoles[key]!.id;
        }
        prs.push(
          ChatManagement.createVirtualRoleBio(
            this.group.id,
            this.virtualRoles[key]
          )
        );
      });
      await Promise.all(prs);
    }
    Object.assign(this.gptConfig, json.gptConfig, {
      id: getUuid(),
      groupId: this.group.id,
    });
    await ChatManagement.createGptConfig(this.group.id, this.gptConfig);
    await ChatManagement.createConfig(this.group.id, this.config);
    Object.assign(this.user, json.user, {
      id: getUuid(),
      groupId: this.group.id,
    });
    await ChatManagement.createUser(this.group.id, this.user);
    this.topics.splice(0, this.topics.length);
    if (
      Array.isArray((json as any).topic) &&
      Array.isArray((json as any).messages)
    ) {
      (json as any)["topics"] = (json as any).topic.map((t: Topic) => ({
        ...t,
        messages: (json as any).messages.filter(
          (f: Message) => f.topicId == t.id
        ),
      }));
    }
    this.topics.push(...json.topics);
    let proT: Promise<Topic>[] = [];
    let proM: Promise<void>[] = [];
    this.topics.forEach((v) => {
      v.groupId = this.group.id;
      v.id = getUuid();
      proT.push(
        ChatManagement.createTopic(
          this.group.id,
          v.name,
          Object.assign({}, v, { messages: undefined })
        )
      );
      v.messages.forEach((m) => {
        m.groupId = this.group.id;
        m.topicId = v.id;
        m.ctxRole = m.ctxRole || (m.virtualRoleId ? "assistant" : "user");
        m.virtualRoleId;
        m.id = getUuid();
        proM.push(ChatManagement.createMessage(m));
      });
    });
    await Promise.all(proT);
    await Promise.all(proM);
    ChatManagement.chatList.splice(this.group.index, 1, this.toJson());
  }
}
export const noneChat = new ChatManagement(defaultChat);
const obj: { [key: string]: any } = {};
export const ChatContext = React.createContext<{
  chat: ChatManagement;
  activityTopic: TopicMessage;
  setActivityTopic: (topic: TopicMessage) => void;
  bgConfig: BgConfig;
  setBgConfig: (image?: string) => void;
  loadingMsgs: { [key: string]: { stop: () => void } };
}>({
  chat: noneChat,
  activityTopic: obj.topic,
  setActivityTopic: (topic: TopicMessage) => {
    obj.topic = topic;
  },
  bgConfig: {
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    opacity: 0.5,
  },
  setBgConfig: (img?: string) => {},
  loadingMsgs: {},
});
