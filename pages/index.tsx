import Head from "next/head";
import style from "../styles/index.module.css";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/router";
import { ChatMessage } from "@/components/ChatMessage";
import { SettingOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Modal } from "@/components/Modal";
import { AssistantSetting } from "@/components/AssistantSetting";
import { KeyValueData } from "@/core/KeyValueData";
import { CahtManagement } from "@/core/ChatManagement";
import { ChatList } from "@/components/ChatList";
import { Message } from "@/Models/DataBase";

function scrollToBotton() {
  setTimeout(() => {
    var div = document.getElementById("content");
    if (div != null) div.scrollTop = div.scrollHeight;
  }, 300);
}

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [chatMgt, setChatMgt] = useState<CahtManagement[]>([]);
  const [messageInput, setmessageInput] = useState("");
  const [valueDataset, setValueDataset] = useState<KeyValueData>();
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);
  let init = useCallback(async () => {
    let ls = await CahtManagement.list();
    let chatMgt: CahtManagement;
    if (ls.length == 0) {
      chatMgt = await CahtManagement.provide("", "default");
    } else {
      chatMgt = await CahtManagement.provide(ls.slice(-1)[0].id);
    }
    const data = new KeyValueData(localStorage);
    if (!data.getAutoToken()) router.push("/login");
    setChatMgt([chatMgt]);
    setValueDataset(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  function deleteChatMsg(msg: Message): void {
    chatMgt[0]?.removeMessage(msg).then(() => {
      setChatMgt([...chatMgt]);
    });
  }

  /**
   * 提交内容
   * @param isPush 是否对话模式
   * @returns
   */
  async function onSubmit(isPush: boolean) {
    if (!isPush) chatMgt[0]!.newTopic(messageInput);
    await chatMgt[0]?.pushMessage(messageInput, isPush);
    setmessageInput("");
    if (!chatMgt[0]?.getAskContext().length) return;
    setLoading(true);
    setChatMgt([...chatMgt]);
    scrollToBotton();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMgt[0].getAskContext(),
          model: chatMgt[0].gptConfig.model,
          user: "user",
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
      chatMgt[0].pushMessage(data.result, true);
    } catch (error: any) {
      chatMgt[0].pushMessage(error.message, true);
    }
    setChatMgt([...chatMgt]);
    scrollToBotton();
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        maxHeight: "100%",
      }}
    >
      <Head>
        <title>助手 bot</title>
      </Head>
      <div className={style.header}>
        <select
          style={{ height: "2em" }}
          defaultValue={chatMgt[0]?.gptConfig.model}
          onChange={(e) => {
            chatMgt[0]!.gptConfig.model = e.target.value
            setChatMgt([...chatMgt]);
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
          defaultChecked={chatMgt[0]?.config.enableVirtualRole}
          onChange={(e) => {
            chatMgt[0]!.config.enableVirtualRole = e.target.checked;
            setChatMgt([...chatMgt]);
          }}
        />
        <label style={{ cursor: "pointer" }} htmlFor="assistant.enable">
          助理模式
        </label>
        <span style={{ marginLeft: "10px" }}></span>
        <SettingOutlined onClick={() => setSettingShow(true)} />
        <span style={{ flex: 1 }}></span>
        <UnorderedListOutlined
          onClick={() => {
            setlistIsShow(true);
          }}
          style={{ marginLeft: "10px" }}
        />
      </div>
      <div className={style.content} id="content">
        <ChatMessage
          chat={chatMgt[0]}
          onDel={(m) => {
            deleteChatMsg(m);
          }}
          onSkip={(m) => {}}
          rBak={(v) => setmessageInput((m) => (m ? m + "\n\n" : m) + v.text)}
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
      <Modal
        isShow={settingIsShow}
        onCancel={() => {
          setSettingShow(false);
        }}
      >
        {
          <AssistantSetting
            name={chatMgt[0]?.virtualRole.name || ""}
            propPrefix={chatMgt[0]?.virtualRole.bio || ""}
            onOk={(ass) => {
              chatMgt[0]?.setVirtualRoleBio(ass.name, ass.prefix);
              setChatMgt([...chatMgt]);
              setSettingShow(false);
            }}
            onCacle={() => {
              setSettingShow(false);
            }}
          ></AssistantSetting>
        }
      </Modal>
      <Modal
        isShow={listIsShow}
        onCancel={() => {
          setlistIsShow(false);
        }}
      >
        <ChatList
          onCacle={() => {
            setlistIsShow(false);
          }}
          onSelected={(mgt) => {
            setChatMgt([mgt]);
            setlistIsShow(false);
          }}
        ></ChatList>
      </Modal>
    </div>
  );
}
