import Head from "next/head";
import style from "../styles/index.module.css";
import { useEffect, useState } from "react";
import { autoToken } from "@/hooks/authToken";
import React from "react";
import { useRouter } from "next/router";
import { Message } from "@/Models/models";
import { ChatMessage } from "@/components/ChatMessage";
import { SettingOutlined } from "@ant-design/icons";
import { Modal } from "@/components/Modal";
import { AssistantSetting } from "@/components/AssistantSetting";

let models = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-0301",
  "text-davinci-003",
  "text-davinci-002	",
  "text-curie-001",
  "text-babbage-001",
  "text-ada-001",
  "davinci",
  "curie",
  "babbage",
  "ada",
];
export default function Home() {
  const [messageInput, setmessageInput] = useState("");
  const [messages, setMessage] = useState<Message[][]>([]);
  const [chats, setChats] = useState<Message[]>([]);
  const [token, setToken] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settingIsShow, setSettingShow] = useState(false);
  const [assistant, setAssistant] = useState({
    enable: false,
    name: "Bot",
    prefix: "从现在开始，你将扮演我的私人助理Bot，如有必要，你可以在中括号内描述你的内心想法和行为动作。",
  });
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

  async function onSubmit(isPush: boolean) {
    setLoading(true);
    setmessageInput("");
    if (isPush) {
      setChats((v) => [
        ...v,
        {
          nickname: "User",
          message: messageInput,
          timestamp: Date.now(),
          isPull: false,
        },
      ]);
    } else {
      const pChats = chats;
      setMessage((v) => [...v, pChats]);
      setChats([
        {
          nickname: "User",
          message: messageInput,
          timestamp: Date.now(),
          isPull: false,
        },
      ]);
    }
    try {
      let messageText = isPush
        ? [...chats.map(m=>m.message), messageInput].join("\n")
        : messageInput;
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: assistant.enable
            ? assistant.prefix + "\n\n" + messageText
            : messageText,
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
      setChats((v) => [
        ...v,
        {
          nickname: assistant.enable ? assistant.name : "Bot",
          message: data.result,
          timestamp: Date.now(),
          isPull: false,
        },
      ]);
    } catch (error: any) {
      setChats((v) => [
        ...v,
        {
          nickname: "Bot Error",
          message: error.message,
          timestamp: Date.now(),
          isPull: false,
        },
      ]);
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
  }, [chats]);

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
        <span style={{ marginLeft: "10px" }}></span>
        <input
          type="checkbox"
          name="assistant.enable"
          id="assistant.enable"
          style={{ cursor: "pointer" }}
          onChange={(e) => {
            setAssistant((v) => {
              v.enable = !v.enable;
              return v;
            });
          }}
        />
        <label style={{ cursor: "pointer" }} htmlFor="assistant.enable">
          助理模式
        </label>
        <span style={{ marginLeft: "10px" }}></span>
        <SettingOutlined onClick={() => setSettingShow(true)} />
      </div>

      <div className={style.content} id="content">
        {messages.map((msgs) =>
          msgs.map((msg, idx) => (
            <ChatMessage
              key={idx}
              msg={msg}
              rBak={(v) => setmessageInput((m) => m + "\n" + v.message)}
            />
          ))
        )}
        {chats.map((msg, idx) => (
          <ChatMessage
            key={idx}
            msg={msg}
            rBak={(v) => setmessageInput((m) => m + "\n" + v.message)}
          />
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
        <form>
          <textarea
            autoFocus={true}
            className={style.textdeitor}
            name="message"
            placeholder="Enter an message"
            value={messageInput}
            onChange={(e) => setmessageInput(e.target.value)}
            onKeyUp={(e) => e.key === "s" && e.altKey && onSubmit(true)}
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <input
              type="button"
              value={"对话"}
              onClick={() => onSubmit(true)}
              style={{ marginBottom: "5px" }}
            />
            <input
              type="button"
              value={"提交"}
              onClick={() => onSubmit(false)}
            />
          </div>
        </form>
      </main>
      <Modal isShow={settingIsShow}>
        {
          <AssistantSetting
            onOk={(ass) => {
              setAssistant((v) => {
                v.prefix = ass.prefix;
                v.name = ass.name;
                return v;
              });
              setSettingShow(false);
            }}
            onCacle={() => {
              setSettingShow(false);
            }}
          ></AssistantSetting>
        }
      </Modal>
    </div>
  );
}
