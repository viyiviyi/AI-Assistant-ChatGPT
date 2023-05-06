import { getInstance } from "ts-indexdb";
type KeyValue = {
  id: string;
  data: any;
};
export class BgImage {
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
  private static instance: BgImage;
  static getInstance() {
    if (!this.instance) this.instance = new BgImage();
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
