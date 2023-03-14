import Head from "next/head";
import style from "../styles/index.module.css";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/router";
import { ChatMessage } from "@/components/ChatMessage";
import {
  SettingOutlined,
  UnorderedListOutlined,
  SendOutlined,
  MessageOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { Modal } from "@/components/Modal";
import { KeyValueData } from "@/core/KeyValueData";
import { ChatManagement } from "@/core/ChatManagement";
import { ChatList } from "@/components/ChatList";
import { Message } from "@/Models/DataBase";
import { Layout, theme, Button, Input, Space, Checkbox, Select } from "antd";
import { Setting } from "@/components/Setting";

const { Header, Content, Footer, Sider } = Layout;

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
  const { token } = theme.useToken();
  const router = useRouter();
  const inputRef = React.createRef<HTMLInputElement>();
  const [loading, setLoading] = useState(false);
  const [chatMgt, setChatMgt] = useState<ChatManagement[]>([]);
  const [messageInput, setmessageInput] = useState("");
  const [valueDataset, setValueDataset] = useState<KeyValueData>();
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);

  let init = useCallback(async () => {
    let ls = await ChatManagement.list();
    let chatMgt: ChatManagement;
    if (ls.length == 0) {
      chatMgt = await ChatManagement.provide("", "default");
    } else {
      chatMgt = await ChatManagement.provide(ls.slice(-1)[0].id);
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
    await chatMgt[0]?.pushMessage(messageInput, false);
    setmessageInput("");
    if (!chatMgt[0]?.getAskContext().length) return;
    setLoading(true);
    setChatMgt([...chatMgt]);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMgt[0].getAskContext(),
          model: chatMgt[0].gptConfig.model,
          max_tokens:chatMgt[0].gptConfig.max_tokens,
          top_p :chatMgt[0].gptConfig.top_p,
          temperature:chatMgt[0].gptConfig.temperature,
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
    <Layout
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Head>
        <title>助手 bot</title>
      </Head>
      <Space
        wrap={false}
        style={{
          width: "100%",
          justifyContent: "flex-start",
          display: "flex",
          alignItems: "center",
          marginBottom: "1px",
          padding: "10px 10px 10px",
        }}
      >
        <Select
          style={{ width: "160px" }}
          defaultValue={chatMgt[0]?.gptConfig.model || models[0]}
          options={models.map((v) => ({ value: v, label: v }))}
        />
      </Space>
      <Content id="content" style={{ overflow: "auto" }}>
        <ChatMessage
          chat={chatMgt[0]}
          onDel={(m) => {
            deleteChatMsg(m);
          }}
          rBak={(v) => {
            setmessageInput((m) => (m ? m + "\n\n" : m) + v.text);
            inputRef.current?.focus();
          }}
        />
      </Content>
      <div className={style.loading}>
        {loading ? (
          <div className={style.loading}>
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                style={{ backgroundColor: token.colorPrimary }}
                className={style.loadingBar}
              ></div>
            ))}
          </div>
        ) : (
          <div className={style.loading}></div>
        )}
      </div>
      <div style={{ width: "100%", padding: "0px 10px 25px" }}>
        <Space
          wrap={false}
          style={{
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
            alignItems: "center",
            marginBottom: "2px",
          }}
        >
          <Checkbox
            checked={chatMgt[0]?.config.enableVirtualRole}
            onChange={(e) => {
              chatMgt[0]!.config.enableVirtualRole = e.target.checked;
              setChatMgt([...chatMgt]);
            }}
          >
            {"助理"}
          </Checkbox>
          <SettingOutlined onClick={() => setSettingShow(true)} />
          <UnorderedListOutlined
            onClick={() => {
              setlistIsShow(true);
            }}
            style={{ marginLeft: "10px", marginRight: "10px" }}
          />
          <Button
            shape="circle"
            icon={<CommentOutlined />}
            onClick={() => onSubmit(false)}
          ></Button>
          <Button
            shape="circle"
            icon={<MessageOutlined />}
            onClick={() => onSubmit(true)}
          ></Button>
        </Space>
        <div style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="Alt s 继续  Ctrl Enter新话题"
            autoSize
            allowClear
            ref={inputRef}
            autoFocus={true}
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
          />
        </div>
      </div>
      <Modal
        isShow={settingIsShow}
        onCancel={() => {
          setSettingShow(false);
        }}
      >
        <Setting
          onCancel={() => {
            setSettingShow(false);
          }}
          onSaved={() => {
            setChatMgt([...chatMgt]);
            setSettingShow(false);
          }}
          chatMgt={chatMgt[0]}
        ></Setting>
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
    </Layout>
  );
}
