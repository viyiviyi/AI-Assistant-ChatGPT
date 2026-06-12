import { CloseOutlined, FileOutlined, FileImageOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Flex, Image as AntdImage, Upload, message, theme } from 'antd';
import React, { useState } from 'react';

export interface PendingFile {
  file: File;
  preview?: string; // 用于预览的 base64 或 URL
}

export interface MultimodalInputProps {
  onFilesChange: (files: PendingFile[]) => void;
  files?: PendingFile[]; // 外部传入的文件列表（受控模式）
  maxCount?: number;
  accept?: string;
}

export const MultimodalInput: React.FC<MultimodalInputProps> = ({
  onFilesChange,
  files: externalFiles,
  maxCount = 10,
  accept = 'image/*,.pdf,.doc,.docx,.txt,.md,.csv',
}) => {
  const [internalFiles, setInternalFiles] = useState<PendingFile[]>([]);
  
  // 使用外部传入的文件或内部状态
  const files = externalFiles !== undefined ? externalFiles : internalFiles;
  const setFiles = externalFiles !== undefined 
    ? (newFiles: PendingFile[]) => onFilesChange(newFiles)
    : setInternalFiles;
    
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = theme.useToken();
  
  // 缩略图尺寸
  const THUMB_SIZE = 72;

  // 处理文件上传 - 只暂存，不入库
  const handleUpload = async (file: File) => {
    if (files.length >= maxCount) {
      messageApi.warning(`最多只能上传 ${maxCount} 个文件`);
      return false;
    }

    try {
      // 生成预览（仅用于显示）
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = await readFileAsBase64(file);
      }

      const newFiles = [...files, { file, preview }];
      setFiles(newFiles);
      onFilesChange(newFiles);
      // 移除成功提示，因为文件出现在列表中已经提供了视觉反馈
    } catch (error) {
      console.error('文件处理失败:', error);
      messageApi.error('文件处理失败');
    }

    return false; // 阻止默认上传行为
  };

  // 删除文件
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  // 预览图片
  const previewFile = (pendingFile: PendingFile) => {
    if (pendingFile.preview) {
      setPreviewImage(pendingFile.preview);
      setPreviewVisible(true);
    }
  };

  // 获取文件图标
  const getFileIcon = (file: File) => {
    const iconSize = THUMB_SIZE * 0.5;
    const iconStyle = { fontSize: iconSize };
    
    const type = file.type;
    if (type.startsWith('image/')) {
      return <FileImageOutlined style={{ ...iconStyle, color: token.colorPrimary }} />;
    } else if (type.includes('pdf') || type.includes('document')) {
      return <FilePdfOutlined style={{ ...iconStyle, color: token.colorError }} />;
    } else if (type.startsWith('audio/')) {
      return <FileOutlined style={{ ...iconStyle, color: token.colorSuccess }} />;
    } else if (type.startsWith('video/')) {
      return <FileOutlined style={{ ...iconStyle, color: token.colorInfo }} />;
    } else {
      return <FileOutlined style={{ ...iconStyle, color: token.colorTextSecondary }} />;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {contextHolder}
      
      {/* 文件列表 */}
      {files.length > 0 && (
        <Flex gap={6} wrap="wrap" style={{ marginBottom: 8 }}>
          {files.map((pendingFile, index) => {
            const isImage = pendingFile.file.type.startsWith('image/');
            
            return (
              <div
                key={index}
                style={{
                  position: 'relative',
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: token.borderRadiusLG,
                  backgroundColor: token.colorBgContainer,
                  overflow: 'hidden',
                  cursor: isImage ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onClick={() => previewFile(pendingFile)}
              >
                {/* 删除按钮 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    zIndex: 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: token.colorBgMask,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <CloseOutlined style={{ fontSize: 12, color: token.colorWhite }} />
                </div>
                
                {/* 内容区域 */}
                {isImage && pendingFile.preview ? (
                  <AntdImage
                    src={pendingFile.preview}
                    alt={pendingFile.file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    preview={false}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {getFileIcon(pendingFile.file)}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 添加按钮 */}
          {files.length < maxCount && (
            <Upload
              accept={accept}
              multiple={true}
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <div
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  border: `1px dashed ${token.colorBorder}`,
                  borderRadius: token.borderRadiusLG,
                  backgroundColor: token.colorFillAlter,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = token.colorPrimary;
                  e.currentTarget.style.backgroundColor = token.colorPrimaryBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = token.colorBorder;
                  e.currentTarget.style.backgroundColor = token.colorFillAlter;
                }}
              >
                <div style={{ fontSize: 24, color: token.colorTextSecondary, lineHeight: 1 }}>+</div>
              </div>
            </Upload>
          )}
        </Flex>
      )}

      {/* 初始状态 */}
      {files.length === 0 && (
        <Upload
          accept={accept}
          multiple={true}
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <div
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              border: `1px dashed ${token.colorBorder}`,
              borderRadius: token.borderRadiusLG,
              backgroundColor: token.colorFillAlter,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = token.colorPrimary;
              e.currentTarget.style.backgroundColor = token.colorPrimaryBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = token.colorBorder;
              e.currentTarget.style.backgroundColor = token.colorFillAlter;
            }}
          >
            <div style={{ fontSize: 24, color: token.colorTextSecondary, lineHeight: 1 }}>+</div>
          </div>
        </Upload>
      )}

      {/* 图片预览 */}
      <AntdImage
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </div>
  );
};

// 辅助函数：读取文件为 base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default MultimodalInput;
