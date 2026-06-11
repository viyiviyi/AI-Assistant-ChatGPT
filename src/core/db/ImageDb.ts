import { getInstance } from 'ts-indexdb';
import { getUuid } from '../utils/utils';
import { KeyValue } from './IndexDb';

export interface MultimodalFileMetadata {
  id: string;
  fileName?: string;
  fileType: 'image' | 'document' | 'audio' | 'video' | 'other';
  mimeType?: string;
  fileSize?: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  tags?: string[];
}

export interface MultimodalFile {
  id: string;
  data: string | Blob;
  metadata: MultimodalFileMetadata;
}

const cache: { [key: string]: MultimodalFile } = {};

export class ImageStore {
  // 检测文件类型
  private detectFileType(mimeType?: string, fileName?: string): MultimodalFileMetadata['fileType'] {
    if (!mimeType && !fileName) return 'other';

    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    }

    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'avif'];
      const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
      const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'webm'];
      const docExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'csv'];

      if (ext && imageExts.includes(ext)) return 'image';
      if (ext && audioExts.includes(ext)) return 'audio';
      if (ext && videoExts.includes(ext)) return 'video';
      if (ext && docExts.includes(ext)) return 'document';
    }

    return 'other';
  }

  // 保存多模态文件（增强版）
  saveMultimodalFile = (
    fileData: string | Blob,
    options?: {
      fileName?: string;
      mimeType?: string;
      description?: string;
      tags?: string[];
    }
  ): string => {
    const id = getUuid();
    const now = Date.now();

    let fileSize: number | undefined;
    let mimeType = options?.mimeType;

    if (typeof fileData === 'string') {
      // base64 字符串
      fileSize = fileData.length;
      if (!mimeType && fileData.startsWith('data:')) {
        mimeType = fileData.split(';')[0].split(':')[1];
      }
    } else {
      // Blob
      fileSize = fileData.size;
      if (!mimeType) {
        mimeType = fileData.type;
      }
    }

    const fileType = this.detectFileType(mimeType, options?.fileName);

    const metadata: MultimodalFileMetadata = {
      id,
      fileName: options?.fileName,
      fileType,
      mimeType,
      fileSize,
      createdAt: now,
      updatedAt: now,
      description: options?.description,
      tags: options?.tags,
    };

    const multimodalFile: MultimodalFile = {
      id,
      data: fileData,
      metadata,
    };

    cache[id] = multimodalFile;

    if (typeof window !== 'undefined') {
      getInstance().insert<KeyValue>({
        tableName: 'ImageStorage',
        data: { id, data: multimodalFile },
      });
    }

    return id;
  };

  // 兼容旧版 saveImage API
  saveImage = (imageBase64: string | Blob): string => {
    return this.saveMultimodalFile(imageBase64);
  };

  // 获取多模态文件
  getMultimodalFile: (id: string) => Promise<MultimodalFile | null> = async (id) => {
    if (cache[id]) return cache[id];

    const result = await getInstance().query_by_primaryKey<KeyValue>({
      tableName: 'ImageStorage',
      value: id,
    });

    if (result && result.data) {
      // 检查是否是新的多模态格式
      if ((result.data as MultimodalFile).metadata) {
        cache[id] = result.data as MultimodalFile;
        return result.data as MultimodalFile;
      } else {
        // 兼容旧格式，转换为新格式
        const oldData = result.data as string | Blob;
        const multimodalFile: MultimodalFile = {
          id,
          data: oldData,
          metadata: {
            id,
            fileType: this.detectFileType(typeof oldData === 'string' ? undefined : oldData.type),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        };
        cache[id] = multimodalFile;
        return multimodalFile;
      }
    }

    return null;
  };

  // 兼容旧版 getImage API
  getImage: (id: string) => Promise<string | Blob> = async (id) => {
    const file = await this.getMultimodalFile(id);
    if (file) {
      return file.data;
    }
    return id;
  };

  // 根据元数据查询文件
  queryFilesByType = async (fileType: MultimodalFileMetadata['fileType']): Promise<MultimodalFile[]> => {
    const allFiles = await getInstance().query_all<KeyValue>({
      tableName: 'ImageStorage',
    });

    return allFiles
      .map((item) => item.data as MultimodalFile)
      .filter((file) => file?.metadata?.fileType === fileType);
  };

  // 删除多模态文件
  deleteImage = (ids?: string[]) => {
    ids?.forEach((id) => {
      delete cache[id];
      getInstance()?.delete_by_primaryKey({
        tableName: 'ImageStorage',
        value: id,
      });
    });
  };

  // 更新文件元数据
  updateMetadata = async (id: string, updates: Partial<Omit<MultimodalFileMetadata, 'id' | 'createdAt'>>) => {
    const file = await this.getMultimodalFile(id);
    if (!file) return false;

    file.metadata = {
      ...file.metadata,
      ...updates,
      updatedAt: Date.now(),
    };

    cache[id] = file;

    await getInstance().update<KeyValue>({
      tableName: 'ImageStorage',
      data: { id, data: file },
    });

    return true;
  };

  private static instance: ImageStore;
  static getInstance() {
    if (!this.instance) this.instance = new ImageStore();
    return this.instance;
  }
}
