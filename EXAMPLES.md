# 新功能使用示例

## 1. API 供应商兼容性配置

### 通过 UI 配置

用户在设置界面中：
1. 打开"网络配置" -> "其他AI服务"
2. 点击"增加"按钮
3. 填写服务信息：
   - 名称: `My Claude Service`
   - 接口地址: `https://api.anthropic.com/v1`
   - **API兼容类型**: 选择 `Anthropic 兼容`
4. 保存并配置 API Key

### 编程方式配置

```typescript
import { KeyValueData } from '@/core/db/KeyValueData';

// 获取配置实例
const config = KeyValueData.instance();

// 添加新的 AI 服务配置
const servers = config.getaiServerList();
servers.push({
  key: 'custom-claude',
  name: 'Claude Custom',
  url: 'https://api.anthropic.com/v1',
  hasToken: true,
  vendorType: 'anthropic', // 显式指定 Anthropic 格式
  compatibleOnly1System: false,
  compatibleNoToolImg: false
});

config.setaiServerList(servers);
```

## 2. 多模态文件存储

### 保存图片

```typescript
import { ImageStore } from '@/core/db/ImageDb';

const store = ImageStore.getInstance();

// 从文件输入获取
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const fileId = store.saveMultimodalFile(file, {
    fileName: file.name,
    mimeType: file.type,
    description: 'User uploaded image',
    tags: ['upload', 'user-content']
  });

  console.log('File saved with ID:', fileId);
}
```

### 保存 Base64 图片

```typescript
// 从 canvas 或其他来源获取 base64 数据
const base64Image = 'data:image/png;base64,iVBORw0KGgo...';

const fileId = store.saveMultimodalFile(base64Image, {
  fileName: 'canvas-export.png',
  description: 'Canvas export'
});
```

### 保存文档文件

```typescript
// 保存 PDF 文档
const pdfFile = await fetch('/documents/report.pdf').then(r => r.blob());

const docId = store.saveMultimodalFile(pdfFile, {
  fileName: 'report.pdf',
  mimeType: 'application/pdf',
  description: 'Monthly report',
  tags: ['document', 'report', 'pdf']
});
```

### 保存音频文件

```typescript
// 录制音频后保存
const audioBlob = await recording.stop();

const audioId = store.saveMultimodalFile(audioBlob, {
  fileName: 'voice-message.wav',
  mimeType: 'audio/wav',
  description: 'Voice message',
  tags: ['audio', 'voice']
});
```

### 查询和检索文件

```typescript
// 查询所有图片文件
const images = await store.queryFilesByType('image');
images.forEach(file => {
  console.log(`${file.metadata.fileName}: ${file.metadata.fileSize} bytes`);
});

// 查询所有文档
const documents = await store.queryFilesByType('document');

// 查询所有音频
const audios = await store.queryFilesByType('audio');
```

### 获取文件及其元数据

```typescript
// 获取完整的多模态文件对象
const multimodalFile = await store.getMultimodalFile(fileId);

if (multimodalFile) {
  // 访问文件数据
  const data = multimodalFile.data; // string | Blob

  // 访问元数据
  console.log('File Name:', multimodalFile.metadata.fileName);
  console.log('File Type:', multimodalFile.metadata.fileType);
  console.log('MIME Type:', multimodalFile.metadata.mimeType);
  console.log('File Size:', multimodalFile.metadata.fileSize);
  console.log('Created At:', new Date(multimodalFile.metadata.createdAt));
  console.log('Tags:', multimodalFile.metadata.tags);
  console.log('Description:', multimodalFile.metadata.description);
}
```

### 更新文件元数据

```typescript
// 更新文件的描述和标签
await store.updateMetadata(fileId, {
  description: 'Updated description',
  tags: ['new-tag1', 'new-tag2']
});
```

### 兼容旧 API

```typescript
// 旧的 saveImage API 仍然可用
const imageId = store.saveImage(imageBase64);

// 旧的 getImage API 仍然可用
const imageData = await store.getImage(imageId);
```

## 3. 在消息中使用多模态内容

### 发送带图片的消息

```typescript
import { CtxItem } from '@/Models/CtxItem';

// 创建包含图片的上下文
const context: CtxItem[] = [
  {
    role: 'user',
    content: [
      { type: 'text', text: '这张图片是什么内容？' },
      {
        type: 'image_url',
        image_url: {
          url: 'data:image/png;base64,iVBORw0KGgo...'
        }
      }
    ]
  }
];

// 发送到 AI 服务
await aiService.sendMessage({
  msg: message,
  context,
  onMessage: async (response) => {
    if (response.end) {
      console.log('Response:', response.text);
    }
  },
  config: inputConfig
});
```

### 处理 AI 返回的图片

```typescript
// AI 可能返回图片 URL
const toolResult = {
  type: 'image_url',
  image_url: {
    url: generatedImageUrl
  }
};

// 保存到本地存储
const imageId = store.saveMultimodalFile(generatedImageUrl, {
  fileName: 'ai-generated.png',
  description: 'AI generated image',
  tags: ['ai-generated']
});

// 在消息中引用
message.imageIds = [imageId];
```

## 4. 完整的文件上传组件示例

```tsx
import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { ImageStore } from '@/core/db/ImageDb';

const MultimodalUpload: React.FC<{
  onUpload: (fileId: string, fileType: string) => void;
}> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const store = ImageStore.getInstance();

      // 保存文件到 IndexedDB
      const fileId = store.saveMultimodalFile(file, {
        fileName: file.name,
        mimeType: file.type,
        description: `Uploaded: ${file.name}`
      });

      // 检测文件类型
      const fileType = file.type.split('/')[0]; // 'image', 'video', 'audio', etc.

      message.success(`${file.name} 上传成功`);

      // 通知父组件
      onUpload(fileId, fileType);

      return false; // 阻止默认上传行为
    } catch (error) {
      message.error(`${file.name} 上传失败`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Upload
      customRequest={({ file }) => handleUpload(file as File)}
      showUploadList={false}
      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
    >
      <Button icon={<UploadOutlined />} loading={uploading}>
        上传文件
      </Button>
    </Upload>
  );
};

export default MultimodalUpload;
```

## 5. 文件预览组件示例

```tsx
import React, { useEffect, useState } from 'react';
import { ImageStore, MultimodalFile } from '@/core/db/ImageDb';

const FilePreview: React.FC<{ fileId: string }> = ({ fileId }) => {
  const [file, setFile] = useState<MultimodalFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const loadFile = async () => {
      const store = ImageStore.getInstance();
      const loadedFile = await store.getMultimodalFile(fileId);

      if (loadedFile) {
        setFile(loadedFile);

        // 为图片和视频创建预览 URL
        if (loadedFile.metadata.fileType === 'image' ||
            loadedFile.metadata.fileType === 'video') {
          if (typeof loadedFile.data === 'string') {
            setPreviewUrl(loadedFile.data);
          } else {
            setPreviewUrl(URL.createObjectURL(loadedFile.data));
          }
        }
      }
    };

    loadFile();

    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fileId]);

  if (!file) return <div>加载中...</div>;

  const renderPreview = () => {
    switch (file.metadata.fileType) {
      case 'image':
        return <img src={previewUrl} alt={file.metadata.fileName} style={{ maxWidth: '100%' }} />;

      case 'video':
        return (
          <video controls style={{ maxWidth: '100%' }}>
            <source src={previewUrl} type={file.metadata.mimeType} />
          </video>
        );

      case 'audio':
        return (
          <div>
            <p>🎵 {file.metadata.fileName}</p>
            <audio controls>
              <source src={previewUrl} type={file.metadata.mimeType} />
            </audio>
          </div>
        );

      case 'document':
        return (
          <div>
            <p>📄 {file.metadata.fileName}</p>
            <p>大小: {(file.metadata.fileSize || 0 / 1024).toFixed(2)} KB</p>
            <Button onClick={() => downloadFile(file)}>下载查看</Button>
          </div>
        );

      default:
        return <p>不支持的文件类型</p>;
    }
  };

  return (
    <div>
      {renderPreview()}
      {file.metadata.description && (
        <p className="description">{file.metadata.description}</p>
      )}
      {file.metadata.tags && file.metadata.tags.length > 0 && (
        <div className="tags">
          {file.metadata.tags.map(tag => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

function downloadFile(file: MultimodalFile) {
  const blob = typeof file.data === 'string'
    ? new Blob([file.data], { type: file.metadata.mimeType })
    : file.data;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.metadata.fileName || 'download';
  a.click();
  URL.revokeObjectURL(url);
}

export default FilePreview;
```

## 6. 在实际应用中的集成

### 在聊天消息中显示多模态内容

```tsx
import React from 'react';
import { Message } from '@/Models/DataBase';
import FilePreview from './FilePreview';

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div className={`message ${message.ctxRole}`}>
      {/* 文本内容 */}
      <div className="message-text">
        {typeof message.text === 'string' ? message.text : message.text.join('\n')}
      </div>

      {/* 多模态内容 */}
      {message.imageIds && message.imageIds.map(fileId => (
        <FilePreview key={fileId} fileId={fileId} />
      ))}

      {/* 消息元数据 */}
      {message.usage && (
        <div className="message-meta">
          Tokens: {message.usage.total_tokens}
        </div>
      )}
    </div>
  );
};
```

这些示例展示了如何使用新升级的功能。您可以根据具体需求调整和扩展这些代码。
