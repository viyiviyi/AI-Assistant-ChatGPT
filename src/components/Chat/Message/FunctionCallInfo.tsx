import { MarkdownView } from '@/components/common/MarkdownView';
import { formatDataForDisplay } from '@/core/utils/ObjectToText';
import { Message } from '@/Models/DataBase';
import { CodeOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, theme } from 'antd';
import { useState } from 'react';

export const FunctionCallInfo = ({ msg }: { msg: Message }) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(false);
  const tool_calls = msg.tool_calls && msg.tool_calls[msg.useTextIdx || 0];
  const functionResults = msg.tool_call_result && msg.tool_call_result[msg.useTextIdx || 0];

  if (!functionResults || functionResults.length == 0) return <></>;
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        boxShadow: token.boxShadowTertiary,
        marginBottom: 5,
      }}
    >
      {functionResults?.map((item) => {
        return (
          <div
            key={msg.id + '_' + item.id}
            style={{
              padding: 0,
              paddingLeft: 5,
              paddingRight: 10,
              marginTop: 5,
              borderRadius: 5,
              border: '1px solid ' + token.colorFillAlter,
              backgroundColor: '#282c34',
            }}
          >
            <Flex gap={16}>
              <CodeOutlined />
              <a style={{ fontWeight: 400, color: token.colorTextLabel }}>{item.desc || item.name}</a>
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
            </Flex>
            {expanded && (
              <>
                <MarkdownView
                  markdown={formatDataForDisplay(tool_calls?.find((f) => f.id == item.id)?.function.arguments || '', '请求参数')}
                />
                <Spin spinning={!item.content}>
                  <MarkdownView markdown={formatDataForDisplay(item.content, '响应结果')} />
                </Spin>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
