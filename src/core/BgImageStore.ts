import { getInstance } from "ts-indexdb";
import { KeyValue } from "./db/IndexDb";

export class BgImageStore {
  setBgImage = (bg: string) => {
    getInstance().insert<KeyValue>({
      tableName: "Background",
      data: { id: "base-background-image", data: bg },
    });
  };
  getBgImage: () => Promise<string | undefined> = async () => {
    const img = await getInstance().query_by_primaryKey<KeyValue>({
      tableName: "Background",
      value: "base-background-image",
    });
    if (img && img.data) {
      return img.data;
    }
    return undefined;
  };
  private static instance: BgImageStore;
  static getInstance() {
    if (!this.instance) this.instance = new BgImageStore();
    return this.instance;
  }
}

export interface BgConfig {
  backgroundImage?: string;
  backgroundPosition?: "center" | "left";
  backgroundRepeat?: "no-repeat" | "repeat";
  backgroundSize?: "cover" | "auto";
  opacity?: number;
}
export const bgConfig: BgConfig = {
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  opacity: 0.5,
};
