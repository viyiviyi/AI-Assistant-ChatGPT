import Head from "next/head";
import style from "../styles/index.module.css";
import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/router";
import { Message } from "@/Models/models";
import { ChatMessage } from "@/components/ChatMessage";
import { SettingOutlined } from "@ant-design/icons";
import { Modal } from "@/components/Modal";
import { AssistantSetting } from "@/components/AssistantSetting";
import { KeyValueData } from "@/hooks/KeyValueData";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settingIsShow, setSettingShow] = useState(false);
  const [valueDataset, setValueDataset] = useState<KeyValueData>();
  const [assistant, setAssistant] = useState({
    enable: false,
    name: "",
    prefix: "",
  });
  const [config, setConfig] = useState<{
    role: "assistant" | "user" | "system";
    model: string;
  }>({
    role: "assistant",
    model: "gpt-3.5-turbo",
  });
  useEffect(() => {
    const data = new KeyValueData(localStorage);
    setValueDataset(data);
    if (!data.getAutoToken()) router.push("/login");
    setAssistant((v) => {
      v.name = data.getAssistantName();
      v.prefix = data.getAssistantPrefix();
      return v;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => {
      var div = document.getElementById("content");
      if (div != null) div.scrollTop = div.scrollHeight;
    }, 300);
  }, [chats]);

  function getMsgColor(index: number): string {
    return index % 2 ? "#2db7f5" : "#f50";
  }
  function deleteChatMsg(msg: Message, isChats?: boolean): void {
    let pMessages = messages;
    let pChats = chats;
    if (!isChats || isChats === undefined) {
      pMessages = pMessages
        .map((g) => g.filter((f) => f.timestamp !== msg.timestamp))
        .filter((g) => g.length);
    }
    if (isChats || isChats === undefined) {
      pChats = pChats.filter((f) => f.timestamp !== msg.timestamp);
      if (pChats.length == 0 && pMessages.length > 0) {
        pChats = pMessages.splice(pMessages.length - 1, 1)[0];
      }
    }
    setMessage(pMessages);
    setChats(pChats);
  }
  /**
   * 提交内容
   * @param isPush 是否对话模式
   * @returns
   */
  async function onSubmit(isPush: boolean) {
    let contexts: Array<{
      role: "assistant" | "user" | "system";
      content: string;
      name: string;
    }> = [];
    if (messageInput.trim())
      contexts = [
        {
          role: config.role,
          content: messageInput,
          name: "user",
        },
      ];
    if (isPush) {
      contexts = [
        ...chats
          .filter((f) => !f.isSkip && f.message)
          .map((v) => ({
            role: config.role,
            content: v.message,
            name: v.nickname === assistant.name ? "assistant" : "user",
          })),
        ...contexts,
      ];
    }
    if (assistant.enable) {
      contexts = [
        {
          role: config.role,
          content: assistant.prefix,
          name: "user",
        },
        ...contexts,
      ];
    }
    setmessageInput("");
    if (!contexts.length) return;
    setLoading(true);
    let pChats = [...chats];
    if (!isPush) {
      const _pChats = pChats;
      setMessage((v) => [...v, _pChats]);
      pChats = [];
    }
    if (messageInput.trim())
      pChats.push({
        nickname: "",
        message: messageInput.trim(),
        timestamp: Date.now(),
        isPull: false,
        isSkip: false,
      });
    setChats(pChats);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contexts,
          model: config.model,
          user: 'user',
          token: valueDataset?.getAutoToken(),
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
          isPull: true,
          isSkip: false,
        },
      ]);
    } catch (error: any) {
      setChats((v) => [
        ...v,
        {
          nickname: "Bot Error",
          message: error.message,
          timestamp: Date.now(),
          isPull: true,
          isSkip: false,
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
              v.enable = e.target.checked;
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
        {messages.map((msgs, index) => (
          <ChatMessage
            key={index}
            msgs={msgs}
            tagColor={getMsgColor(index)}
            onDel={(m) => {
              deleteChatMsg(m, false);
            }}
            onSkip={(m) => {}}
            rBak={(v) =>
              setmessageInput((m) => (m ? m + "\n\n" : m) + v.message)
            }
          />
        ))}
        <ChatMessage
          msgs={chats}
          tagColor={getMsgColor(messages.length)}
          onDel={(m) => {
            deleteChatMsg(m, true);
          }}
          onSkip={(m) => {}}
          rBak={(v) => setmessageInput((m) => (m ? m + "\n\n" : m) + v.message)}
        />
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
            onKeyUp={(e) =>
              (e.key === "s" && e.altKey && onSubmit(true)) ||
              (e.key === "Enter" && e.ctrlKey && onSubmit(false))
            }
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
            <button
              type="button"
              onClick={() => onSubmit(true)}
              style={{ marginBottom: "5px" }}
            >
              对话
              <br />
              <span style={{ fontSize: "12px" }}>Alt S</span>
            </button>
            <button
              type="button"
              value={"提交\nCtrl Enter"}
              onClick={() => onSubmit(false)}
            >
              提交
              <br />
              <span style={{ fontSize: "12px" }}>Ctrl Enter</span>
            </button>
          </div>
        </form>
      </main>
      <Modal isShow={settingIsShow}>
        {
          <AssistantSetting
            name={assistant.name}
            propPrefix={assistant.prefix}
            onOk={(ass) => {
              setAssistant((v) => {
                v.prefix = ass.prefix;
                v.name = ass.name;
                return v;
              });
              const data = new KeyValueData(localStorage);
              data.setAssistantName(assistant.name);
              data.setAssistantPrefix(assistant.prefix);
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
