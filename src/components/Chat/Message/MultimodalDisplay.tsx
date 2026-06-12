import { ImageStore, MultimodalFile } from '@/core/db/ImageDb';
import { ChatContext } from '@/core/ChatManagement';
import { FileOutlined, FileImageOutlined, FilePdfOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Flex, Image as AntdImage, Typography, theme, Button, Popconfirm } from 'antd';
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useRouter } from 'next/router';

export interface MultimodalDisplayProps {
  fileIds: string[];
  messageId?: string; // 用于删除时更新消息
  editable?: boolean; // 是否可编辑（显示删除按钮）
}

const { Text } = Typography;

export const MultimodalDisplay: React.FC<MultimodalDisplayProps> = ({ 
  fileIds, 
  messageId,
  editable = false 
}) => {
  const { token } = theme.useToken();
  const router = useRouter();
  const { chatMgt: chat } = useContext(ChatContext);
  
  const [files, setFiles] = useState<MultimodalFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const imageStore = ImageStore.getInstance();

  // 加载文件（支持从数据库异步加载）
  useEffect(() => {
    if (!fileIds || fileIds.length === 0) {
      setFiles([]);
      return;
    }

    const loadFiles = async () => {
      const loadedFiles: MultimodalFile[] = [];
      for (const id of fileIds) {
        // 使用异步方法，如果缓存没有则从数据库加载
        const file = await imageStore.getMultimodalFile(id);
        if (file) {
          loadedFiles.push(file);
        }
      }
      setFiles(loadedFiles);
    };

    loadFiles();
  }, [fileIds, imageStore]);

  // 处理浏览器返回事件
  const handleBackButton = useMemo(() => {
    return () => {
      setPreviewVisible(false);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [handleBackButton]);

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

  // 删除文件
  const deleteFile = async (index: number) => {
    const file = files[index];
    if (!file) return;

    // 从 IndexedDB 删除
    await imageStore.deleteMultimodalFile(file.id);

    // 从文件列表中移除
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    // 如果有 messageId，更新消息
    if (messageId && chat) {
      const topic = chat.topics.find(t => t.messages.some(m => m.id === messageId));
      if (topic) {
        const msg = topic.messages.find(m => m.id === messageId);
        if (msg && msg.multimodalFileIds) {
          // 从消息中移除文件 ID
          msg.multimodalFileIds = msg.multimodalFileIds.filter(id => id !== file.id);
          
          // 如果为空，删除字段
          if (msg.multimodalFileIds.length === 0) {
            delete msg.multimodalFileIds;
          }
          
          // 更新消息
          await chat.pushMessage(msg).catch((e) => console.error(e));
        }
      }
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
            borderRadius: token.borderRadius,
            overflow: 'hidden',
            border: `1px solid ${token.colorBorder}`,
            backgroundColor: token.colorFillContent,
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
              cursor: 'pointer',
            }}
            preview={false}
            onClick={() => {
              setPreviewIndex(index);
              setPreviewVisible(true);
              router.push(location.href.split('#')[0] + '#multimodal');
            }}
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName}</span>
              {editable && (
                <Popconfirm
                  title="确定删除此附件？"
                  onConfirm={() => deleteFile(index)}
                  okText="确定"
                  cancelText="取消"
                >
                  <DeleteOutlined 
                    style={{ 
                      marginLeft: 8, 
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              )}
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
            position: 'relative',
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
            <div style={{ 
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text strong>{fileName}</Text>
              {editable && (
                <Popconfirm
                  title="确定删除此附件？"
                  onConfirm={() => deleteFile(index)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
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
            position: 'relative',
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
            <div style={{ 
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text strong>{fileName}</Text>
              {editable && (
                <Popconfirm
                  title="确定删除此附件？"
                  onConfirm={() => deleteFile(index)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    danger 
                    size="small"
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
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
          position: 'relative',
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
          </div>
          {editable && (
            <Popconfirm
              title="确定删除此附件？"
              onConfirm={() => deleteFile(index)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                danger 
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Flex>
      </div>
    );
  };

  // 过滤出图片文件用于预览
  const imageFiles = files.filter(f => f.metadata.fileType === 'image');
  const imageIndices = files.map((f, i) => f.metadata.fileType === 'image' ? i : -1).filter(i => i !== -1);

  return (
    <div style={{ marginBottom: 12 }}>
      <Flex vertical gap={12}>
        {files.map((file, index) => renderFile(file, index))}
      </Flex>

      {/* 图片预览 - 使用 PreviewGroup */}
      {imageFiles.length > 0 && (
        <AntdImage.PreviewGroup
          preview={{
            visible: previewVisible,
            current: previewIndex,
            onVisibleChange: (visible) => {
              setPreviewVisible(visible);
              if (!visible) {
                router.back();
              }
            },
            onChange: (current) => {
              setPreviewIndex(current);
            },
          }}
          items={imageFiles.map(f => f.data as string)}
        />
      )}
    </div>
  );
};
