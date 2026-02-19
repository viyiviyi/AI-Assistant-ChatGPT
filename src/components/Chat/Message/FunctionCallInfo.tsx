import { MarkdownView } from '@/components/common/MarkdownView';
import { Message } from '@/Models/DataBase';
import { CodeOutlined } from '@ant-design/icons';
import { Button, Flex, theme } from 'antd';
import { useState } from 'react';

// 判断是否为对象
const isObject = (value: any): boolean => {
  return value && typeof value === 'object' && !Array.isArray(value);
};

// 解析JSON字符串，如果不是JSON则返回原字符串
const safeJsonParse = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

// 格式化对象为markdown展示（支持递归展开）
const formatObjectToMarkdown = (obj: any, title: string, depth: number = 0): string => {
  const lines: string[] = [];
  
  if (!isObject(obj)) {
    // 如果不是对象，直接返回
    return `**${title}:**\n\n${String(obj)}`;
  }
  
  lines.push(`**${title}:**`);
  lines.push('');
  
  Object.entries(obj).forEach(([key, value]) => {
    if (isObject(value)) {
      // 如果值还是对象，根据深度决定是否继续展开
      if (depth < 1) {
        // 深度小于1时，继续展开一层
        lines.push(formatObjectToMarkdown(value, key, depth + 1));
      } else {
        // 深度达到限制，序列化为JSON字符串
        lines.push(`**${key}:**`);
        lines.push('```json');
        lines.push(JSON.stringify(value, null, 2));
        lines.push('```');
      }
    } else if (Array.isArray(value)) {
      // 如果是数组，检查数组元素是否为对象
      const hasObjects = value.some(item => isObject(item));
      if (hasObjects && depth < 1) {
        // 数组包含对象且深度未达到限制，尝试展开数组中的对象
        lines.push(`**${key}:**`);
        lines.push('');
        value.forEach((item, index) => {
          if (isObject(item)) {
            lines.push(formatObjectToMarkdown(item, `[${index}]`, depth + 1));
          } else {
            lines.push(`[${index}]: ${String(item)}`);
          }
          lines.push('');
        });
      } else {
        // 数组不包含对象或深度达到限制，序列化为JSON字符串
        lines.push(`**${key}:**`);
        lines.push('```json');
        lines.push(JSON.stringify(value, null, 2));
        lines.push('```');
      }
    } else {
      // 其他类型直接展示
      lines.push(`**${key}:** ${String(value)}`);
    }
    lines.push('');
  });
  
  return lines.join('\n');
};

// 格式化参数或结果为markdown展示
const formatDataForDisplay = (data: string, title: string): string => {
  if (!data) {
    return `**${title}:**\n\n*无数据*`;
  }

  // 尝试解析为JSON
  const parsedData = safeJsonParse(data);

  if (isObject(parsedData)) {
    // 如果是对象，使用对象格式化（从深度0开始）
    return formatObjectToMarkdown(parsedData, title, 0);
  } else if (Array.isArray(parsedData)) {
    // 如果是数组，序列化为JSON字符串展示
    return `**${title}:**\n\n\`\`\`json\n${JSON.stringify(parsedData, null, 2)}\n\`\`\``;
  } else {
    // 其他情况直接展示
    return `**${title}:**\n\n${String(parsedData)}`;
  }
};

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
              padding: 5,
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
                loading={!item.content}
              >
                {expanded ? '隐藏' : '查看'}
              </Button>
            </Flex>
            {expanded && (
              <>
                <MarkdownView
                  markdown={formatDataForDisplay(tool_calls?.find((f) => f.id == item.id)?.function.arguments || '', '请求参数')}
                />
                <MarkdownView markdown={formatDataForDisplay(item.content, '响应结果')} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
