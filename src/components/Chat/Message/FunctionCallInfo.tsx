import { MarkdownView } from '@/components/common/MarkdownView';
import { Message } from '@/Models/DataBase';
import { Button, Flex, theme } from 'antd';
import { useState } from 'react';

export const FunctionCallInfo = ({ msg }: { msg: Message }) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  const [functionResults] = useState(msg.tool_call_result && msg.tool_call_result[msg.useTextIdx || 0]);
  if (!functionResults || functionResults.length == 0) return <></>;
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        boxShadow: token.boxShadowTertiary,
        lineHeight: 1.4,
        marginLeft: -10,
        marginTop: -10,
      }}
    >
      {functionResults?.map((item) => {
        return (
          <div
            key={msg.id + '_' + item.id}
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              marginTop: 5,
              borderRadius: token.borderRadiusLG,
              border: '1px solid ' + token.colorFillAlter,
              backgroundColor: token.colorInfoBg,
            }}
          >
            <Flex gap={16}>
              <a style={{ fontWeight: 400, fontSize: '1.3em', color: token.colorTextLabel }}>{item.desc || item.name}</a>
              <span style={{ flex: 1 }}></span>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, marginLeft: 4 }}
                onClick={() => {
                  setExpanded((v) => !v);
                }}
                loading={!item.content}
              >
                {expanded ? '隐藏' : '查看'}
              </Button>
            </Flex>
            {expanded && <MarkdownView markdown={'```\n' + item.content + '\n```'} />}
          </div>
        );
      })}
    </div>
  );
};
