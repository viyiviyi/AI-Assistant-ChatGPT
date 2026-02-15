import { Hidden } from '@/components/common/Hidden';
import { DraePopup } from '@/components/drawimg/DrawPopup';
import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { useScreenSize, useSendMessage } from '@/core/hooks/hooks';
import { activityScroll, createThrottleAndDebounce, getUuid, pagesUtil } from '@/core/utils/utils';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { PictureOutlined } from '@ant-design/icons';
import { Button, FloatButton, InputRef, Table } from 'antd';
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
  const [insertIndex, setInsertIndex] = useState(-1);
  const [countChar, setCountChar] = useState(0);
  const [ctxCountChar, setCtxCountChar] = useState(0);
  const [drawPopupProps, serDrawPopupProps] = useState({ text: '', open: false, msg: topic.messages[0] });
  const [messages, setMessages] = useState(topic.messages);

  const tblRef: Parameters<typeof Table>[0]['ref'] = React.useRef(null);
  const { sendMessage } = useSendMessage(chat);

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
    // tblRef.current?.scrollTo({ index: messages.length - 1 });
  }, [topic, topic.messages]);
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
        reloadNav(topic);
      });
    },
    [chat, renderMessage, reloadNav, topic],
  );
  useEffect(() => {
    /**
     * 用于在其他组件刷新话题或消息
     */
    let reload = createThrottleAndDebounce(() => {
      setMessages([...topic.messages]);
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
  }, [renderMessage, topic.id, resetCharCount, topic.messages]);

  return (
    <div>
      <Table<Message>
        bordered={false}
        size={'small'}
        style={{ height: '100%', backgroundColor: '#0000' }}
        onRow={(r, i) => {
          return { style: { backgroundColor: '#0000', border: 'none', padding: 0 } };
        }}
        showHeader={false}
        virtual
        columns={[
          {
            onCell: (v) => {
              return { style: { border: 'none', padding: 0, width: '100%', minWidth: 327 }, id: v.id };
            },
            key: 'id',
            dataIndex: 'text',
            render(value, v, i) {
              let idx = i
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
                          }),
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
            },
          },
        ]}
        rowKey="id"
        dataSource={messages}
        pagination={false}
        ref={tblRef}
      />
      <Hidden hidden={(topic.overrideSettings?.renderType || chat.config.renderType) != 'document' || topic.messages.length < 1}>
        <div style={{ fontSize: '.8em', textAlign: 'center', opacity: 0.5 }}>
          <span>总字数：{countChar}</span>
          <span style={{ marginLeft: 16 }}>上下文：{ctxCountChar}</span>
        </div>
      </Hidden>
    </div>
  );
}
