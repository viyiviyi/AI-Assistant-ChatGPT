import { CtxItem } from '@/Models/CtxItem';

// 判断是否为对象
const isObject = (value: any): boolean => {
  return value && typeof value === 'object' && !Array.isArray(value);
};

// 解析JSON字符串，如果不是JSON则返回原字符串
export const safeJsonParse = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

// 解析多个拼接的JSON对象，例如：{"a":1}{"b":2} 或 [{"c":3}][{"d":4}]
export const parseMultipleJson = (str: string): any[] | any => {
  if (!str || typeof str !== 'string') return str;
  
  str = str.trim();
  
  // 首先尝试作为单个JSON解析
  try {
    return JSON.parse(str);
  } catch {
    // 如果失败，尝试解析多个JSON
  }
  
  const results: any[] = [];
  let remaining = str;
  
  while (remaining.length > 0) {
    remaining = remaining.trim();
    if (!remaining) break;
    
    let parsed = false;
    
    // 尝试解析对象 {...}
    if (remaining.startsWith('{')) {
      let depth = 0;
      let endIndex = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const char = remaining[i];
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex > 0) {
        try {
          const jsonStr = remaining.substring(0, endIndex);
          results.push(JSON.parse(jsonStr));
          remaining = remaining.substring(endIndex);
          parsed = true;
        } catch (e) {
          // 解析失败，跳出循环
          break;
        }
      }
    }
    // 尝试解析数组 [...]
    else if (remaining.startsWith('[')) {
      let depth = 0;
      let endIndex = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const char = remaining[i];
        if (char === '[') depth++;
        else if (char === ']') {
          depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex > 0) {
        try {
          const jsonStr = remaining.substring(0, endIndex);
          results.push(JSON.parse(jsonStr));
          remaining = remaining.substring(endIndex);
          parsed = true;
        } catch (e) {
          // 解析失败，跳出循环
          break;
        }
      }
    }
    
    // 如果没有成功解析，跳出循环
    if (!parsed) break;
  }
  
  // 如果只解析出一个结果，直接返回该结果
  if (results.length === 1) return results[0];
  
  // 如果解析出多个结果，返回数组
  if (results.length > 1) return results;
  
  // 如果无法解析，返回原始字符串
  return str;
};

// 格式化对象为markdown展示（支持递归展开）
export const formatObjectToMarkdown = (obj: any, title: string, depth: number = 0): string => {
  const lines: string[] = [];
  if (typeof obj == 'string') {
    if (obj.startsWith('img:id:')) return `![图片](${obj.substring(7)})`
    // 如果是字符串，直接返回
    return `${String(obj)}`;
  }
  if (title) lines.push(`##${'#'.repeat(depth)} ${title}:`);
  if (typeof obj == 'object' && obj.type) {
    if (obj.type == 'image_url' && obj.image_url && obj.image_url.url) {
      obj.image_url.url = 'img:id:' + obj.image_url.url;
      depth--;
    }
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
            lines.push(`[${index}]: ${formatObjectToMarkdown(item, '', depth + 1)}`);
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
        lines.push(`**${key}:** ${formatObjectToMarkdown(stringValue, '')}`);
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
  while (typeof data == 'string' && data.startsWith('"') && data.endsWith('"')) {
    data = safeJsonParse(data);
  }
  let parsedData = safeJsonParse(data);
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
