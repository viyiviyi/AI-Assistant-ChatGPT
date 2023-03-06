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
import remarkParse from "remark-parse";
import { useEffect, useState } from "react";

// 创建解析方法
export function MarkdownView({ markdown }: { markdown: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(remarkGfm)
      .use(remarkMath)
      .use(rehypeKatex)
      .use(rehypeHighlight, {
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
        },
      })
      .use(rehypeStringify)
      .process(markdown)
      .then((vfile) => String(vfile))
      .then(setHtml);
  }, [markdown]);
  return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
}
