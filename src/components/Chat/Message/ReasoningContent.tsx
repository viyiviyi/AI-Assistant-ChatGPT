import { MarkdownView } from '@/components/common/MarkdownView';
import { ChatManagement } from '@/core/ChatManagement';
import { Message } from '@/Models/DataBase';
import { Button, Flex, theme } from 'antd';
import copy from 'copy-to-clipboard';
import { useState } from 'react';

export const ReasoningContent = ({ msg }: { msg: Message }) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      {!!msg.reasoning_content?.length && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: 10,
            flexDirection: 'column',
            boxSizing: 'border-box',
            borderRadius: token.borderRadiusLG,
            border: '1px solid ' + token.colorFillAlter,
            backgroundColor: token.colorInfoBg,
            marginBottom: 2,
            boxShadow: token.boxShadowTertiary,
            lineHeight: 1.4,
          }}
        >
          <Flex style={{ marginBottom: 6 }} gap={16}>
            <a style={{ fontWeight: 400, fontSize: '1.3em', color: token.colorTextLabel }}>
              {msg.text.length ? <>已</> : <></>}深度思考{msg.text.length ? <></> : <span>中......</span>}
            </a>
            <span style={{ flex: 1 }}></span>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, marginLeft: 4 }}
              onClick={() => {
                setExpanded((v) => !v);
              }}
            >
              {expanded ? '隐藏' : '查看'}
            </Button>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, marginLeft: 4 }}
              onClick={() => {
                copy(ChatManagement.getMsgReasoningContent(msg) || '');
              }}
            >
              复制
            </Button>
          </Flex>
          {expanded && (
            <MarkdownView
              markdown={ChatManagement.getMsgReasoningContent(msg)}
              // lastBlockLines={loadingMsgs[msg.id] ? 3 : 0}
            />
          )}
        </div>
      )}
    </>
  );
};
