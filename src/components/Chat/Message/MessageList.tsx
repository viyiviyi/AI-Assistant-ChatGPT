import { Hidden } from '@/components/common/Hidden';
import { DraePopup } from '@/components/drawimg/DrawPopup';
import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { useSendMessage } from '@/core/hooks/hooks';
import { activityScroll, createThrottleAndDebounce, getUuid, pagesUtil } from '@/core/utils/utils';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { PictureOutlined } from '@ant-design/icons';
import { Button, FloatButton, InputRef } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MessageContext } from '../Chat';
import { useInput } from '../InputUtil';
import { MemoInsertInput } from '../InsertInput';
import { MemoMessageItem } from './MessageItem';

let selectTimer = setTimeout(() => {}, 0);

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: {
  [key: string]: (messageId?: string | number, reloadStatus?: boolean) => void;
} = {};
export function reloadTopic(topicId: string, messageId?: string | number, reloadStatus: boolean = false) {
  topicRender[topicId] && topicRender[topicId](messageId, reloadStatus);
}
export const ctxInsertInputRef = React.createRef<InputRef>();

export function MessageList({
  topic,
  chat,
  firstMsgIdxRef,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
  firstMsgIdxRef: React.MutableRefObject<number | undefined>;
}) {
  const { reloadNav, forceRender, setActivityTopic } = useContext(ChatContext);
  const { setCite } = useContext(MessageContext);
  const { inputRef, setInput } = useInput();
  const [pageConf, setPageConf] = useState({
    totalPages: Math.ceil(topic.messages.length / (chat.config.pageSize || 20)) || 1,
    pageSize: chat.config.pageSize || 20,
    pageNumber: 1,
    repect: chat.config.pageRepect || 0,
    repectInEnd: true,
  });
  const [insertIndex, setInsertIndex] = useState(-1);
  const [countChar, setCountChar] = useState(0);
  const [ctxCountChar, setCtxCountChar] = useState(0);
  const renderMessage = useMemo<{
    [key: string]: (reloadStatus?: boolean) => void;
  }>(() => ({}), []);
  const [drawPopupProps, serDrawPopupProps] = useState({ text: '', open: false, msg: topic.messages[0] });

  const msgIdIdxMap = useMemo(() => new Map<string, number>(), []);
  const { sendMessage } = useSendMessage(chat);
  /**
   * 更新字数统计 最小更新间隔： 两秒
   */
  const resetCharCount = useMemo(() => {
    return createThrottleAndDebounce(() => {
      let charCount = 0;
      topic.messages.forEach((m, idx) => {
        charCount += m.text.length;
      });
      let ctxCountChar = 0;
      chat.getAskContext(topic, topic.messages.length).allCtx.forEach((v) => {
        ctxCountChar += v.content.length;
      });
      setCountChar(charCount);
      setCtxCountChar(ctxCountChar);
    }, 2000);
  }, [chat, topic]);

  const messages = useMemo(() => {
    if (forceRender) return topic.messages;
    const { range, totalPages, pageIndex } = pagesUtil(
      topic.messages,
      pageConf.pageNumber,
      pageConf.pageSize,
      pageConf.repect,
      pageConf.repectInEnd
    );
    msgIdIdxMap.clear();
    topic.messages.forEach((m, idx) => {
      msgIdIdxMap.set(m.id + '', idx);
    });
    pageConf.totalPages = totalPages;
    pageConf.pageNumber = pageIndex;
    resetCharCount();
    return range;
  }, [forceRender, msgIdIdxMap, pageConf, resetCharCount, topic.messages]);

  useEffect(() => {
    let pgs = Math.max(0, chat.config.pageSize || 0) || 20;
    let totalPages = Math.ceil(topic.messages.length / pgs) || 1;
    let conf: any = {
      pageSize: pgs,
      repect: Math.max(0, chat.config.pageRepect || 0) || 0,
      totalPages: totalPages,
      pageNumber: totalPages,
      repectInEnd: true,
    };
    setPageConf((c) => {
      if (Object.keys(c).filter((k) => (c as any)[k] != conf[k])) return { ...conf };
      return c;
    });
  }, [chat.config.pageSize, chat.config.pageRepect, topic.messages.length]);

  useEffect(() => {
    /**
     * 设置当前页第一条消息的索引
     */
    firstMsgIdxRef.current = msgIdIdxMap.get(messages[0]?.id);
    return () => {
      firstMsgIdxRef.current = undefined;
    };
  }, [messages, firstMsgIdxRef, msgIdIdxMap]);

  /**
   * 将消息内容填入输入框
   */
  const rBak = useCallback(
    (v: Message) => {
      setInput((m) => (m ? m + '\n' : m) + (!m ? (v.ctxRole == 'system' ? '/::' : v.ctxRole == 'assistant' ? '/' : '') : '') + v.text);
      inputRef.current?.focus();
    },
    [inputRef, setInput]
  );
  /**
   * 删除消息
   */
  const onDel = useCallback(
    (msg: Message) => {
      chat.removeMessage(msg)?.then(() => {
        let idx = msgIdIdxMap.get(msg.id);
        delete renderMessage[msg.id];
        pageConf.pageNumber = Math.min(Math.ceil(((idx || 0) + 1) / pageConf.pageSize), pageConf.totalPages);
        setPageConf(pageConf);
        reloadNav(topic);
      });
    },
    [chat, msgIdIdxMap, renderMessage, pageConf, reloadNav, topic]
  );
  useEffect(() => {
    /**
     * 用于在其他组件刷新话题或消息
     */
    let reload = createThrottleAndDebounce((conf) => {
      setPageConf((c) => {
        if (Object.keys(c).filter((k) => (c as any)[k] != conf[k])) return { ...conf };
        return c;
      });
    }, 50);
    topicRender[topic.id] = (messageId?: string | number, reloadStatus: boolean = false) => {
      resetCharCount();
      if (typeof messageId == 'number') {
        pageConf.pageNumber = Math.min(Math.ceil((messageId + 1 || 1) / pageConf.pageSize), pageConf.totalPages);
        reload(pageConf);
        return;
      }
      if (messageId) {
        return renderMessage[messageId] && renderMessage[messageId](reloadStatus);
      }
      pageConf.pageNumber = pageConf.totalPages;
      reload(pageConf);
    };
    return () => {
      delete topicRender[topic.id];
    };
  }, [renderMessage, topic.id, pageConf, resetCharCount]);

  return (
    <>
      {pageConf.pageNumber > 1 ? (
        <Button.Group style={{ width: '100%' }}>
          <Button
            block
            type="text"
            onClick={() => {
              setPageConf({
                ...pageConf,
                pageNumber: pageConf.pageNumber - 1,
                repectInEnd: true,
              });
            }}
          >
            上一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              pageConf.pageNumber = 1;
              pageConf.repectInEnd = true;
              setPageConf({ ...pageConf });
            }}
          >
            顶部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
      {messages.map((v, i) => {
        let idx = msgIdIdxMap.get(v.id);
        if (idx === undefined) idx = messages.length - 1;
        return (
          <div
            key={v.id}
            onMouseUp={(e) => {
              clearTimeout(selectTimer);
              selectTimer = setTimeout(() => {
                let text = window.getSelection?.()?.toString();
                if (drawPopupProps.text != text) {
                  drawPopupProps.text = text || '';
                  drawPopupProps.msg = v;
                  serDrawPopupProps({ ...drawPopupProps });
                }
              }, 400);
            }}
            onTouchEnd={(e) => {
              clearTimeout(selectTimer);
              selectTimer = setTimeout(() => {
                let text = window.getSelection?.()?.toString();
                if (drawPopupProps.text != text) {
                  drawPopupProps.text = text || '';
                  drawPopupProps.msg = v;
                  serDrawPopupProps({ ...drawPopupProps });
                }
              }, 400);
            }}
          >
            <MemoMessageItem
              renderMessage={renderMessage}
              msg={v}
              onDel={onDel}
              rBak={rBak}
              onCite={setCite}
              onPush={() => {
                setInsertIndex(idx!);
              }}
              onSned={() => {
                activityScroll({ botton: true });
                sendMessage(idx!, topic);
              }}
              onCopy={() => {
                chat.newTopic(topic.name).then((t) => {
                  Promise.all(
                    topic.messages.slice(0, idx! + 1).map((m) => {
                      return chat.pushMessage({ ...m, topicId: t.id, id: getUuid() });
                    })
                  ).then(() => setActivityTopic(t));
                });
              }}
            ></MemoMessageItem>
            {idx === insertIndex && (
              <MemoInsertInput
                key={'insert_input'}
                insertIndex={idx + 1}
                topic={topic}
                chat={chat}
                onHidden={() => {
                  setInsertIndex(-1);
                }}
              />
            )}
            {i == messages.length - 1 && <div style={{ marginTop: '2em' }}></div>}
          </div>
        );
      })}
      <Hidden hidden={(topic.overrideSettings?.renderType || chat.config.renderType) != 'document' || topic.messages.length < 1}>
        <div style={{ fontSize: '.8em', textAlign: 'center', opacity: 0.5 }}>
          <span>总字数：{countChar}</span>
          <span style={{ marginLeft: 16 }}>上下文：{ctxCountChar}</span>
        </div>
      </Hidden>
      <span style={{ opacity: 0.5, position: 'absolute', bottom: 0, left: 10 }}>
        {Math.min(
          topic.messages.length,
          topic.messages.length >= (chat.gptConfig.msgCountMin || 0)
            ? topic.overrideSettings?.msgCount || chat.gptConfig.msgCount
            : chat.gptConfig.msgCountMin || 0
        )}
        /{topic.messages.length}
      </span>
      {drawPopupProps.text && (
        <FloatButton.Group style={{ right: 10, bottom: 120 }}>
          <Button
            size="large"
            icon={<PictureOutlined />}
            onClick={(e) => {
              drawPopupProps.open = true;
              serDrawPopupProps({ ...drawPopupProps });
            }}
          ></Button>
        </FloatButton.Group>
      )}
      <DraePopup
        {...drawPopupProps}
        topic={topic}
        onClose={() => {
          serDrawPopupProps((v) => {
            v.open = false;
            return { ...v };
          });
        }}
      ></DraePopup>
      {pageConf.pageNumber < pageConf.totalPages ? (
        <Button.Group style={{ width: '100%', marginTop: '2em' }}>
          <Button
            block
            type="text"
            onClick={() => {
              pageConf.pageNumber += 1;
              pageConf.repectInEnd = false;
              setPageConf({ ...pageConf });
            }}
          >
            下一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              pageConf.pageNumber = pageConf.totalPages;
              pageConf.repectInEnd = false;
              setPageConf({ ...pageConf });
            }}
          >
            底部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
    </>
  );
}
