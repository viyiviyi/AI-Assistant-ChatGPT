import { IndexedDB } from "@/core/db/IndexDb";
import { Extensions } from "@/extensions/Extensions";
import { NameMacrosPrompt } from "@/middleware/scripts/NameMacrosPrompt.middleware";
import { CtxRole } from "@/Models/CtxRole";
import {
  GptConfig,
  Group,
  GroupConfig,
  Message,
  Topic,
  User,
  VirtualRole,
} from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { VirtualRoleSettingItem } from "@/Models/VirtualRoleSettingItem";
import React from "react";
import { BgConfig } from "./BgImageStore";
import {
  getDbInstance as getInstance,
  setSkipDbSave,
} from "./db/IndexDbInstance";
import { getUuid } from "./utils/utils";

const defaultChat: IChat = {
  id: "",
  user: { id: "", name: "", groupId: "" },
  group: { id: "", name: "", index: 0 },
  virtualRole: { id: "", name: "", groupId: "", bio: "", settings: [] },
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
  id: string;
  user: User;
  virtualRole: VirtualRole;
  topics: TopicMessage[];
  group: Group;
  config: GroupConfig;
  gptConfig: GptConfig;
}

export class ChatManagement {
  constructor(chat: IChat, skipSave = false) {
    this.topics = chat.topics || [];
    this.config = chat.config;
    this.group = chat.group;
    this.gptConfig = chat.gptConfig;
    this.user = chat.user;
    this.virtualRole = chat.virtualRole;
    setSkipDbSave(skipSave);
    this.topics.forEach((t) => {
      t.messages.forEach((m) => {
        t.messageMap[m.id] = m;
      });
      ChatManagement.loadTitleTree(t);
    });
  }
  readonly topics: TopicMessage[];
  readonly config: GroupConfig;
  readonly user: User;
  readonly virtualRole: VirtualRole;
  readonly group: Group;
  readonly gptConfig: GptConfig;

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
        if (!virtualRole) virtualRole = await this.createVirtualRoleBio(g.id);
        virtualRole.settings = virtualRole.settings.map((v) => {
          if (typeof v == "string") {
            return {
              checked: true,
              key: getUuid(),
              tags: [],
              ctx: [
                {
                  key: getUuid(),
                  role: this.parseTextToRole(v),
                  content: this.parseText(v),
                  checked: true,
                },
              ],
            };
          } else {
            v.ctx.forEach(
              (i) => (i.checked = i.checked === undefined ? true : i.checked)
            );
          }
          return v;
        });
        if (!config.botType) config.botType = "ChatGPT";
        let topics: TopicMessage[] = [];
        const chat: IChat = {
          id: g.id,
          group: g,
          user,
          gptConfig,
          config,
          virtualRole,
          topics,
        };
        if (!chat.group.createTime) {
          chat.group.createTime = Date.now();
          chat.gptConfig.role = "user";
        }
        if (i == 0) await this.loadTopics(chat);
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
      if (topics[i].id == chat.config.activityTopicId)
        await this.loadMessage(topics[i], true);
      // else this.loadMessage(topics[i], true);
    }
  }
  async loadMessages() {
    for (let i = 0; i < this.topics.length; i++) {
      await ChatManagement.loadMessage(this.topics[i], true);
    }
  }
  static async loadMessage(topic: TopicMessage, onlyTitle = false) {
    // if (topic.loadAll) return;
    topic.loadAll = true;
    let msgs = await getInstance().query<Message>({
      tableName: "Message",
      condition: (v) =>
        v.groupId == topic.groupId && v.topicId == topic.id && !v.deleteTime,
      //  && (!onlyTitle || /^#{1,5}\s/.test(v.text)),
    });
    // 排序
    msgs
      .sort((s, n) => s.timestamp - n.timestamp)
      .forEach((v) => {
        topic.messageMap[v.id] = v;
      });
    topic.messages = msgs;
    await this.loadTitleTree(topic);
  }
  static async loadTitleTree(topic: TopicMessage) {
    const l = topic.messages.length;
    topic.titleTree = [];
    for (let idx = 0; idx < l; idx++) {
      const v = topic.messages[idx];
      if (!/^#{1,5}\s/.test(v.text)) continue;
      let m = v.text.match(/^#+/);
      topic.titleTree.push({
        lv: m![0].length as 1 | 2 | 3 | 4 | 5,
        title: v.text.substring(0, 50).replace(/^#+/, "").trim(),
        msgId: v.id,
        index: idx,
      });
    }
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
  getAskContext(
    topic: TopicMessage,
    index: number = -1
  ): {
    allCtx: Array<{
      role: CtxRole;
      content: string;
      name: string;
    }>;
    history: Array<{
      role: CtxRole;
      content: string;
      name: string;
    }>;
  } {
    let history: Array<{
      role: CtxRole;
      content: string;
      name: string;
    }> = [];
    let virtualRole = this.virtualRole;
    if (topic) {
      let messages = [...topic.messages];
      messages.unshift(
        ...ChatManagement.parseSetting(
          topic.virtualRole?.filter((v) => !v.postposition && v.autoCtx)
        ).map((v) => {
          return {
            id: "",
            groupId: "",
            topicId: "",
            ctxRole: v.role,
            text: v.content,
            timestamp: 0,
          };
        })
      );
      messages.unshift(
        ...ChatManagement.parseSetting(
          virtualRole.settings.filter((v) => !v.postposition && v.autoCtx),
          topic.overrideVirtualRole
        ).map((v) => {
          return {
            id: "",
            groupId: "",
            topicId: "",
            ctxRole: v.role,
            text: v.content,
            timestamp: 0,
          };
        })
      );
      messages.push(
        ...ChatManagement.parseSetting(
          topic.virtualRole?.filter((v) => v.postposition && v.autoCtx)
        ).map((v) => {
          return {
            id: "",
            groupId: "",
            topicId: "",
            ctxRole: v.role,
            text: v.content,
            timestamp: 0,
          };
        })
      );
      messages.push(
        ...ChatManagement.parseSetting(
          virtualRole.settings.filter((v) => v.postposition && v.autoCtx),
          topic.overrideVirtualRole
        ).map((v) => {
          return {
            id: "",
            groupId: "",
            topicId: "",
            ctxRole: v.role,
            text: v.content,
            timestamp: 0,
          };
        })
      );
      if (index > -1) messages = messages.slice(0, index);
      else messages = [];
      let ctxCount =
        topic.overrideSettings?.msgCount === undefined
          ? this.gptConfig.msgCount
          : topic.overrideSettings?.msgCount;
      if (ctxCount > 0 && messages.length > ctxCount) {
        // 不在记忆范围内 且勾选了的消息
        messages
          .slice(0, messages.length - ctxCount)
          .filter((v) => v.checked)
          .forEach((v) => {
            history.push({
              role: v.ctxRole,
              content: v.text,
              name: this.getNameByRole(v.ctxRole, virtualRole),
            });
          });
      }
      // 记忆范围内的消息
      messages.slice(-ctxCount).forEach((v) => {
        history.push({
          role: v.ctxRole,
          content: v.text,
          name: this.getNameByRole(v.ctxRole, virtualRole),
        });
      });
    }
    // 置顶助理全局配置
    let ctx: Array<{
      role: CtxRole;
      content: string;
      name: string;
    }> = [...history];
    if (
      topic.overrideSettings?.useConfig === undefined
        ? this.config.enableVirtualRole
        : topic.overrideSettings?.useConfig
    ) {
      ctx = [
        // 助理简介
        ...(virtualRole.bio
          ? [
              {
                role: ChatManagement.parseTextToRole(virtualRole.bio, "system"),
                content: ChatManagement.parseText(virtualRole.bio),
                name: this.getNameByRole(
                  ChatManagement.parseTextToRole(virtualRole.bio, "system"),
                  virtualRole
                ),
              },
            ]
          : []),
        // 助理设定
        ...ChatManagement.parseSetting(
          virtualRole.settings.filter((v) => !v.postposition),
          topic.overrideVirtualRole
        ).map((v) => {
          return {
            role: v.role,
            content: v.content,
            name: this.getNameByRole(v.role, virtualRole),
          };
        }),
        // 话题内设定
        ...ChatManagement.parseSetting(
          topic.virtualRole?.filter((v) => !v.postposition)
        ).map((v) => {
          return {
            role: v.role,
            content: v.content,
            name: this.getNameByRole(v.role, virtualRole),
          };
        }),
        // 上下文
        ...history,
        // 话题内后置设定
        ...ChatManagement.parseSetting(
          topic.virtualRole?.filter((v) => v.postposition)
        ).map((v) => {
          return {
            role: v.role,
            content: v.content,
            name: this.getNameByRole(v.role, virtualRole),
          };
        }),
        // 后置设定
        ...ChatManagement.parseSetting(
          virtualRole.settings.filter((v) => v.postposition),
          topic.overrideVirtualRole
        ).map((v) => {
          return {
            role: v.role,
            content: v.content,
            name: this.getNameByRole(v.role, virtualRole),
          };
        }),
      ];
    }
    return { allCtx: ctx, history };
  }

  getNameByRole(role?: CtxRole, virtualRole?: VirtualRole) {
    return role === "system"
      ? "system"
      : role === "assistant"
      ? (virtualRole || this.virtualRole).enName || "assistant"
      : this.user.enName || "user";
  }
  static parseSetting(
    inputSettings?: VirtualRoleSetting[],
    overrideCheck?: { key: string; ctx: { key: string }[] }[],
    ctxTxt?: string
  ): {
    role: CtxRole;
    content: string;
  }[] {
    if (inputSettings == undefined) return [];
    let settings: {
      role: CtxRole;
      content: string;
    }[] = [];
    inputSettings
      .filter((v) =>
        overrideCheck
          ? overrideCheck.findIndex((f) => f.key == v.key) >= 0
          : v.checked
      )
      .map(
        (v) =>
          (v.extensionId
            ? Extensions.getExtension(v.extensionId)?.getSettings() || v
            : v) as VirtualRoleSetting
      )
      .filter((f) => {
        if (f.autoCtx) {
          return false;
        } else {
          return true;
        }
      })
      .forEach((v) => {
        let overrideCtx = overrideCheck?.find((f) => f.key == v.key);
        let lastSetting: VirtualRoleSettingItem | undefined = undefined;
        let hasDynamicItem = false;
        v.ctx
          .map((c) => ({
            ...c,
            checked: overrideCtx
              ? overrideCtx.ctx.findIndex((f) => f.key == c.key) >= 0
              : c.checked,
          }))
          .filter((f) => {
            if (!ctxTxt) return;
            if (!v.dynamic) return true;
            if (!f.keyWords || f.keyWords.length == 0) return true;
            let isDynamic = new RegExp(f.keyWords.join("|")).test(ctxTxt);
            hasDynamicItem = hasDynamicItem || isDynamic;
            return isDynamic;
          })
          .forEach((c) => {
            if (v.dynamic && !hasDynamicItem) return;
            if (c.role) {
              if (lastSetting && lastSetting.checked) {
                settings.push(lastSetting as any);
              }
              lastSetting = { ...c, role: c.role! };
            } else {
              if (c.checked && lastSetting) {
                lastSetting.content += "\n" + c.content;
              }
            }
          });
        if (lastSetting && (lastSetting as any).checked)
          settings.push(lastSetting);
      });
    return settings;
  }
  static parseText(text: string): string {
    return text
      .trim()
      .replace(/^\//, "")
      .replace(/^\\/, "")
      .replace(/^::?/, "")
      .replace(/^\/::?/, "");
  }
  static parseTextToRole(text: string, defaultRole: CtxRole = "user"): CtxRole {
    if (text.startsWith("::") || text.startsWith("/::")) return "system";
    if (text.startsWith("/")) return "assistant";
    if (text.startsWith("\\")) return "user";
    return defaultRole;
  }

  async newTopic(name: string) {
    let topic = await ChatManagement.createTopic(
      this.group.id,
      name.substring(0, 100) || new Date().toLocaleString(),
      {
        id: getUuid(),
        groupId: this.group.id,
        name: name.substring(0, 100) || new Date().toLocaleString(),
        createdAt: Date.now(),
      }
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
  getActivityTopic(): TopicMessage | undefined {
    return (
      this.topics.find((f) => f.id === this.config.activityTopicId) ||
      this.topics.slice(-1)[0]
    );
  }
  async saveTopic(topicId: string, name: string, cloudTopicId?: string) {
    const t = this.topics.find((f) => f.id == topicId);
    if (t) {
      t.name = name || t.name;
      t.cloudTopicId = cloudTopicId || t.cloudTopicId;
      t.updateTime = Date.now();
      await getInstance().update_by_primaryKey<Topic>({
        tableName: "Topic",
        value: t.id,
        handle: (r) => {
          return Object.assign(r, t, {
            messages: [],
            messageMap: {},
            titleTree: [],
          });
        },
      });
    }
  }
  async saveConfig() {
    await getInstance().update_by_primaryKey<GroupConfig>({
      tableName: "GroupConfig",
      value: this.config.id,
      handle: (r) => {
        this.config.updateTime = Date.now();
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
        this.user.updateTime = Date.now();
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
        this.group.updateTime = Date.now();
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
        this.virtualRole.updateTime = Date.now();
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
        this.gptConfig.updateTime = Date.now();
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
      middleware: [NameMacrosPrompt.key],
    };
    await getInstance().insert<GroupConfig>({ tableName: "GroupConfig", data });
    return data;
  }
  static async createUser(groupId: string, user?: User): Promise<User> {
    const data: User = user || {
      id: getUuid(),
      groupId,
      name: "用户",
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
      bio: ``,
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
      max_tokens: 1024,
      top_p: 0.5,
      temperature: 0.7,
      n: 1,
      msgCount: 11,
      presence_penalty: 0.7,
      frequency_penalty: 1.0,
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
      id: group.id,
      group,
      user,
      gptConfig,
      config,
      virtualRole,
      topics: [],
    };
    this.chatList.push(chat);
    return chat;
  }
  async pushMessage(
    message: Message,
    insertIndex: number = -1
  ): Promise<Message> {
    if (!message.text || !message.text.trim()) return message;
    message.text = message.text.trim();
    // 让纯xml内容显示正常
    let topic = this.topics.find((f) => f.id == message.topicId);
    if (!topic) return message;
    message.topicId = topic.id;
    message.groupId = this.group.id;
    let previousMessage: Message;
    if (insertIndex >= topic.messages.length) insertIndex = -1;
    if (insertIndex !== -1) previousMessage = topic.messages[insertIndex];
    if (message.id) {
      let msg = topic.messageMap[message.id]; //.messages.find((f) => f.id == message.id);
      if (msg) {
        await getInstance().update_by_primaryKey<Message>({
          tableName: "Message",
          value: msg.id,
          handle: (r) => {
            if (r.text != message.text) message.updateTime = Date.now();
            r = Object.assign(r, message);
            return r;
          },
        });
        return message;
      }
    } else {
      message.id = getUuid();
    }
    if (insertIndex !== -1)
      topic.messages.splice(insertIndex, 1, ...[message, previousMessage!]);
    else topic.messages.push(message);
    topic.messageMap[message.id] = message;
    message.updateTime = Date.now();
    await ChatManagement.createMessage(message);
    return message;
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
    if (this.config.enableSync) {
      return getInstance().update_by_primaryKey<Message>({
        tableName: "Message",
        value: message.id,
        handle: (r) => {
          message.deleteTime = Date.now();
          r = Object.assign(r, message);
          return r;
        },
      });
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
      id: this.group.id,
      user: this.user,
      group: this.group,
      config: this.config,
      virtualRole: this.virtualRole,
      gptConfig: this.gptConfig,
      topics: this.topics.map((v) => ({ ...v, titleTree: [], messageMap: {} })),
    };
    chat = JSON.parse(JSON.stringify(chat));
    return chat;
  }
  getChat(): IChat {
    return (
      ChatManagement.chatList.find((f) => f.group.id == this.group.id) || {
        id: this.group.id,
        user: this.user,
        group: this.group,
        config: this.config,
        virtualRole: this.virtualRole,
        gptConfig: this.gptConfig,
        topics: this.topics,
      }
    );
  }
  async fromJson(json: IChat, isToFirst = true) {
    if (!json.group.createTime) json.gptConfig.role = "user";
    let gid = this.group.id;
    const _this: IChat = JSON.parse(JSON.stringify(this.toJson()));
    await ChatManagement.remove(_this.group.id, _this);
    Object.assign(_this.group, json.group, { id: gid });
    await ChatManagement.createGroup(_this.group).then();
    Object.assign(_this.config, json.config, {
      id: getUuid(),
      groupId: _this.group.id,
    });
    await ChatManagement.createConfig(_this.group.id, _this.config);
    const virtualRoleIdMap = { [json.virtualRole.id]: getUuid() };
    Object.assign(_this.virtualRole, json.virtualRole, {
      id: virtualRoleIdMap[json.virtualRole.id],
      groupId: _this.group.id,
    });
    await ChatManagement.createVirtualRoleBio(
      _this.group.id,
      _this.virtualRole
    );
    Object.assign(_this.gptConfig, json.gptConfig, {
      id: getUuid(),
      groupId: _this.group.id,
    });
    await ChatManagement.createGptConfig(_this.group.id, _this.gptConfig);
    await ChatManagement.createConfig(_this.group.id, _this.config);
    Object.assign(_this.user, json.user, {
      id: getUuid(),
      groupId: _this.group.id,
    });
    await ChatManagement.createUser(_this.group.id, _this.user);
    _this.topics.splice(0, _this.topics.length);
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
    _this.topics.push(...json.topics);
    let proT: Promise<Topic>[] = [];
    let proM: Promise<void>[] = [];
    _this.topics.forEach((v) => {
      v.groupId = _this.group.id;
      v.id = getUuid();
      proT.push(
        ChatManagement.createTopic(
          _this.group.id,
          v.name,
          Object.assign({}, v, {
            messages: undefined,
            messageMap: undefined,
            titleTree: undefined,
          })
        )
      );
      v.messages.forEach((m) => {
        Object.assign(m, {
          groupId: _this.group.id,
          topicId: v.id,
          ctxRole: m.ctxRole,
          id: getUuid(),
        });
        proM.push(ChatManagement.createMessage(m));
      });
    });
    await Promise.all(proT);
    await Promise.all(proM);
    _this.topics.forEach((v) => {
      v.titleTree;
      v.messages.forEach((m) => (v.messageMap[m.id] = m));
    });
    if (isToFirst) ChatManagement.toFirst(_this.group);
    return _this;
  }
}
export const noneChat = new ChatManagement(defaultChat);
const obj: { [key: string]: any } = {};
let context = {
  chatMgt: noneChat,
  setChat: (chat: IChat) => {},
  activityTopic: obj.topic as TopicMessage | undefined,
  setActivityTopic: (topic?: TopicMessage) => {
    obj.topic = topic;
  },
  bgConfig: {
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    opacity: 0.5,
  } as BgConfig,
  setBgConfig: (img?: string) => {},
  loadingMsgs: {} as { [key: string]: { stop: () => void } },
  navList: [],
  reloadNav: (topic: TopicMessage) => {},
  /**
  这个参数是用来让首页正常渲染的，请不要随便将值设置为 true , 因为会导致渲染全部的消息（包括隐藏的）
  */
  forceRender: false,
};
export const ChatContext = React.createContext(context);
