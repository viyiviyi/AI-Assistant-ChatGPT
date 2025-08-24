import { CopyOutlined } from '@ant-design/icons';
import { MenuProps, message, Modal, Typography } from 'antd';
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
import React, {
  createElement,
  DetailedHTMLProps,
  Fragment,
  ImgHTMLAttributes,
  MouseEventHandler,
  useContext,
  useMemo,
  useState
} from 'react';
import rehypeHighlight from 'rehype-highlight';
import rehypeMathjax from 'rehype-mathjax';
import rehypeReact from 'rehype-react';
import { visit } from 'unist-util-visit';
// import rehypeStringify from "rehype-stringify";
// import remarkFrontmatter from "remark-frontmatter";
import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { useSpeak } from '@/core/hooks/tts';
import { onRender } from '@/middleware/execMiddleware';
import rehypeFormat from 'rehype-format';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import markdownStyle from '../../styles/markdown.module.css';
import { SkipExport } from './SkipExport';
import { ZoomImage } from './zoom-image';

let speak = (text: string, stop = false) => {};

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
function preserveNewlines() {
  return (tree: any) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/\n/g, '\u200B\n');
      // Using zero-width space to force line breaks preservation
    });
  };
}
function parseCode(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) {
    return (node as Array<React.ReactNode>).map(parseCode);
  } else if (typeof node == 'object' && 'props' in (node as any)) {
    if (Array.isArray((node as any)['props'].children)) {
      var _children = parseCode((node as any)['props'].children);
      ((node as any)['props'].children as Array<React.ReactNode>).splice(0, (node as any)['props'].children.length, _children);
    }
    return node;
  } else if (typeof node == 'string') {
    // if (node.includes('\n') && !node.trim()) return <br />;
    // console.log(node)
    return node?.replace(/\n\s+/g, (s) => '\n' + ' '.repeat(s.length - 2));
  } else return node;
}

let a = 1;
function pauseMes(mes: React.ReactNode): React.ReactNode {
  let reg = /「[\s\S]*?」|".+?"|\u201C.+?\u201D/gm;
  let regLeft = /「|"|\u201C/;
  let regRight = /」|"|\u201D/;
  if (typeof mes == 'string') {
    let html = mes.replace(reg, function (match) {
      return `<span class="q">${match}</span>`;
    });
    return <span key={a++} dangerouslySetInnerHTML={{ __html: html || '' }}></span>;
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
          <span key={a++}>
            {first.substring(0, idx)}
            <span className="q">
              {first.substring(idx)}
              {...cache}
              {last.substring(0, endIdx + 1)}
            </span>
            {last.substring(endIdx + 1)}
          </span>
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
  .use(remarkRehype, {})
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
  .use(rehypeFormat, { indent: 2 })
  // .use(remarkFrontmatter, ['yaml', 'toml'])
  .use(rehypeReact, {
    createElement,
    Fragment,
    components: {
      a: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
        return <Typography.Link {...(props as any)} rel="noopener noreferrer" target={'_blank'}></Typography.Link>;
      },
      code: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
        let r = React.createRef<HTMLSpanElement>();
        const { className, children } = props;
        const _children = parseCode(children);
        let times = 0;
        let timer = setTimeout(() => {}, 0);
        return (
          <code
            className={className}
            onClick={(e) => {
              times++;
              if (times > 2) {
                let selection = window.getSelection();
                if (selection == null) return;
                let range = document.createRange();
                range.selectNodeContents(e.target as any);
                selection.removeAllRanges();
                selection.addRange(range);
                times = 0;
                return;
              }
              clearTimeout(timer);
              timer = setTimeout(() => {
                times = 0;
              }, 400);
            }}
          >
            <SkipExport>
              <CopyOutlined
                onClick={(e) => {
                  // if (copy(toTxt(children))) {
                  //   message.success('已复制');
                  // }
                  if (r.current && copy(r.current?.innerText || '')) {
                    message.success('已复制');
                  }
                }}
                className="code-copy"
              />
            </SkipExport>
            <span ref={r}>{_children}</span>
          </code>
        );
      },
      p: (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
        const { children } = props;
        let _children = pauseMes(children);
        let times = 0;
        let timer = setTimeout(() => {}, 0);
        let speakTimer = setTimeout(() => {}, 0);
        return (
          <p
            {...{ ...(props as any), children: undefined }}
            onClick={(e) => {
              if (times == 1 && 'className' in e.target && e.target.className == 'q') {
                speakTimer = setTimeout(() => {
                  speak((e.target as any).innerText, true);
                }, 400);
              } else {
                clearTimeout(speakTimer);
              }
              times++;
              if (times > 2) {
                let selection = window.getSelection();
                if (selection == null) return;
                let range = document.createRange();
                range.selectNodeContents(e.target as any);
                selection.removeAllRanges();
                selection.addRange(range);
                times = 0;
                return;
              }

              clearTimeout(timer);
              timer = setTimeout(() => {
                times = 0;
              }, 400);
            }}
          >
            {_children}
          </p>
        );
      },
      img(props: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
        let imgSrc = props.src;
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.src}
            alt={props.alt}
            onClick={(e) => {
              e.stopPropagation();
              let modal = Modal.success({
                icon: null,
                footer: null,
                title: null,
                width: '100vw',
                style: { top: 0 },
                styles: {
                  content: { padding: 0 },
                },
                content: (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100dvh',
                        overflow: 'auto',
                        zIndex: 99,
                      }}
                    >
                      <span
                        style={{ cursor: 'pointer', position: 'fixed', top: 0, right: 10, padding: 10, zIndex: 1, color: '#fff' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          modal.destroy();
                        }}
                      >
                        ✖
                      </span>
                      <ZoomImage src={imgSrc} alt={props.alt} />
                    </div>
                  </>
                ),
              });
            }}
          />
        );
        return img;
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
  speak = useSpeak();
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
      }, 400)
    );
  };
  // return <div style={{ whiteSpace: 'pre-wrap' }}>{markdown}</div>;
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
  (input, chatMgt: ChatManagement) => {
    return input.replace(/\n +```/g, '\n```');
  },
  (input, chatMgt: ChatManagement) => {
    return input.replace(/[ \t\r]+\n/g, '\n');
  },
  // (input, chatMgt: ChatManagement) => {
  //   return input.replace(/\n\s\s+([a-zA-Z#/*{}()])/g, (substring: string, ...args: any[]) => {
  //     return '\n' + '\u00A0'.repeat(substring.length - 1) + args[0];
  //   });
  // },
];

function pipe(input: string, chatMgt: ChatManagement): string {
  let output = input;
  renderPipes.forEach((func) => {
    output = func(output, chatMgt);
  });
  return output;
}
