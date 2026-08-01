import { Hidden } from '@/components/common/Hidden';
import { MarkdownView } from '@/components/common/MarkdownView';
import { SkipExport } from '@/components/common/SkipExport';
import { DraePopup } from '@/components/drawimg/DrawPopup';
import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { useScreenSize, useSendMessage } from '@/core/hooks/hooks';
import { activityScroll, createThrottleAndDebounce, getUuid, addScrollHook } from '@/core/utils/utils';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import styleCss from '@/styles/index.module.css';
import {
  DeleteOutlined,
  PauseCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, InputRef, Popconfirm, theme } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { MessageContext } from '../Chat';
import { useInput } from '../InputUtil';
import { MemoInsertInput } from '../InsertInput';
import { FunctionCallInfo } from './FunctionCallInfo';
import { MemoMessageItem } from './MessageItem';

let selectTimer = setTimeout(() => { }, 0);

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: {
  [key: string]: (messageId?: string | number, reloadStatus?: boolean) => void;
} = {};
export function reloadTopic(topicId: string, messageId?: string | number, reloadStatus: boolean = false) {
  topicRender[topicId] && topicRender[topicId](messageId, reloadStatus);
}
export const ctxInsertInputRef = React.createRef<InputRef>();

// 消息行组件：定义在模块级别（非 MessageList 内部），避免 Virtuoso 因组件引用变化而卸载/重装
interface MessageRowProps {
  msg: Message;
  idx: number;
  messages: Message[];
  chat: ChatManagement;
  topic: TopicMessage;
  onDel: (msg: Message) => void;
  rBak: (v: Message) => void;
  renderMessage: { [key: string]: (reloadStatus?: boolean) => void };
  setCite: (message: Message) => void;
  ctxIds: string[];
  insertIndex: number;
  setInsertIndex: (idx: number) => void;
  getMsgCallbacks: (id: string) => { onPush: () => void; onSned: () => void; onCopy: () => void };
  expandMsg: string[];
  setExpand: React.Dispatch<React.SetStateAction<string[]>>;
  drawPopupProps: { text: string; open: boolean; msg: Message };
  serDrawPopupProps: (v: { text: string; open: boolean; msg: Message }) => void;
}
const MessageRow = React.memo((props: MessageRowProps) => {
  const { msg, idx, messages, chat, topic, onDel, rBak, renderMessage, setCite,
    ctxIds, insertIndex, setInsertIndex, getMsgCallbacks, expandMsg, setExpand,
    drawPopupProps, serDrawPopupProps } = props;
  const { loadingMsgs } = useContext(ChatContext);
  const { token } = theme.useToken();
  const screenSize = useScreenSize();
  const last = idx === 0 ? undefined : messages[idx - 1];
  const callbacks = getMsgCallbacks(msg.id);
  const showInsert = idx === insertIndex;
  const limitPreHeight = chat.config.limitPreHeight;
  return (
    <div
      onMouseUp={(e) => {
        clearTimeout(selectTimer);
        selectTimer = setTimeout(() => {
          let text = window.getSelection?.()?.toString();
          if (drawPopupProps.text != text) {
            drawPopupProps.text = text || '';
            drawPopupProps.msg = msg;
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
            drawPopupProps.msg = msg;
            serDrawPopupProps({ ...drawPopupProps });
          }
        }, 400);
      }}
    >
      {last?.isToolCall && msg.isToolCall &&
        ChatManagement.getMsgContent(msg).indexOf('\n') == -1 &&
        !loadingMsgs[msg.id] && !expandMsg.includes(msg.id) ? (
        <div
          className={styleCss.message_box + (limitPreHeight ? ' limt-hight' : '')}
          style={{ paddingRight: screenSize.width > 1300 ? 130 : 30 }}
        >
          <div style={{
            flex: 1, display: 'flex', padding: 10, paddingTop: 4, paddingBottom: 2,
            marginTop: 1, marginLeft: 40, boxSizing: 'border-box',
            borderRadius: token.borderRadiusLG,
            border: '1px solid ' + token.colorFillAlter,
            backgroundColor: token.colorInfoBg,
            boxShadow: token.boxShadowTertiary, lineHeight: 1.7,
          }}>
            <div className={styleCss.message_item} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, display: 'flex' }}>
                  <MarkdownView markdown={ChatManagement.getMsgContent(msg)} />
                </div>
                <span style={{ paddingLeft: 10, opacity: 0.6 }}>
                  <SkipExport>
                    <Popconfirm
                      placement="topRight"
                      overlayInnerStyle={{ whiteSpace: 'nowrap' }}
                      okType="danger"
                      title="确定删除此消息？"
                      onConfirm={() => onDel(msg)}
                    >
                      <DeleteOutlined style={{ color: '#ff8d8f' }} />
                    </Popconfirm>
                  </SkipExport>
                </span>
              </div>
              <div style={{ marginTop: -16 }}>
                <FunctionCallInfo msg={msg} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <MemoMessageItem
            renderMessage={renderMessage}
            msg={msg}
            onDel={onDel}
            rBak={rBak}
            onCite={setCite}
            onPush={callbacks.onPush}
            onSned={callbacks.onSned}
            onCopy={callbacks.onCopy}
            inCtx={ctxIds.includes(msg.id)}
          />
        </>
      )}

      {showInsert && (
        <MemoInsertInput
          key={'insert_input'}
          insertIndex={idx + 1}
          topic={topic}
          chat={chat}
          onHidden={() => setInsertIndex(-1)}
        />
      )}
      {last?.isToolCall && msg.isToolCall && !loadingMsgs[msg.id]
        && ChatManagement.getMsgContent(msg).indexOf('\n') == -1 && (
          <span
            style={{
              position: 'absolute',
              top: expandMsg.includes(msg.id) ? 60 : 0,
              left: 10, padding: 5, cursor: 'pointer', opacity: 0.5,
            }}
            onClick={() => {
              setExpand((prv) => {
                if (prv.includes(msg.id)) return prv.filter((f) => f != msg.id);
                return [...prv, msg.id];
              });
            }}
          >
            <RightOutlined />
          </span>
        )}
    </div>
  );
});
MessageRow.displayName = 'MessageRow';

// 使用 Virtuoso 代替 Ant Table virtual，避免行高变化导致 O(n) 重排

export function MessageList({
  topic,
  chat,
  firstMsgIdxRef,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
  firstMsgIdxRef: React.MutableRefObject<number | undefined>;
}) {
  const { reloadNav, forceRender, setActivityTopic, activityTopic, loadingMsgs } = useContext(ChatContext);
  const { setCite } = useContext(MessageContext);
  const { inputRef, setInput } = useInput();
  const [insertIndex, setInsertIndex] = useState(-1);
  const [countChar, setCountChar] = useState(0);
  const [ctxCountChar, setCtxCountChar] = useState(0);
  const [drawPopupProps, serDrawPopupProps] = useState({ text: '', open: false, msg: topic.messages[0] });
  const [messages, setMessages] = useState(topic.messages);
  const [expandMsg, setExpand] = useState<string[]>([]);
  const [ctxIds, setCtxIds] = useState<string[]>([]);
  const { token } = theme.useToken();
  const screenSize = useScreenSize();

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isAtBottomRef = useRef(true);
  const { sendMessage } = useSendMessage(chat);

  // 缓存消息列表，供稳定 callbacks 中获取最新索引
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // 缓存每行的稳定回调引用，保障 React.memo(MemoMessageItem) 正常工作
  const callbackCacheRef = useRef<Map<string, { onPush: () => void; onSned: () => void; onCopy: () => void }>>(new Map());
  const getMsgCallbacks = useCallback((msgId: string) => {
    let cached = callbackCacheRef.current.get(msgId);
    if (!cached) {
      cached = {
        onPush: () => {
          const idx = messagesRef.current.findIndex((m) => m.id === msgId);
          if (idx >= 0) setInsertIndex(idx);
        },
        onSned: () => {
          const idx = messagesRef.current.findIndex((m) => m.id === msgId);
          if (idx >= 0) {
            activityScroll({ botton: true });
            sendMessage(idx, topic);
          }
        },
        onCopy: () => {
          const idx = messagesRef.current.findIndex((m) => m.id === msgId);
          chat.newTopic(topic.name).then((t) => {
            Promise.all(
              topic.messages.slice(0, idx + 1).map((m) => {
                return chat.pushMessage({ ...m, topicId: t.id, id: getUuid() });
              }),
            ).then(() => setActivityTopic(t)).catch((e) => console.error(e));
          }).catch((e) => console.error(e));
        },
      };
      callbackCacheRef.current.set(msgId, cached);
    }
    return cached;
  }, [chat, setActivityTopic, sendMessage, topic]);

  const renderMessage = useMemo<{
    [key: string]: (reloadStatus?: boolean) => void;
  }>(() => ({}), []);
  // const msgIdIdxMap = useMemo(() => new Map<string, number>(), []);

  /**
   * 更新字数统计 最小更新间隔： 两秒
   */
  const resetCharCount = useMemo(() => {
    return createThrottleAndDebounce(() => {
      let charCount = 0;
      topic.messages.forEach((m, idx) => {
        charCount += ChatManagement.getMsgContent(m).length;
      });
      let ctxCountChar = 0;
      chat.getAskContext(topic, topic.messages.length).allCtx.forEach((v) => {
        ctxCountChar += v.content.length;
      });
      setCountChar(charCount);
      setCtxCountChar(ctxCountChar);
    }, 2000);
  }, [chat, topic]);

  useEffect(() => {
    setMessages(topic.messages);
    let { ctxIds } = chat.getAskContext(topic, topic.messages.length);
    setCtxIds(ctxIds);
    // tblRef.current?.scrollTo({ index: messages.length - 1 });
  }, [chat, topic, topic.messages]);
  /**
   * 将消息内容填入输入框
   */
  const rBak = useCallback(
    (v: Message) => {
      setInput(
        (m) =>
          (m ? m + '\n' : m) +
          (!m ? (v.ctxRole == 'system' ? '/::' : v.ctxRole == 'assistant' ? '/' : '') : '') +
          ChatManagement.getMsgContent(v),
      );
      inputRef.current?.focus();
    },
    [inputRef, setInput],
  );
  /**
   * 删除消息
   */
  const onDel = useCallback(
    (msg: Message) => {
      chat.removeMessage(msg)?.then(() => {
        delete renderMessage[msg.id];
        setMessages([...topic.messages]);
        let { ctxIds } = chat.getAskContext(topic, topic.messages.length);
        setCtxIds(ctxIds);
        reloadNav(topic);
      }).catch((e) => console.error(e));
    },
    [chat, renderMessage, reloadNav, topic],
  );
  useEffect(() => {
    /**
     * 用于在其他组件刷新话题或消息
     */
    let reload = createThrottleAndDebounce(() => {
      setMessages([...topic.messages]);
      let { ctxIds } = chat.getAskContext(topic, topic.messages.length);
      setCtxIds(ctxIds);
    }, 50);
    console.log('列表刷新');
    topicRender[topic.id] = (messageId?: string | number, reloadStatus: boolean = false) => {
      resetCharCount();
      if (typeof messageId == 'number') {
        reload();
        return;
      }
      if (messageId) {
        return renderMessage[messageId] && renderMessage[messageId](reloadStatus);
      }
      reload();
    };
    return () => {
      delete topicRender[topic.id];
    };
  }, [renderMessage, topic.id, resetCharCount, topic.messages, topic, chat]);

  // 拦截 scrollToBotton/scrollToTop → Virtuoso scrollToIndex
  useEffect(() => {
    const getTargetIdx = (targetId: string): number => {
      // 空 ID 或 topic ID → 滚动到底/顶部
      if (!targetId || targetId === topic.id) return -1;
      return topic.messages.findIndex((m) => m.id === targetId);
    };
    const cleanupBottom = addScrollHook((targetId: string) => {
      const idx = getTargetIdx(targetId);
      if (idx >= 0) {
        virtuosoRef.current?.scrollToIndex({ index: idx, behavior: 'auto', align: 'end' });
        return true;
      }
      if (idx === -1 && topic.messages.length > 0 && (!targetId || targetId === topic.id)) {
        const last = topic.messages.length - 1;
        // 先用估算高度跳到大致位置，触发底部条目渲染
        virtuosoRef.current?.scrollToIndex({ index: last, behavior: 'auto', align: 'end' });
        // 等底部条目渲染并实测后，直接贴到滚动容器真实底部（scrollHeight 反映实测高度）
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            virtuosoRef.current?.scrollTo({ top: Number.MAX_SAFE_INTEGER });
          });
        });
        return true;
      }
      return false;
    }, 'bottom');
    const cleanupTop = addScrollHook((targetId: string) => {
      const idx = getTargetIdx(targetId);
      if (idx >= 0) {
        virtuosoRef.current?.scrollToIndex({ index: idx, behavior: 'auto', align: 'start' });
        return true;
      }
      if (idx === -1 && topic.messages.length > 0 && (!targetId || targetId === topic.id)) {
        virtuosoRef.current?.scrollToIndex({ index: 0, behavior: 'auto', align: 'start' });
        return true;
      }
      return false;
    }, 'top');
    return () => { cleanupBottom(); cleanupTop(); };
  }, [topic]);

  const itemContent = useCallback((_index: number, _data: Message) => {
    return (
      <MessageRow
        key={_data.id}
        msg={_data}
        idx={_index}
        messages={messages}
        chat={chat}
        topic={topic}
        onDel={onDel}
        rBak={rBak}
        renderMessage={renderMessage}
        setCite={setCite}
        ctxIds={ctxIds}
        insertIndex={insertIndex}
        setInsertIndex={setInsertIndex}
        getMsgCallbacks={getMsgCallbacks}
        expandMsg={expandMsg}
        setExpand={setExpand}
        drawPopupProps={drawPopupProps}
        serDrawPopupProps={serDrawPopupProps}
      />
    );
  }, [messages, chat, topic, onDel, rBak, renderMessage, setCite, ctxIds,
    insertIndex, setInsertIndex, getMsgCallbacks, expandMsg, setExpand,
    drawPopupProps, serDrawPopupProps]);

  let runingMsg = Object.entries(loadingMsgs).find((f) => activityTopic?.messageMap[f[0]]);
  return (
    <>
      <Hidden hidden={!runingMsg}>
        <div style={{ position: 'absolute', left: 10, width: 64, height: 64, bottom: 0, opacity: 0.5, zIndex: 99 }}>
          {/* 停止按钮 */}
          <Button
            shape={'circle'}
            size="large"
            icon={<PauseCircleOutlined style={{ color: '#ff8d8f' }} />}
            onClick={() => {
              if (runingMsg && runingMsg[1]) {
                runingMsg[1].stop();
                reloadTopic(topic.id);
              }
            }}
          />
        </div>
      </Hidden>
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        itemContent={itemContent}
        followOutput={'smooth'}
        overscan={1800}
        defaultItemHeight={600}
        initialTopMostItemIndex={{
          index: Math.max(messages.length - 1, 0),
          align: 'end',
        }}
        style={{ height: '100%' }}
        components={{
          Header: () => <div style={{ height: 0 }} />,
          Footer: () => <div style={{ height: '2em' }} />,
        }}
        atBottomThreshold={50}
        onScroll={(e) => {
          const st = e.currentTarget.scrollTop;
          const sh = e.currentTarget.scrollHeight;
          const ch = e.currentTarget.clientHeight;
          isAtBottomRef.current = st + ch >= sh - 50;
          if (!isAtBottomRef.current) activityScroll({});
        }}
      />
      <Hidden hidden={(topic.overrideSettings?.renderType || chat.config.renderType) != 'document' || topic.messages.length < 1}>
        <div style={{ fontSize: '.8em', textAlign: 'center', opacity: 0.5 }}>
          <span>总字数：{countChar}</span>
          <span style={{ marginLeft: 16 }}>上下文：{ctxCountChar}</span>
        </div>
      </Hidden>
    </>
  );
}
