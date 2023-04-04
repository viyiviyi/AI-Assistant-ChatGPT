import { getInstance } from "ts-indexdb";
import { Observable, Subscriber } from "rxjs";
type KeyValue = {
  id: string;
  data: any;
};
export class BgImage {
  private subscriber?: Subscriber<BgConfig>;
  private readonly bgcnfig: BgConfig = {
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    opacity: 0.5,
  };
  readonly theamBackgroundImageChange: Observable<BgConfig>;
  constructor() {
    this.theamBackgroundImageChange = new Observable(
      (subscriber) => (this.subscriber = subscriber)
    );
  }
  setBgImage = (bg: string) => {
    this.bgcnfig.backgroundImage = `url(${bg})`;
    getInstance().insert<KeyValue>({
      tableName: "Background",
      data: { id: "base-background-image", data: bg },
    });
    this.subscriber?.next(this.bgcnfig);
  };

  getBgImage: () => Promise<BgConfig> = async () => {
    const img = await getInstance().query_by_primaryKey<KeyValue>({
      tableName: "Background",
      value: "base-background-image",
    });
    if (img && img.data) {
      return Object.assign(this.bgcnfig, {
        backgroundImage: `url(${img.data})`,
      });
    }
    return this.bgcnfig;
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
