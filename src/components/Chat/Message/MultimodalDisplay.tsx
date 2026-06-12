import { ImageStore, MultimodalFile } from '@/core/db/ImageDb';
import { FileOutlined, FileImageOutlined, FilePdfOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Flex, Image as AntdImage, Typography, theme } from 'antd';
import React, { useEffect, useState } from 'react';

export interface MultimodalDisplayProps {
  fileIds: string[];
}

const { Text } = Typography;

export const MultimodalDisplay: React.FC<MultimodalDisplayProps> = ({ fileIds }) => {
  const { token } = theme.useToken();
  const [files, setFiles] = useState<MultimodalFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const imageStore = ImageStore.getInstance();

  // 加载文件
  useEffect(() => {
    if (!fileIds || fileIds.length === 0) {
      setFiles([]);
      return;
    }

    const loadedFiles: MultimodalFile[] = [];
    for (const id of fileIds) {
      const file = imageStore.getMultimodalFileSync(id);
      if (file) {
        loadedFiles.push(file);
      }
    }
    setFiles(loadedFiles);
  }, [fileIds, imageStore]);

  if (!files || files.length === 0) {
    return null;
  }

  // 获取文件图标
  const getFileIcon = (file: MultimodalFile) => {
    switch (file.metadata.fileType) {
      case 'image':
        return <FileImageOutlined style={{ fontSize: 32, color: token.colorPrimary }} />;
      case 'document':
        return <FilePdfOutlined style={{ fontSize: 32, color: token.colorError }} />;
      case 'audio':
        return <FileOutlined style={{ fontSize: 32, color: token.colorSuccess }} />;
      case 'video':
        return <PlayCircleOutlined style={{ fontSize: 32, color: token.colorInfo }} />;
      default:
        return <FileOutlined style={{ fontSize: 32, color: token.colorTextSecondary }} />;
    }
  };

  // 渲染单个文件
  const renderFile = (file: MultimodalFile, index: number) => {
    const { fileType, fileName, mimeType, fileSize } = file.metadata;
    const data = file.data;

    // 图片类型
    if (fileType === 'image' && typeof data === 'string') {
      return (
        <div
          key={file.id}
          style={{
            position: 'relative',
            cursor: 'pointer',
            borderRadius: token.borderRadius,
            overflow: 'hidden',
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorFillContent,
          }}
          onClick={() => {
            setPreviewIndex(index);
            setPreviewVisible(true);
          }}
        >
          <AntdImage
            src={data}
            alt={fileName}
            style={{
              width: '100%',
              maxHeight: 300,
              objectFit: 'contain',
              display: 'block',
            }}
            preview={false}
          />
          {fileName && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                padding: '4px 8px',
                fontSize: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fileName}
            </div>
          )}
        </div>
      );
    }

    // 视频类型
    if (fileType === 'video' && typeof data === 'string') {
      return (
        <div
          key={file.id}
          style={{
            borderRadius: token.borderRadius,
            overflow: 'hidden',
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorFillContent,
          }}
        >
          <video
            controls
            style={{
              width: '100%',
              maxHeight: 300,
              display: 'block',
            }}
            src={data}
          >
            您的浏览器不支持视频播放
          </video>
          {fileName && (
            <div style={{ padding: '8px 12px' }}>
              <Text strong>{fileName}</Text>
              {fileSize && (
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  ({(fileSize / 1024 / 1024).toFixed(2)} MB)
                </Text>
              )}
            </div>
          )}
        </div>
      );
    }

    // 音频类型
    if (fileType === 'audio' && typeof data === 'string') {
      return (
        <div
          key={file.id}
          style={{
            borderRadius: token.borderRadius,
            padding: '12px',
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorFillContent,
          }}
        >
          <audio controls style={{ width: '100%' }} src={data}>
            您的浏览器不支持音频播放
          </audio>
          {fileName && (
            <div style={{ marginTop: 8 }}>
              <Text strong>{fileName}</Text>
              {fileSize && (
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  ({(fileSize / 1024 / 1024).toFixed(2)} MB)
                </Text>
              )}
            </div>
          )}
        </div>
      );
    }

    // 文档和其他类型
    return (
      <div
        key={file.id}
        style={{
          borderRadius: token.borderRadius,
          padding: '12px',
          border: `1px solid ${token.colorBorder}`,
          backgroundColor: token.colorFillContent,
        }}
      >
        <Flex align="center" gap={12}>
          {getFileIcon(file)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName || '未命名文件'}
            </Text>
            {mimeType && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {mimeType}
              </Text>
            )}
            {fileSize && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                ({(fileSize / 1024 / 1024).toFixed(2)} MB)
              </Text>
            )}
          </div>
        </Flex>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <Flex vertical gap={12}>
        {files.map((file, index) => renderFile(file, index))}
      </Flex>

      {/* 图片预览 - 使用隐藏的图片组 */}
      <AntdImage.PreviewGroup
        preview={{
          current: previewIndex,
          visible: previewVisible,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
        items={files.filter(f => f.metadata.fileType === 'image').map(f => f.data as string)}
      />
    </div>
  );
};
