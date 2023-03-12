import {
  GptConfig,
  Group,
  Message,
  Topic,
  User,
  VirtualRole,
} from "@/Models/DataBase";
import { createRxDatabase, RxCollection, RxCollectionCreator } from "rxdb";
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import {
  gptConfigSchema,
  groupSchema,
  messageSchema,
  topicSchema,
  userSchema,
  virtualRoleSchema,
} from "./Schema";

export class DataBaseHelper {
  collections: {
    user?: RxCollection<User>;
    group?: RxCollection<Group>;
    message?: RxCollection<Message>;
    virtual?: RxCollection<Topic>;
    topic?: RxCollection<VirtualRole>;
    gptConfig?: RxCollection<GptConfig>;
  } = {};
  loaded: Promise<void>;
  constructor() {
    this.loaded = this.init();
  }
  async init() {
    // create a database
    const db = await createRxDatabase({
      name: "liteChatDB", // the name of the database
      storage: getRxStorageDexie(),
    });

    let userCollection: RxCollectionCreator<User> = { schema: userSchema };

    // add collections
    this.collections = await db.addCollections({
      user: userCollection,
      group: {
        schema: groupSchema,
      },
      message: { schema: messageSchema },
      virtual: { schema: virtualRoleSchema },
      topic: {
        schema: topicSchema,
      },
      gptConfig: { schema: gptConfigSchema },
    });

    // insert default config
    let defaultConfig = this.collections.gptConfig!.findOne("0").exec();
    if (!defaultConfig) {
      this.collections.gptConfig?.insert({
        id: "0",
        groupId: "",
        role: "assistant",
        model: "gpt-3.5-turbo",
        msgCount:6,
      });
    }
  }
}
