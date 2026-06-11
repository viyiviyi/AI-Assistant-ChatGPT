# AI 调用服务升级总结

## 升级概述

本次升级为 AI 调用服务增加了以下功能：
1. **OpenAI 和 Anthropic 兼容配置** - 支持显式选择 API 供应商兼容类型
2. **增强的多模态支持** - 扩展 IndexedDB 存储以支持多种文件类型和元数据

## 主要变更

### 1. 供应商兼容性配置模型

#### 文件: `src/core/db/KeyValueData.tsx`

**新增类型定义:**
```typescript
export type ApiVendorType = 'openai' | 'anthropic' | 'auto';

export type AiServerConf = {
  key: string;
  name: string;
  url: string;
  hasToken?: boolean;
  vendorType?: ApiVendorType; // 新增：API供应商兼容类型
  compatibleOnly1System?: boolean;
  compatibleNoToolImg?: boolean;
};
```

**说明:**
- `vendorType`: 允许用户显式指定 API 兼容格式
  - `'openai'`: 使用 OpenAI 兼容的 API 格式
  - `'anthropic'`: 使用 Anthropic 兼容的 API 格式
  - `'auto'`: 自动检测（默认，向后兼容）

### 2. APICenter 增强

#### 文件: `src/core/AiService/APICenter.ts`

**构造函数更新:**
```typescript
constructor(
  baseUrl: string,
  tokens: ServiceTokens,
  config?: GptConfig,
  tools?: any[],
  vendorType?: ApiVendorType,  // 新增参数
  compatibleOnly1System?: boolean,
  compatibleNoToolImg?: boolean,
)
```

**API 检测方法增强:**
```typescript
isAnthropicAPI() {
  // 如果显式指定了供应商类型，优先使用配置
  if (this.vendorType === 'anthropic') return true;
  if (this.vendorType === 'openai') return false;
  // 否则自动检测（向后兼容）
  return this.baseUrl.includes('/anthropic');
}
```

**优势:**
- 不再依赖 URL 模式匹配来检测 API 类型
- 用户可以明确指定任何端点的 API 格式
- 完全向后兼容现有配置

### 3. ServiceProvider 更新

#### 文件: `src/core/AiService/ServiceProvider.ts`

**服务实例创建:**
```typescript
case 'APICenter':
  return new APICenter(
    KeyValueData.instance().getApiTransferUrl() || '',
    tokens,
    chat.gptConfig,
    tools,
    aiConf?.vendorType,  // 传递供应商类型
    aiConf?.compatibleOnly1System,
    aiConf?.compatibleNoToolImg,
  );
```

### 4. IndexedDB 多模态文件存储增强

#### 文件: `src/core/db/ImageDb.ts`

**新增接口:**
```typescript
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
```

**新增方法:**

1. **saveMultimodalFile()** - 保存带元数据的多模态文件
   ```typescript
   saveMultimodalFile(fileData: string | Blob, options?: {
     fileName?: string;
     mimeType?: string;
     description?: string;
     tags?: string[];
   }): string
   ```

2. **getMultimodalFile()** - 获取完整的多模态文件对象
   ```typescript
   getMultimodalFile(id: string): Promise<MultimodalFile | null>
   ```

3. **queryFilesByType()** - 按文件类型查询
   ```typescript
   queryFilesByType(fileType: 'image' | 'document' | 'audio' | 'video' | 'other'): Promise<MultimodalFile[]>
   ```

4. **updateMetadata()** - 更新文件元数据
   ```typescript
   updateMetadata(id: string, updates: Partial<MultimodalFileMetadata>): Promise<boolean>
   ```

5. **detectFileType()** - 自动检测文件类型
   - 基于 MIME 类型
   - 基于文件扩展名

**向后兼容性:**
- 保留原有的 `saveImage()` 和 `getImage()` API
- 自动将旧格式数据迁移到新格式
- 现有代码无需修改即可工作

### 5. UI 配置组件更新

#### 文件: `src/components/Setting/Setting.tsx`

**AiServerItem 组件增强:**

添加了新的表单项用于选择 API 兼容类型：

```tsx
<Form.Item label={index + 1 + ' API兼容类型'} extra="选择API的兼容格式，Auto为自动检测">
  <Select
    value={vendorType}
    onChange={(value) => {
      setVendorType(value);
      setUserAiServer((v) => {
        v[index] = { ...v[index], vendorType: value };
        return v;
      });
    }}
    options={[
      { label: '自动检测 (Auto)', value: 'auto' },
      { label: 'OpenAI 兼容', value: 'openai' },
      { label: 'Anthropic 兼容', value: 'anthropic' },
    ]}
  />
</Form.Item>
```

**用户体验改进:**
- 清晰的下拉选择器，三个选项一目了然
- 帮助文本解释每个选项的含义
- 实时保存配置更改

## 使用场景示例

### 场景 1: 配置 Anthropic Claude API

1. 在"其他AI服务"中点击"增加"
2. 填写名称：`Claude API`
3. 填写接口地址：`https://api.anthropic.com/v1`
4. 选择 API 兼容类型：`Anthropic 兼容`
5. 输入 API Key

### 场景 2: 配置 OpenAI 兼容的第三方 API

1. 添加新服务
2. 填写名称：`Custom LLM`
3. 填写接口地址：`https://my-custom-api.com/v1`
4. 选择 API 兼容类型：`OpenAI 兼容`
5. 输入 API Key

### 场景 3: 上传和管理多模态文件

```typescript
// 保存图片
const imageId = ImageStore.getInstance().saveMultimodalFile(imageBlob, {
  fileName: 'screenshot.png',
  mimeType: 'image/png',
  description: 'User uploaded screenshot',
  tags: ['screenshot', 'user-content']
});

// 保存文档
const docId = ImageStore.getInstance().saveMultimodalFile(pdfBlob, {
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
  description: 'Technical documentation'
});

// 查询所有图片文件
const images = await ImageStore.getInstance().queryFilesByType('image');

// 获取文件及其元数据
const file = await ImageStore.getInstance().getMultimodalFile(imageId);
console.log(file.metadata.fileType); // 'image'
console.log(file.metadata.fileName); // 'screenshot.png'
```

## 技术优势

### 1. 灵活的 API 兼容性
- ✅ 不再受限于 URL 模式匹配
- ✅ 可以为任何端点指定正确的 API 格式
- ✅ 支持混合使用 OpenAI 和 Anthropic 格式的 API
- ✅ 完全向后兼容

### 2. 强大的多模态支持
- ✅ 支持图片、文档、音频、视频等多种文件类型
- ✅ 完整的元数据管理（文件名、MIME 类型、大小、标签等）
- ✅ 智能文件类型检测
- ✅ 高效的缓存机制
- ✅ 向后兼容现有代码

### 3. 用户体验优化
- ✅ 直观的配置界面
- ✅ 清晰的选项说明
- ✅ 实时配置保存
- ✅ 拖拽排序支持

## 数据迁移

### 现有配置
- 所有现有的 AI 服务配置自动保持有效
- `vendorType` 默认为 `'auto'`，保持原有行为
- 无需手动迁移

### 现有文件存储
- 旧的图片数据自动包装为新的 `MultimodalFile` 格式
- 元数据自动生成
- 访问时透明转换

## 后续建议

### 短期改进
1. 在聊天界面中添加文件上传按钮，支持更多文件类型
2. 实现文件预览功能（PDF、音频、视频）
3. 添加文件大小限制和压缩功能

### 长期规划
1. 支持文件同步到云端存储
2. 实现文件共享和协作功能
3. 添加文件版本管理
4. 支持更多 AI 提供商的特殊格式（如 Google Gemini、Cohere 等）

## 测试建议

### 单元测试
- 测试 `APICenter.isAnthropicAPI()` 的不同配置组合
- 测试 `ImageStore` 的文件类型检测逻辑
- 测试元数据 CRUD 操作

### 集成测试
- 测试与真实 OpenAI API 的交互
- 测试与真实 Anthropic API 的交互
- 测试多模态文件的上传、存储和检索

### 用户验收测试
- 验证配置界面的易用性
- 测试不同 API 提供商的连接
- 验证文件上传和显示功能

## 兼容性说明

- ✅ Node.js: 无特殊要求
- ✅ 浏览器: 支持 IndexedDB 的现代浏览器
- ✅ TypeScript: 完全类型安全
- ✅ React: 兼容现有 React 版本
- ✅ Ant Design: 使用标准组件

## 总结

本次升级成功实现了：
1. ✅ OpenAI 和 Anthropic API 兼容类型的可配置化
2. ✅ 增强的多模态文件存储和管理功能
3. ✅ 直观的用户配置界面
4. ✅ 完全的向后兼容性
5. ✅ 类型安全的实现

所有变更都经过精心设计，确保不影响现有功能，同时为未来的扩展奠定了坚实基础。
