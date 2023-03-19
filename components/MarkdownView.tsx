import { unified } from "unified";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import bash from "highlight.js/lib/languages/bash";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import javascript from "highlight.js/lib/languages/javascript";
import handlebars from "highlight.js/lib/languages/handlebars";
import java from "highlight.js/lib/languages/java";
import json from "highlight.js/lib/languages/json";
import nginx from "highlight.js/lib/languages/nginx";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import dart from "highlight.js/lib/languages/dart";
import remarkParse from "remark-parse";
import { createElement, Fragment} from "react";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeReact from "rehype-react";
import React from "react";
import copy from "copy-to-clipboard";
import { CopyOutlined } from "@ant-design/icons";

function toTxt(node: React.ReactNode): string {
  let str = "";
  if (Array.isArray(node)) {
    str += (node as Array<React.ReactNode>).map(toTxt).join("");
  } else if (typeof node == "object" && "props" in (node as any)) {
    str += (node as any)["props"] && toTxt((node as any)["props"].children);
  } else {
    str += node
  }
  return str;
}

// 创建解析方法
export function MarkdownView({ markdown }: { markdown: string }) {
  if (/^</.test(markdown) && isXML(markdown)) {
    markdown = "```xml\n" + markdown + "\n```";
  }
  let processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(remarkGfm)
    .use(remarkMath)
    .use(rehypeKatex)
    .use(rehypeHighlight, {
      ignoreMissing: true,
      plainText: ["txt", "text"],
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
    .use(rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        span: [
          ...(defaultSchema.attributes?.span || []),
          // List of all allowed tokens:
          [
            "className",
            "hljs-addition",
            "hljs-attr",
            "hljs-attribute",
            "hljs-built_in",
            "hljs-bullet",
            "hljs-char",
            "hljs-code",
            "hljs-comment",
            "hljs-deletion",
            "hljs-doctag",
            "hljs-emphasis",
            "hljs-formula",
            "hljs-keyword",
            "hljs-link",
            "hljs-literal",
            "hljs-meta",
            "hljs-name",
            "hljs-number",
            "hljs-operator",
            "hljs-params",
            "hljs-property",
            "hljs-punctuation",
            "hljs-quote",
            "hljs-regexp",
            "hljs-section",
            "hljs-selector-attr",
            "hljs-selector-class",
            "hljs-selector-id",
            "hljs-selector-pseudo",
            "hljs-selector-tag",
            "hljs-string",
            "hljs-strong",
            "hljs-subst",
            "hljs-symbol",
            "hljs-tag",
            "hljs-template-tag",
            "hljs-template-variable",
            "hljs-title",
            "hljs-type",
            "hljs-variable",
          ],
        ],
      },
    })
    .use(rehypeStringify)
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: {
        code: (
          props: React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            HTMLElement
          >
        ) => {
          const { className, children } = props;
          return (
            <code className={className}>
              <CopyOutlined
                onClick={() => {
                  copy(toTxt(children));
                }}
                className="code-copy"
              />
              {children}
            </code>
          );
        },
      },
    });
  const renderedMarkdown = processor.processSync(markdown).result;
  return <div>{renderedMarkdown}</div>;
}
function isXML(str: string) {
  try {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(str, "text/xml");
    return true;
  } catch (error) {
    return false;
  }
}
