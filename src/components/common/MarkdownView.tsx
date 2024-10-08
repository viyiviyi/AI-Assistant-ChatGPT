import { CopyOutlined } from '@ant-design/icons';
import { MenuProps, message, Typography } from 'antd';
import copy from 'copy-to-clipboard';
import bash from 'highlight.js/lib/languages/bash';
import dart from 'highlight.js/lib/languages/dart';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import handlebars from 'highlight.js/lib/languages/handlebars';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import React, { createElement, Fragment, MouseEventHandler, useContext, useMemo, useState } from 'react';
import rehypeHighlight from 'rehype-highlight';
import rehypeMathjax from 'rehype-mathjax';
import rehypeReact from 'rehype-react';
// import rehypeStringify from "rehype-stringify";
// import remarkFrontmatter from "remark-frontmatter";
// import rehypeFormat from 'rehype-format';
import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { onRender } from '@/middleware/execMiddleware';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import markdownStyle from '../../styles/markdown.module.css';
import { SkipExport } from './SkipExport';
function toTxt(node: React.ReactNode): string {
  let str = '';
  if (Array.isArray(node)) {
    str += (node as Array<React.ReactNode>).map(toTxt).join('');
  } else if (typeof node == 'object' && 'props' in (node as any)) {
    str += (node as any)['props'] && toTxt((node as any)['props'].children);
  } else {
    str += node?.toString();
  }
  return str;
}
function pauseMes(mes: React.ReactNode): React.ReactNode {
  let reg = /「[\s\S]*?」|".+?"|\u201C.+?\u201D/gm;
  let regLeft = /「|"|\u201C/;
  let regRight = /」|"|\u201D/;
  if (typeof mes == 'string') {
    let html = mes.replace(reg, function (match) {
      return `<span class="q">${match}</span>`;
    });
    return <span dangerouslySetInnerHTML={{ __html: html || '' }}></span>;
  }
  if (Array.isArray(mes)) {
    let arr: React.ReactNode[] = [];
    let str = '';
    let cache: React.ReactNode[] = [];
    for (let i = 0; i < mes.length; i++) {
      if (typeof mes[i] == 'string' && reg.test(mes[i])) {
        arr.push(pauseMes(mes[i]));
        str = '';
        cache = [];
      } else if ((typeof mes[i] == 'string' && regLeft.test(mes[i])) || str) {
        str += toTxt(mes[i]);
        cache.push(mes[i]);
      } else {
        arr.push(pauseMes(mes[i]));
      }
      if (reg.test(str) && typeof mes[i] == 'string' && regRight.test(mes[i])) {
        let first = cache.shift() as string;
        let idx = first.search(regLeft);
        let last = cache.pop() as string;
        let endIdx = last.search(regRight);
        arr.push(
          <>
            {first.substring(0, idx)}
            <span className="q">
              {first.substring(idx)}
              {...cache}
              {last.substring(0, endIdx + 1)}
            </span>
            {last.substring(endIdx + 1)}
          </>
        );
        str = '';
        cache = [];
      } else if (reg.test(str)) {
        arr.push(pauseMes(str));
        str = '';
        cache = [];
      }
    }
    if (str) arr.push(...cache);
    return arr;
  }
  if (mes && typeof mes == 'object' && 'props' in mes && 'children' in mes.props && Array.isArray(mes.props.children)) {
    let arr = pauseMes(mes.props.children) as React.ReactNode[];
    mes.props.children.length = []; 
    mes.props.children.push(...arr);
  }
  return mes;
}
let processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeHighlight, {
    ignoreMissing: true,
    plainText: ['txt', 'text'],
    languages: {
      bash,
      dockerfile,
      javascript,
      handlebars,
      java,
      json,
      nginx,
      shell,
      sql,
      typescript,
      xml,
      yaml,
      dart,
    },
  })
  .use(rehypeMathjax)
  // .use(remarkFrontmatter, ["yaml", "toml"])
  // .use(rehypeFormat, {indent:4})
  .use(rehypeReact, {
    createElement,
    Fragment,
    components: {
      a: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
        return <Typography.Link {...(props as any)} rel="noopener noreferrer" target={'_blank'}></Typography.Link>;
      },
      code: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
        const { className, children } = props;
        return (
          <code className={className}>
            <SkipExport>
              <CopyOutlined
                onClick={() => {
                  if (copy(toTxt(children))) {
                    message.success('已复制');
                  }
                }}
                className="code-copy"
              />
            </SkipExport>
            {children}
          </code>
        );
      },
      p: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
        const { children } = props;
        let _children = pauseMes(children);
        return <p {...{ ...(props as any), children: undefined }}>{_children}</p>;
      },
    },
  });

// 创建解析方法
const _MarkdownView = ({
  markdown,
  menu,
  doubleClick,
  lastBlockLines = 0,
}: {
  markdown: string;
  menu?: MenuProps;
  doubleClick?: React.MouseEventHandler<HTMLDivElement>;
  lastBlockLines?: number;
}) => {
  const { chatMgt } = useContext(ChatContext);
  const firstBlock = useMemo(() => {
    if (lastBlockLines) {
      let lines = markdown.split('\n');
      if (lines.length > lastBlockLines) return lines.slice(0, lines.length - lastBlockLines).join('\n');
    }
    return markdown;
  }, [lastBlockLines, markdown]);
  const lastBlock = useMemo(() => {
    if (lastBlockLines) {
      let lines = markdown.split('\n');
      if (lines.length > lastBlockLines) return lines.slice(-lastBlockLines).join('\n');
    }
    return '';
  }, [lastBlockLines, markdown]);
  const renderedContent = useMemo(() => {
    return processor.processSync(pipe(firstBlock, chatMgt)).result;
  }, [chatMgt, firstBlock]);
  const renderedLastContent = useMemo(() => {
    return processor.processSync(pipe(lastBlock, chatMgt)).result;
  }, [chatMgt, lastBlock]);
  const [checkTimes, setChrckTimes] = useState(0);
  const [timer, setTimer] = useState(setTimeout(() => {}, 0));
  const click: MouseEventHandler<HTMLDivElement> = (e) => {
    clearTimeout(timer);
    if (checkTimes + 1 >= 4 && doubleClick) {
      doubleClick!(e);
      setChrckTimes(0);
    } else {
      setChrckTimes((v) => ++v);
    }
    setTimer(
      setTimeout(() => {
        setChrckTimes(0);
      }, 500)
    );
  };
  return (
    <div className={markdownStyle.markdown} onClick={click}>
      {renderedContent}
      {lastBlock ? renderedLastContent : null}
    </div>
  );
};

export const MarkdownView = React.memo(_MarkdownView);
export function isXML(str: string) {
  try {
    var parser = new DOMParser();
    parser.parseFromString(str, 'text/xml');
    return true;
  } catch (error) {
    return false;
  }
}

const renderPipes: Array<(input: string, chatMgt: ChatManagement) => string> = [
  // (input) => {
  //   if (/^</.test(input) && isXML(input)) {
  //     // 让xml显示为xml代码
  //     return "```xml\n" + input + "\n```";
  //   }
  //   return input;
  // },
  // (input) => {
  //     return input.replace(/\n/g, "  \n");
  //     // return input.replace(/([!\?~。！？】）～：；”……」])\n([^\n])/g, "$1\n\n$2");
  // },
  // (input) => {
  //   return input.replace(/「[\s\S]*?」|".+?"|\u201C.+?\u201D/gm, function (match, p1, p2) {
  //     return `<span class="q">${match}</span>`;
  //   });
  // },
  (input, chatMgt: ChatManagement) => {
    return onRender(chatMgt as any, input);
  },
];

function pipe(input: string, chatMgt: ChatManagement): string {
  let output = input;
  renderPipes.forEach((func) => {
    output = func(output, chatMgt);
  });
  return output;
}
