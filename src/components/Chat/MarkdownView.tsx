import { CopyOutlined } from "@ant-design/icons";
import { MenuProps, message, Typography } from "antd";
import copy from "copy-to-clipboard";
import bash from "highlight.js/lib/languages/bash";
import dart from "highlight.js/lib/languages/dart";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import handlebars from "highlight.js/lib/languages/handlebars";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import nginx from "highlight.js/lib/languages/nginx";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import React, { createElement, Fragment } from "react";
import rehypeHighlight from "rehype-highlight";
import rehypeMathjax from "rehype-mathjax";
import rehypeReact from "rehype-react";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

function toTxt(node: React.ReactNode): string {
  let str = "";
  if (Array.isArray(node)) {
    str += (node as Array<React.ReactNode>).map(toTxt).join("");
  } else if (typeof node == "object" && "props" in (node as any)) {
    str += (node as any)["props"] && toTxt((node as any)["props"].children);
  } else {
    str += node?.toString();
  }
  return str;
}
let processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
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
  .use(rehypeMathjax)
  .use(remarkFrontmatter, ["yaml", "toml"])
  .use(rehypeStringify)
  .use(rehypeReact, {
    createElement,
    Fragment,
    components: {
      a: (
        props: React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLAnchorElement>,
          HTMLAnchorElement
        >
      ) => {
        return (
          <Typography.Link
            {...(props as any)}
            rel="noopener noreferrer"
            target={"_blank"}
          ></Typography.Link>
        );
      },
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
                if (copy(toTxt(children))) {
                  message.success("已复制");
                }
              }}
              className="code-copy"
            />
            {children}
          </code>
        );
      },
    },
  });

// 创建解析方法
export const MarkdownView = ({
  markdown,
  menu,
  doubleClick,
}: {
  markdown: string;
  menu?: MenuProps;
  doubleClick?: React.MouseEventHandler<HTMLDivElement>;
}) => {
  const renderedMarkdown = processor.processSync(markdown).result;
  return (
    <div onDoubleClick={doubleClick}>{renderedMarkdown}</div>
    // <Dropdown menu={menu}  trigger={["contextMenu"]}>

    // </Dropdown>
  );
};

export function isXML(str: string) {
  try {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(str, "text/xml");
    return true;
  } catch (error) {
    return false;
  }
}
