import { Hidden } from '@/components/common/Hidden';
import { TopicConfigModal } from '@/components/TopicConfig/TopicConfig';
import { ChatContext, ChatManagement, IChat } from '@/core/ChatManagement';
import { useSendMessage } from '@/core/hooks/hooks';
import { TopicMessage } from '@/Models/Topic';
import { CaretRightOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Collapse, Input, Popconfirm, Space, theme, Typography } from 'antd';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SkipExport } from '../../common/SkipExport';
import { MessageContext } from '../Chat';
import { MemoInsertInput } from '../InsertInput';
import { MessageList, reloadTopic } from './MessageList';

const { Panel } = Collapse;

const MemoTopicTitle = React.memo(TopicTitle);
const MemoMessageList = React.memo(MessageList);
const MemoTopUtil = React.memo(TopUtil);
export const ChatMessage = () => {
  const { token } = theme.useToken();
  const firstMsgIdx = useRef<number>();
  const { chatMgt: chat, setActivityTopic, activityTopic, reloadNav, forceRender } = useContext(ChatContext);
  const [activityKey, setActivityKey] = useState<string[]>([chat.config.activityTopicId]);
  const [topicId, setTopicId] = useState<string>();
  const { onlyOne, closeAll, showTitle, setCloseAll: setCloasAll } = useContext(MessageContext);
  const [none, setNone] = useState([]);
  const onClickTopicTitle = useCallback(
    async (topic: TopicMessage) => {
      setTopicId(topic.id);
      setActivityTopic(topic);
      setCloasAll(false);
      setActivityKey((v) => {
        if (v.includes(topic.id)) {
          return v.filter((v) => v != topic.id);
        } else {
          return [...v, topic.id];
        }
      });
    },
    [setActivityTopic, setCloasAll]
  );
  useEffect(() => {
    if (closeAll) {
      setActivityKey([]);
    } else {
      if (activityTopic?.id && activityTopic?.id != topicId)
        setActivityKey((v) => {
          if (v.includes(activityTopic.id)) {
            return v.filter((v) => v != activityTopic.id);
          } else {
            return [...v, activityTopic.id];
          }
        });
    }
  }, [activityTopic?.id, closeAll, topicId]);
  const handlerDelete = useCallback(
    (topic: TopicMessage) => {
      chat.removeTopic(topic!).then(() => {
        let next_t = activityTopic;
        if (activityTopic == topic) {
          next_t = chat.topics.length ? chat.topics.slice(-1)[0] : undefined;
        }
        setActivityTopic(next_t);
        if (next_t && !activityKey.includes(next_t?.id || '')) setActivityKey((k) => [next_t!.id, ...k]);
        reloadNav(next_t!);
        reloadTopic;
        setNone([]);
      });
    },
    [activityKey, activityTopic, chat, reloadNav, setActivityTopic]
  );

  if (onlyOne) {
    let topic = activityTopic;
    if (topic) {
      return (
        <div
          style={{
            padding: token.paddingContentVerticalSM,
            paddingBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Hidden hidden={!showTitle}>
            <MemoTopicTitle topic={topic} onClick={() => {}}></MemoTopicTitle>
            <div style={{ marginTop: '15px' }}>
              <MemoTopUtil topic={topic} onDle={handlerDelete} firstMsgIdxRef={firstMsgIdx} />
            </div>
          </Hidden>
          <div id={'content'} style={{ flex: 1, overflow: 'auto' }}>
            <MemoMessageList chat={chat} topic={topic} firstMsgIdxRef={firstMsgIdx}></MemoMessageList>
          </div>
        </div>
      );
    }
    return <></>;
  }

  return (
    <Collapse
      ghost
      bordered={false}
      activeKey={closeAll ? [] : activityKey}
      expandIcon={({ isActive }) => (
        <SkipExport>
          <CaretRightOutlined rotate={isActive ? 90 : 0} />
        </SkipExport>
      )}
      items={chat.topics.map((v) => ({
        forceRender: forceRender,
        key: v.id,
        style: { border: 'none', padding: '0 8px', width: '100%' },
        label: <MemoTopicTitle topic={v} onClick={() => onClickTopicTitle(v)}></MemoTopicTitle>,
        children: (
          <div id={v.id}>
            <>
              <MemoTopUtil topic={v} onDle={handlerDelete} firstMsgIdxRef={firstMsgIdx} />
              <MemoMessageList chat={chat} topic={v} firstMsgIdxRef={firstMsgIdx}></MemoMessageList>
            </>
          </div>
        ),
      }))}
    ></Collapse>
  );
};

function TopUtil({
  topic: v,
  onDle,
  firstMsgIdxRef,
}: {
  topic: TopicMessage;
  onDle: (topic: TopicMessage) => void;

  firstMsgIdxRef: React.MutableRefObject<number | undefined>;
}) {
  const [showInsert0, setShowInsert0] = useState(false);
  const { chatMgt: chat } = useContext(ChatContext);
  const { sendMessage } = useSendMessage(chat);
  const [selectRoles, setSelectRoles] = useState({
    assistant: true,
    system: true,
    user: true,
  });
  return (
    <>
      <div
        style={{
          borderBottom: '1px solid #ccc5',
          width: '100%',
          display: 'flex',
          marginBottom: 5,
          marginTop: 0,
        }}
      >
        <Button
          shape="circle"
          type="text"
          icon={
            <SkipExport>
              <PlusOutlined />
            </SkipExport>
          }
          onClick={() => {
            reloadTopic(v.id, 0);
            setShowInsert0((v) => !v);
          }}
        ></Button>
        <Button
          shape="circle"
          type="text"
          icon={
            <SkipExport>
              <MessageOutlined />
            </SkipExport>
          }
          onClick={() => {
            sendMessage((firstMsgIdxRef.current ?? 0) - 1, v);
          }}
        ></Button>
        <span style={{ flex: 1 }}></span>
        <TopicConfigModal topic={v}></TopicConfigModal>
        <span style={{ flex: 1 }}></span>
        <Space size={10}>
          <Typography.Title level={5} style={{ opacity: 0.5 }} onClick={(e) => e.stopPropagation()}>
            <SkipExport>
              <Popconfirm
                overlayInnerStyle={{ whiteSpace: 'nowrap' }}
                placement="topRight"
                okType="danger"
                title="确定删除此话题？"
                onConfirm={() => {
                  onDle(v);
                }}
              >
                <DeleteOutlined style={{ color: '#ff8d8f', padding: '0 5px' }}></DeleteOutlined>
              </Popconfirm>
            </SkipExport>
          </Typography.Title>
          <Typography.Title level={5} style={{ opacity: 0.5, padding: '0 5px' }} onClick={(e) => e.stopPropagation()}>
            <SkipExport>
              <Popconfirm
                title="请选择内容格式。"
                placement="topRight"
                description={
                  <>
                    <p>当选择对话时，将会给每条消息前加上助理或用户的名字。</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span>{'指定身份，仅对md文档生效'}</span>
                      <Checkbox
                        checked={selectRoles.user}
                        onChange={(e) => {
                          setSelectRoles((v) => ({
                            ...v,
                            user: e.target.checked,
                          }));
                        }}
                      >
                        {'用户'}
                      </Checkbox>
                      <Checkbox
                        checked={selectRoles.assistant}
                        onChange={(e) => {
                          setSelectRoles((v) => ({
                            ...v,
                            assistant: e.target.checked,
                          }));
                        }}
                      >
                        {'助理'}
                      </Checkbox>
                      <Checkbox
                        checked={selectRoles.system}
                        onChange={(e) => {
                          setSelectRoles((v) => ({
                            ...v,
                            system: e.target.checked,
                          }));
                        }}
                      >
                        {'系统'}
                      </Checkbox>
                    </div>
                  </>
                }
                onConfirm={() => {
                  downloadTopic(v, false, chat.getChat(), selectRoles);
                }}
                onCancel={() => {
                  downloadTopic(v, true, chat.getChat(), selectRoles);
                }}
                okText={'文档'}
                cancelText={'对话'}
              >
                <DownloadOutlined></DownloadOutlined>
              </Popconfirm>
            </SkipExport>
          </Typography.Title>
        </Space>
      </div>
      {showInsert0 ? (
        <MemoInsertInput key={'insert0_input'} insertIndex={0} topic={v} chat={chat} onHidden={() => setShowInsert0(false)} />
      ) : (
        <></>
      )}
    </>
  );
}

function TopicTitle({ topic, onClick }: { topic: TopicMessage; onClick: () => void }) {
  const { token } = theme.useToken();
  const { chatMgt: chat } = useContext(ChatContext);
  const [title, setTitle] = useState(topic.name);
  const [edit, setEdit] = useState(false);
  const cancelEdit = useCallback(() => {
    setEdit(false);
  }, []);
  useEffect(() => {
    document.removeEventListener('click', cancelEdit);
    document.addEventListener('click', cancelEdit);
    return () => {
      document.removeEventListener('click', cancelEdit);
    };
  }, [cancelEdit]);
  useEffect(() => {
    setTitle(topic.name);
  }, [topic]);
  return (
    <div style={{ position: 'relative', height: '24px' }} onClick={(e) => e.stopPropagation()}>
      {edit ? (
        <Input.TextArea
          placeholder={topic.name}
          autoSize={{ maxRows: 10 }}
          allowClear
          autoFocus={true}
          value={title}
          onKeyUp={(e) => {
            if ((e.key === 's' && e.ctrlKey) || e.key == 'Enter') {
              e.stopPropagation();
              e.preventDefault();
              chat.saveTopic(topic.id, title.trim());
              setEdit(false);
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === 's' && e.ctrlKey) || e.key == 'Enter') {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onChange={(e) => setTitle(e.target.value)}
        />
      ) : (
        <>
          <Typography.Title
            ellipsis={{ rows: 1 }}
            level={5}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            style={{
              color: chat.config.activityTopicId == topic.id ? token.colorPrimary : undefined,
              width: 'calc(100% - 40px)',
              position: 'absolute',
            }}
          >
            {title}
          </Typography.Title>
          <Button
            style={{ position: 'absolute', right: 0 }}
            type="text"
            icon={
              <SkipExport>
                <EditOutlined />
              </SkipExport>
            }
            onClick={(e) => {
              e.stopPropagation();
              setEdit((v) => !v);
            }}
          ></Button>
        </>
      )}
    </div>
  );
}

export function downloadTopic(
  topic: TopicMessage,
  useRole: boolean,
  chat: IChat,
  role: {
    assistant: boolean;
    system: boolean;
    user: boolean;
  }
) {
  let str = '#' + ChatManagement.parseText(topic.name).substring(0, 64);
  str += '\n---\n';
  topic.messages.forEach((v) => {
    let virtualRole = chat.virtualRole;
    if (v.ctxRole === 'system' && role.system) {
      if (useRole) str += '系统：\n';
      str += v.text.replace(/^#+\s*\n/, '') + '\n\n';
    } else if (v.ctxRole === 'assistant' && role.assistant) {
      if (useRole) str += virtualRole.name + ':\n';
      str += v.text.replace(/^#+\s*\n/, '') + '\n\n';
    } else if (v.ctxRole === 'user' && role.system) {
      if (useRole) str += chat.user.name + ':\n';
      str += v.text.replace(/^#+\s*\n/, '') + '\n\n';
    }
  });
  downloadText(str, topic.name + '.md');
}

function downloadText(jsonData: string, filename: string) {
  const blob = new Blob([jsonData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
