import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { usePushMessage, useScreenSize, useSendMessage, useReloadIndex } from '@/core/hooks/hooks';
import { activityScroll, scrollToBotton, scrollToTop, getUuid } from '@/core/utils/utils';
import { CtxRole } from '@/Models/CtxRole';
import { PendingFile } from '@/components/common/MultimodalInput';
import { ImageStore } from '@/core/db/ImageDb';
import { AttachmentPanel } from './AttachmentPanel';
import styleCss from '@/styles/index.module.css';
import {
  AlignLeftOutlined,
  CaretLeftOutlined,
  CommentOutlined,
  MessageOutlined,
  PaperClipOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Flex, Popover, theme, Typography, Badge, message } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MemoBackgroundImage } from '../common/BackgroundImage';
import { Hidden } from '../common/Hidden';
import { SkipExport } from '../common/SkipExport';
import { TextEditor } from '../common/TextEditor';
import { MemoNavigation } from '../Nav/Navigation';
import { MessageContext } from './Chat';
import { CtxRoleButton } from './CtxRoleButton';

// 辅助函数：读取文件为 base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 辅助函数：压缩图片
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // 计算目标尺寸
      let targetWidth = img.width;
      let targetHeight = img.height;

      // 根据文件大小决定最大尺寸
      const fileSizeKB = file.size / 1024;
      const maxSize = fileSizeKB > 8 ? 2048 : 1080; // 超过8K使用2K，否则1080P

      // 如果图片尺寸超过限制，进行缩放
      if (img.width > maxSize || img.height > maxSize) {
        if (img.width > img.height) {
          targetWidth = maxSize;
          targetHeight = (img.height / img.width) * maxSize;
        } else {
          targetHeight = maxSize;
          targetWidth = (img.width / img.height) * maxSize;
        }
      }

      // 设置画布尺寸
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 绘制图片
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // 转换为 JPEG 格式，质量 0.85
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          'image/jpeg',
          0.85
        );
      } else {
        reject(new Error('无法获取 Canvas 上下文'));
      }
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

// 辅助函数：处理文件（压缩图片 + 大小检查）
async function processFile(file: File): Promise<{ data: string; processedFile: File }> {
  // 检查文件大小（最大 50MB）
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error(`文件 "${file.name}" 超过 50MB 限制`);
  }

  let processedFile = file;
  let base64: string;

  // 如果是图片，进行压缩
  if (file.type.startsWith('image/')) {
    try {
      const compressedBlob = await compressImage(file);

      // 创建新的 File 对象（JPEG 格式）
      const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
      processedFile = new File([compressedBlob], fileName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // 读取压缩后的图片为 base64
      base64 = await readFileAsBase64(processedFile);
    } catch (error) {
      // 压缩失败，抛出错误，不保留文件
      throw new Error(`图片 "${file.name}" 压缩失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  } else {
    // 非图片文件，直接读取
    base64 = await readFileAsBase64(file);
  }

  return { data: base64, processedFile };
}

const inputRef = React.createRef<HTMLInputElement>();
const objs = { setInput: (s: string | ((s: string) => string)) => { } };
export function useInput() {
  return {
    inputRef,
    setInput: (s: string | ((s: string) => string)) => {
      return objs.setInput(s);
    },
  };
}
export function InputUtil() {
  const [inputText, setInputText] = useState({ text: '' });
  const [loading, setLoading] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const { chatMgt: chat, activityTopic, setActivityTopic, reloadNav } = useContext(ChatContext);
  const { onlyOne, setOnlyOne, closeAll, showTitle, setShowTitle, setCloseAll: setCloasAll } = useContext(MessageContext);
  const screenSize = useScreenSize();
  const { token } = theme.useToken();
  const [role, setRole] = useState<[CtxRole, boolean]>(['user', true]);
  const { pushMessage } = usePushMessage(chat);
  const { sendMessage } = useSendMessage(chat);
  const [showCtxRoleButton, setShowCtxRoleButton] = useState(false);
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  objs.setInput = (input: string | ((s: string) => string)) => {
    let next_input = inputText.text;
    if (typeof input == 'function') {
      next_input = input(next_input);
    } else {
      next_input = input;
    }
    setInputText({ text: ChatManagement.parseText(next_input) });
    setRole([ChatManagement.parseTextToRole(next_input), role[1]]);
  };
  useEffect(() => {
    if (inputText.text) {
      setShowCtxRoleButton(true);
    } else {
      setShowCtxRoleButton(false);
    }
  }, [inputText]);
  /**
   * 提交内容
   * @param isNewTopic 是否开启新话题
   * @returns
   */
  const onSubmit = useCallback(
    async function (isNewTopic: boolean) {
      let text = inputText.text.trim();
      text = ChatManagement.parseText(text);
      let topic = chat.getActivityTopic();
      if (!chat.config.activityTopicId) isNewTopic = true;
      if (!chat.topics.find((t) => t.id == chat.config.activityTopicId)) isNewTopic = true;
      if (isNewTopic) {
        await chat.newTopic(text).then((_topic) => {
          topic = _topic;
          setActivityTopic(_topic);
        }).catch((e) => console.error(e));
      }
      if (!topic) return;

      activityScroll({ botton: true });
      setLoading((v) => ++v);
      setInputText({ text: '' });

      // 如果有待发送的文件，先处理并存入数据库
      let multimodalFileIds: string[] = [];
      let failedFiles: string[] = [];

      if (pendingFiles.length > 0) {
        const imageStore = ImageStore.getInstance();

        // 使用 Promise.allSettled 并行处理所有文件
        const results = await Promise.allSettled(
          pendingFiles.map(async (pendingFile): Promise<{ success: boolean; fileId?: string; fileName: string; error?: string }> => {
            try {
              // 处理文件（压缩图片 + 大小检查）
              const { data: base64, processedFile } = await processFile(pendingFile.file);

              // 存入 IndexedDB
              const fileId = imageStore.saveMultimodalFile(base64, {
                fileName: processedFile.name,
                mimeType: processedFile.type,
                fileSize: processedFile.size, // ✅ 显式传递处理后文件的大小
              });

              return { success: true, fileId, fileName: pendingFile.file.name };
            } catch (error) {
              return {
                success: false,
                fileName: pendingFile.file.name,
                error: error instanceof Error ? error.message : '未知错误'
              };
            }
          })
        );

        // 处理结果
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const value = result.value;
            if (value.success && value.fileId) {
              multimodalFileIds.push(value.fileId);
            } else if (!value.success) {
              failedFiles.push(`${value.fileName}: ${value.error || '未知错误'}`);
            }
          }
        });

        // 显示错误提示
        if (failedFiles.length > 0) {
          message.error({
            content: (
              <div>
                <div>以下文件处理失败：</div>
                {failedFiles.map((msg, i) => (
                  <div key={i} style={{ fontSize: '12px', marginTop: '4px' }}>• {msg}</div>
                ))}
              </div>
            ),
            duration: 5,
          });
        }

        // 清空待发送文件列表
        setPendingFiles([]);
      }

      // 如果有待发送的文件，已处理并存入数据库，multimodalFileIds 已准备好

      // 判断是否有内容（文本或附件）
      const hasContent = text || multimodalFileIds.length > 0;

      if (hasContent) {
        let finalText = text;
        if (multimodalFileIds.length > 0 && !text) {
          finalText = `[附件: ${multimodalFileIds.length} 个文件]`;
        }

        // 调用 pushMessage，multimodalFileIds 作为最后一个参数
        await pushMessage(finalText, topic.messages.length, topic, role, undefined, multimodalFileIds);
      } else {
        // 无内容（纯空输入），直接用现有上下文发起 AI 请求，不创建新消息
        if (role[1]) {
          const lastMsg = topic.messages[topic.messages.length - 1];
          const parentId = lastMsg?.parentId || getUuid();
          await sendMessage(topic.messages.length, topic, false, parentId);
        }
      }

      setRole(['user', true]);
      if (/^#{1,5}\s/.test(text)) reloadNav(topic!);
      setTimeout(() => {
        setLoading((v) => --v);
      }, 500);

      return;
    },
    [chat, inputText, role, reloadNav, setActivityTopic, pendingFiles, sendMessage, pushMessage],
  );
  const toolEle = useMemo(
    () => (
      <div
        style={{
          flexWrap: 'nowrap',
          width: '100%',
          justifyContent: 'flex-end',
          display: 'flex',
          alignItems: 'center',
          paddingTop: 3,
          position: 'relative',
        }}
      >
        <SkipExport>
          <div className={styleCss.roll_button}>
            <Button
              shape={'circle'}
              size="large"
              className={styleCss.roll_button_item}
              icon={<VerticalAlignTopOutlined />}
              onClick={() => {
                activityScroll({ top: true });
                if (!activityTopic) return;
                if (onlyOne) {
                  scrollToTop();
                } else scrollToTop(activityTopic.id);
              }}
            />
            <span style={{ marginTop: 10 }}></span>
            <Button
              shape={'circle'}
              size="large"
              className={styleCss.roll_button_item}
              icon={<VerticalAlignBottomOutlined />}
              onClick={() => {
                activityScroll({ botton: true });
                if (!activityTopic) return;
                if (onlyOne) {
                  scrollToBotton();
                }
                scrollToBotton(activityTopic.id);
              }}
            />
            <SkipExport>
              <CaretLeftOutlined style={{ position: 'absolute', right: '0', top: '37px' }} />
            </SkipExport>
          </div>
        </SkipExport>
        {screenSize.width < 1200 && (
          <SkipExport>
            <AlignLeftOutlined
              style={{ padding: '8px 12px 8px 0' }}
              onClick={(e) => {
                setShowNav(true);
              }}
            />
          </SkipExport>
        )}
        <Typography.Text
          style={{
            cursor: 'pointer',
            color: onlyOne ? token.colorPrimary : undefined,
            flex: 1,
            width: 0,
          }}
          ellipsis={true}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (onlyOne) {
              setShowNav(true);
            } else {
              setOnlyOne(true);
            }
          }}
        >
          {activityTopic?.name}
        </Typography.Text>
        <span style={{ flex: 1 }}></span>

        {/* 多模态文件按钮 */}
        <Badge count={pendingFiles.length} offset={[-5, 10]} size="small">
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
            icon={
              <SkipExport>
                <PaperClipOutlined style={{ color: pendingFiles.length > 0 || showAttachmentPanel ? token.colorPrimary : undefined }} />
              </SkipExport>
            }
            style={{
              backgroundColor: pendingFiles.length > 0 || showAttachmentPanel ? token.colorPrimaryBg : undefined,
            }}
          />
        </Badge>

        <span style={{ marginLeft: 10 }}></span>
        <Button
          shape="round"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            if (showTitle && onlyOne) {
              setShowTitle(false);
            } else if (onlyOne) {
              setOnlyOne(false);
              setCloasAll(true);
            } else if (closeAll) {
              setCloasAll(false);
            } else {
              setOnlyOne(true);
              setShowTitle(true);
            }
          }}
        >
          <SkipExport>
            <VerticalAlignMiddleOutlined />
          </SkipExport>
        </Button>
        <span style={{ marginLeft: 10 }}></span>
        <Button
          shape="circle"
          size="large"
          onMouseDown={(e) => e.preventDefault()}
          icon={
            <SkipExport>
              <CommentOutlined />
            </SkipExport>
          }
          onClick={() => {
            onSubmit(true);
          }}
        ></Button>
        <span style={{ marginLeft: 10 }}></span>
        <Button
          shape="circle"
          size="large"
          onMouseDown={(e) => e.preventDefault()}
          icon={
            <SkipExport>
              <MessageOutlined />
            </SkipExport>
          }
          onClick={() => {
            onSubmit(false);
          }}
        ></Button>
      </div>
    ),
    [activityTopic, closeAll, onSubmit, onlyOne, screenSize.width, setCloasAll, setOnlyOne, setShowTitle, showTitle, token.colorPrimary, token.colorPrimaryBg, pendingFiles, showAttachmentPanel],
  );
  const editorEle = useMemo(
    () => (
      <div style={{ width: '100%', paddingTop: 3 }}>
        <TextEditor
          placeholder="Ctrl + S 发送    Ctrl + Enter 创建话题"
          autoSize={{ maxRows: 10 }}
          ref={inputRef}
          onFocus={(e) =>
            e.target.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
            })
          }
          onChange={(e) => {
            if (e.target.value) {
              setShowCtxRoleButton(true);
            } else {
              setShowCtxRoleButton(false);
            }
          }}
          input={inputText}
          autoFocus={false}
          onKeyUp={(e) => (e.key === 's' && e.altKey && onSubmit(false)) || (e.key === 'Enter' && e.ctrlKey && onSubmit(true))}
          onPasteImage={async (imageFiles) => {
            // 检查数量限制
            if (pendingFiles.length + imageFiles.length > 10) {
              messageApi.warning(`最多只能上传 10 个文件，当前已有 ${pendingFiles.length} 个`);
              return;
            }
            
            // 为每个图片生成预览并添加到待发送文件列表
            const newPendingFiles = [...pendingFiles];
            for (const file of imageFiles) {
              let preview: string | undefined;
              if (file.type.startsWith('image/')) {
                try {
                  preview = await readFileAsBase64(file);
                } catch (error) {
                  console.error('生成预览失败:', error);
                }
              }
              newPendingFiles.push({ file, preview });
            }
            
            setPendingFiles(newPendingFiles);
          }}
        />
      </div>
    ),
    [inputText, onSubmit, pendingFiles],
  );
  return (
    <>
      {/* <div className={styleCss.loading}>
        {loading ? (
          <div className={styleCss.loading}>
            {[0, 1, 2, 3, 4].map((v) => (
              <div key={v} style={{ backgroundColor: token.colorPrimary }} className={styleCss.loadingBar}></div>
            ))}
          </div>
        ) : (
          <div className={styleCss.loading}></div>
        )}
      </div> */}
      <Drawer
        placement={'left'}
        closable={false}
        width={Math.min(screenSize.width - 40, 400)}
        key={'nav_drawer'}
        styles={{ body: { padding: '1em 0' } }}
        open={showNav}
        onClose={() => {
          setShowNav(false);
        }}
      >
        <MemoBackgroundImage />
        <div
          style={{
            position: 'relative',
            height: '100%',
            zIndex: 99,
          }}
        >
          <MemoNavigation />
        </div>
      </Drawer>
      <div
        style={{
          width: '100%',
          padding: '0px 10px 0px',
          margin: '8px 0 10px',
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
          position: 'relative',
        }}
      >
        {showCtxRoleButton && (
          <CtxRoleButton
            value={role}
            onChange={setRole}
            inputRef={inputRef}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              borderRadius: token.borderRadius,
              backgroundColor: token.colorFillContent,
            }}
          />
        )}
        {showAttachmentPanel && (
          <AttachmentPanel
            files={pendingFiles}
            onFilesChange={setPendingFiles}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 37px)',
              left: 0,
            }}
          />
        )}
        {chat.config.toolBarToBottom ? (
          <>
            {editorEle}
            {toolEle}
          </>
        ) : (
          <>
            {toolEle}
            {editorEle}
          </>
        )}
        <Flex style={{ width: '100%', marginTop: 5 }}>
          <Hidden hidden={chat.config.buttomTool?.sendBtn != true}>
            <Button
              style={{ flex: 1 }}
              onMouseDown={(e) => e.preventDefault()}
              icon={
                <SkipExport>
                  <MessageOutlined />
                </SkipExport>
              }
              onClick={() => {
                onSubmit(false);
              }}
            >
              发送
            </Button>
          </Hidden>
        </Flex>
      </div>
    </>
  );
}
export const MemoInputUtil = React.memo(InputUtil);
