import { init } from "ts-indexdb";
import { DbTable } from "ts-indexdb/dist/TsIndexDb";
const TABLE_NAME = "litechat";
export class IndexedDB {
  static version = 6;
  private static getTableConfig(tableName: string): DbTable {
    return {
      tableName: tableName, // 表名
      option: { keyPath: "id", autoIncrement: true }, // 指明主键为id
      indexs: [
        {
          key: "id",
          option: {
            unique: true,
          },
        },
      ],
    };
  }
  static async init() {
    await init({
      dbName: TABLE_NAME, // 数据库名称
      version: IndexedDB.version, // 版本号
      tables: [
        this.getTableConfig("User"),
        this.getTableConfig("Group"),
        this.getTableConfig("GroupConfig"),
        this.getTableConfig("Message"),
        this.getTableConfig("Topic"),
        this.getTableConfig("VirtualRole"),
        this.getTableConfig("GptConfig"),
        this.getTableConfig("Background"),
      ],
    });
  }
}
