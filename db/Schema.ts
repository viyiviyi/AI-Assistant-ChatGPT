import {
  GptConfig,
  Group,
  Message,
  Topic,
  User,
  VirtualRole,
} from "@/Models/DataBase";
import { RxJsonSchema } from "rxdb";

export const userSchema: RxJsonSchema<User> = {
  title: "user schema",
  description: "schema for user data",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "number",
    },
    name: {
      type: "string",
    },
    avatar: {
      type: "string",
    },
    bio: {
      type: "string",
    },
  },
  required: ["id", "name", "avatar"],
};

export const groupSchema: RxJsonSchema<Group> = {
  title: "group schema",
  version: 0,
  description: "schema for group collection",
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "number",
    },
    name: {
      type: "string",
    },
    creatorId: {
      type: "string",
      maxLength: 100,
    },
  },
  required: ["name"],
  indexes: ["creatorId"],
};

export const messageSchema: RxJsonSchema<Message> = {
  title: "message schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "number",
    },
    groupId: {
      type: "string",
      maxLength: 100,
    },
    senderId: {
      type: "string",
      maxLength: 100,
    },
    topicId: {
      type: "string",
      maxLength: 100,
    },
    virtualRoleId: {
      type: "string",
      maxLength: 100,
    },
    text: {
      type: "string",
    },
    timestamp: {
      type: "number",
    },
  },
  required: ["id", "groupId", "senderId", "topicId", "text", "timestamp"],
  indexes: ["groupId", "senderId", "topicId"],
};

export const topicSchema: RxJsonSchema<Topic> = {
  title: "topic schema",
  description: "Schema for topic documents",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
  },
  required: ["id", "name", "createdAt"],
};

export const virtualRoleSchema: RxJsonSchema<VirtualRole> = {
  title: "virtual role schema",
  description: "schema for virtual roles",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "number",
    },
    name: {
      type: "string",
    },
    avatar: {
      type: "string",
    },
    bio: {
      type: "string",
    },
    settings: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["id", "name", "avatar", "bio", "settings"],
};

export const gptConfigSchema: RxJsonSchema<GptConfig> = {
  title: "GptConfig",
  description: "Schema for GPT configurations",
  version: 0,
  type: "object",
  primaryKey: "id",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    groupId: {
      type: "string",
      maxLength: 100,
    },
    role: {
      type: "string",
      enum: ["assistant", "system", "user"],
    },
    model: {
      type: "string",
    },
    max_tokens: {
      type: ["integer", "null"],
      maximum: 4096,
      minimum: 1,
    },
    top_p: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 2,
    },
    temperature: {
      type: ["number", "null"],
      minimum: 0,
      maximum: 1,
    },
    msgCount: {
      type: ["integer", "null"],
      minimum: 0,
    },
  },
  required: ["id", "groupId", "role", "model", "msgCount"],
};
