import Head from "next/head";
import style from "../styles/index.module.css";
import { FormEvent, useEffect, useState } from "react";
import { autoToken } from "@/hooks/authToken";
import React from "react";
import { useRouter } from "next/router";
import { MarkdownView } from "@/components/MarkdownView";

let models = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0301",
  "text-davinci-003",
  "text-davinci-002	",
  "text-curie-001",
  "text-babbage-001",
  "text-ada-001",
];
export default function Home() {
  const [messageInput, setmessageInput] = useState("");
  const [messages, setMessage] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    user: "user",
    model: "gpt-3.5-turbo",
  });
  async function pauseContent(msg: string, user: string) {
    return "*" + new Date().toLocaleString() + "* **" + user + "** \n\n " + msg;
  }
  useEffect(() => {
    const tokenVal = autoToken();
    setToken(tokenVal);
    if (!tokenVal) router.push("/login");
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setmessageInput("");
    pauseContent(messageInput, config.user || "user").then((html) => {
      setMessage((v) => {
        return [...v, html];
      });
    });
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
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }
  const onTextareaTab = (
    start: number,
    end: number,
    textarea: EventTarget & HTMLTextAreaElement
  ) => {
    setmessageInput((v) => v.substring(0, start) + "    " + v.substring(start));
    setTimeout(() => {
      textarea.selectionStart = start + 4;
      textarea.selectionEnd = end + 4;
    }, 0);
  };
  useEffect(() => {
    setTimeout(() => {
      var div = document.getElementById("content");
      if (div != null) div.scrollTop = div.scrollHeight;
    }, 300);
  }, [messages]);

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
          <MarkdownView key={idx} markdown={msg} />
        ))}
      </div>
      <div className={style.loading}>
        {loading ? (
          <div className={style.loading}>
            <div className={style.loadingBar}></div>
            <div className={style.loadingBar}></div>
            <div className={style.loadingBar}></div>
            <div className={style.loadingBar}></div>
            <div className={style.loadingBar}></div>
          </div>
        ) : (
          <div className={style.loading}></div>
        )}
      </div>
      <main className={style.main}>
        <form onSubmit={onSubmit}>
          <textarea
            autoFocus={true}
            className={style.textdeitor}
            name="message"
            placeholder="Enter an message"
            value={messageInput}
            onChange={(e) => setmessageInput(e.target.value)}
            onKeyUp={(e) => e.key === "s" && e.altKey && onSubmit(e)}
            onKeyDown={(e) =>
              e.key === "Tab" &&
              (e.preventDefault(),
              onTextareaTab(
                e.currentTarget?.selectionStart,
                e.currentTarget?.selectionEnd,
                e.currentTarget
              ))
            }
          ></textarea>
          <input type="submit" />
        </form>
      </main>
    </div>
  );
}
