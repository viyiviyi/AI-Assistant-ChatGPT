import { CtxItem } from '@/Models/CtxItem';

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
export const formatObjectToMarkdown = (obj: any, title: string, depth: number = 0): string => {
  const lines: string[] = [];
  if (typeof obj == 'string') {
    // 如果是字符串，直接返回
    return `${String(obj)}`;
  }
  if (title) lines.push(`**${title}:**`);
  lines.push('');
  if (Array.isArray(obj) && obj.filter((f) => f.type).length == obj.length) {
    obj.forEach((v, i) => {
      lines.push(`**[${i}:]**`);
      if (v.type == 'text' && v.text) lines.push(formatObjectToMarkdown(safeJsonParse(v.text), '', depth + 1));
      else if (v.type == 'image_url' && v.image_url && v.image_url.url) lines.push(`![图片](${v.image_url.url})`);
      else lines.push(formatObjectToMarkdown(v, '', depth + 1));
      lines.push('');
    });
    return lines.join('\n');
  }
  if (typeof obj == 'object' && obj.type && (obj.type == 'text' || obj.type == 'image_url')) {
    if (obj.type == 'text' && obj.text) lines.push(formatObjectToMarkdown(safeJsonParse(obj.text), '', depth + 1));
    else if (obj.type == 'image_url' && obj.image_url && obj.image_url.url) lines.push(`![图片](${obj.image_url.url})`);
    else lines.push(formatObjectToMarkdown(obj, '', depth + 1));
    return lines.join('\n');
  }

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
      const hasObjects = value.some((item) => isObject(item));
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
      // 其他类型直接展示，如果包含换行符则放入代码块
      const stringValue = String(value);
      if (stringValue.includes('\n')) {
        lines.push(`**${key}:**`);
        lines.push('```');
        lines.push(stringValue);
        lines.push('```');
      } else {
        lines.push(`**${key}:** ${stringValue}`);
      }
    }
    lines.push('');
  });

  return lines.join('\n');
};

// 格式化参数或结果为markdown展示
export const formatDataForDisplay = (data: string, title: string): string => {
  if (!data) {
    return `**${title}:**\n\n*无数据*`;
  }

  // 尝试解析为JSON
  const parsedData = safeJsonParse(data);
  if (typeof parsedData == 'object') {
    // 如果是对象，使用对象格式化（从深度0开始）
    return formatObjectToMarkdown(parsedData, title, 0);
  } else {
    if (!title) return data;
    // 其他情况直接展示，如果包含换行符则放入代码块
    const stringValue = String(parsedData);
    if (stringValue.includes('\n')) {
      return `**${title}:**\n\n\`\`\`\n${stringValue}\n\`\`\``;
    } else {
      return `**${title}:**\n\n${stringValue}`;
    }
  }
};

export const formatContentToMarkdown = (data?: CtxItem['content']) => {
  if (!data) return '';
  return formatObjectToMarkdown(data, '', 0);
};
