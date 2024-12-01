import { getInstance } from 'ts-indexdb';
import { getUuid } from '../utils/utils';
import { KeyValue } from './IndexDb';

const cache: { [key: string]: string } = {};

export class ImageStore {
  saveImage = (imageBase64: string) => {
    var id = getUuid();
    cache[id] = imageBase64;
    if (!window) return id;
    getInstance().insert<KeyValue>({
      tableName: 'ImageStorage',
      data: { id, data: imageBase64 },
    });
    return id;
  };
  getImage: (id: string) => Promise<string | undefined> = async (id) => {
    if (cache[id]) return cache[id];
    const img = await getInstance().query_by_primaryKey<KeyValue>({
      tableName: 'ImageStorage',
      value: id,
    });
    if (img && img.data) {
      cache[id] = img.data;
      return img.data;
    }
    return undefined;
  };
  private static instance: ImageStore;
  static getInstance() {
    if (!this.instance) this.instance = new ImageStore();
    return this.instance;
  }
  deleteImage(ids?: string[]) {
    ids?.forEach((id) => {
      delete cache[id];
      getInstance()?.delete_by_primaryKey({
        tableName: 'ImageStorage',
        value: id,
      });
    });
  }
}
