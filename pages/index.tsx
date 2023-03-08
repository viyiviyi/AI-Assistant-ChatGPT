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
  const [config, setConfig] = useState({
    user: "user",
    model: "gpt-3.5-turbo",
  });
  function getMsgColor(index: number): string {
    return index % 2 ? "#2db7f5" : "#f50";
  }
  useEffect(() => {
    const data = new KeyValueData(localStorage);
    setValueDataset(data);
    if (!data.getAutoToken()) router.push("/login");
    setAssistant((v) => {
      v.name = data.getAssistantName();
      v.prefix = data.getAssistantPrefix();
      return v;
    });
  }, []);
  async function onSubmit(isPush: boolean) {
    let messageText = isPush
      ? [
          ...chats.filter((f) => !f.isSkip).map((m) => m.message),
          messageInput,
        ].join("\n")
      : messageInput;
    if (assistant.enable) {
      messageText = assistant.prefix + "\n\n" + messageText;
    }
    setmessageInput("");
    if (!messageText.trim()) return;
    setLoading(true);
    if (isPush) {
      if (messageInput.trim())
        setChats((v) => [
          ...v,
          {
            nickname: "User",
            message: messageInput,
            timestamp: Date.now(),
            isPull: false,
            isSkip: false,
          },
        ]);
    } else {
      const pChats = chats;
      setMessage((v) => [...v, pChats]);
      if (messageInput.trim())
        setChats([
          {
            nickname: "User",
            message: messageInput,
            timestamp: Date.now(),
            isPull: false,
            isSkip: false,
          },
        ]);
      else {
        setChats([]);
      }
    }
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          model: config.model,
          token:valueDataset?.getAutoToken(),
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
          // checked={assistant.enable}
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
        {messages.map((msgs, index) =>
          msgs.map((msg, idx) => {
            msg.tagColor = getMsgColor(index);
            return (
              <ChatMessage
                key={idx}
                msg={msg}
                onDel={(m) => {
                  setMessage((v) => {
                    return v
                      .map((g) => g.filter((f) => f.timestamp !== m.timestamp))
                      .filter((g) => g.length);
                  });
                }}
                onSkip={(m) => {
                  setMessage((v) => {
                    const ls = [...v];
                    let item = Object.assign({}, ls[index][idx]);
                    ls[index][idx] = Object.assign(item, {
                      isSkip: !v[index][idx],
                    });
                    return ls;
                  });
                }}
                rBak={(v) =>
                  setmessageInput((m) => (m ? m + "\n\n" : m) + v.message)
                }
              />
            );
          })
        )}
        {chats.map((msg, idx) => {
          msg.tagColor = getMsgColor(messages.length);
          return (
            <ChatMessage
              key={idx}
              msg={msg}
              onDel={(m) => {
                setChats((v) => {
                  return v.filter((f) => f.timestamp !== m.timestamp);
                });
              }}
              onSkip={(m) => {
                setChats((v) => {
                  const index = v.findIndex((f) => f.timestamp === m.timestamp);
                  if (index !== -1) {
                    v[index] = Object.assign({}, v[index]);
                    v[index].isSkip = !v[index].isSkip;
                  }
                  return [...v];
                });
              }}
              rBak={(v) =>
                setmessageInput((m) => (m ? m + "\n\n" : m) + v.message)
              }
            />
          );
        })}
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
