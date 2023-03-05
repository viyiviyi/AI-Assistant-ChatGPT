import Head from "next/head";
import style from "../styles/index.module.css";
import { FormEvent, FormEventHandler, useEffect, useState } from "react";
import { autoToken } from "@/hooks/authToken";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
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
import React from "react";
import { useRouter } from "next/router";

// 创建解析方法
async function markdownToHtml(markdown: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(remarkGfm)
    .use(rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        span: [
          ...(defaultSchema.attributes?.span || []),
          // 这里配置代码块高亮的关键词:
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
    .process(markdown);
  return result.toString();
}
export default function Home() {
  const [messageInput, setmessageInput] = useState("");
  const [messages, setMessage] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const router = useRouter();
  const [config, setConfig] = useState({
    user: "user",
    model: "gpt-3.5-turbo",
  });
  function pauseContent(msg: string, user: string) {
    return markdownToHtml(
      "*" + new Date().toLocaleString() + "* **" + user + "** \n\n " + msg
    );
  }
  useEffect(() => {
    const tokenVal = autoToken();
    setToken(tokenVal);
    if (!tokenVal) router.push("/login");
  }, []);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    pauseContent(messageInput, config.user || "user").then((html) => {
      setMessage((v) => {
        return [...v, html];
      });
    });
    setmessageInput("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageInput,
          model: config.model,
          token,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }
      pauseContent(data.result, "Bot").then((html) => {
        setMessage((v) => {
          return [...v, html];
        });
      });
    } catch (error: any) {
      console.error(error);
      pauseContent(error.message, "Bot Error").then((html) => {
        setMessage((v) => {
          return [...v, html];
        });
      });
    }
  }

  useEffect(() => {
    setTimeout(() => {
      var div = document.getElementById("content");
      if (div != null) div.scrollTop = div.scrollHeight;
    }, 300);
  }, [messages]);
  let models = [
    "text-davinci-003",
    "code-davinci-002",
    "text-davinci-002	",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-0301",
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Head>
        <title>助手 bot</title>
      </Head>
      <div className={style.header}>
        <select
          style={{ height: "2em" }}
          defaultValue={config.model}
          onChange={(e) => {
            setConfig((f) => Object.assign(f, { model: e.target.value }));
          }}
        >
          {models.map((v, i) => (
            <option value={v} key={i}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className={style.content} id="content">
        {messages.map((msg, idx) => (
          <div key={idx} dangerouslySetInnerHTML={{ __html: msg }}></div>
        ))}
      </div>
      <main className={style.main}>
        <form onSubmit={onSubmit}>
          <textarea
            autoFocus={true}
            name="message"
            placeholder="Enter an message"
            value={messageInput}
            onChange={(e) => setmessageInput(e.target.value)}
          ></textarea>
          <input type="submit" />
        </form>
      </main>
    </div>
  );
}
