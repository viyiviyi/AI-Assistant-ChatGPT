import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { Modal } from "@/components/Modal";
import { KeyValueData } from "@/core/KeyValueData";
import { ChatManagement } from "@/core/ChatManagement";
import { ChatList } from "@/components/ChatList";
import { Layout, theme } from "antd";
import { Setting } from "@/components/Setting";
import { Chat } from "@/components/Chat";

export default function Home() {
  const { token } = theme.useToken();
  const [chatMgt, setChatMgt] = useState<ChatManagement[]>([]);
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  let init = useCallback(async () => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    setWindowWidth(window.innerWidth || 0);
    window.addEventListener("resize", handleResize);
    new KeyValueData(localStorage);
    ChatManagement.load();
    let ls = await ChatManagement.list();
    let chatMgt: ChatManagement;
    if (ls.length == 0) {
      chatMgt = await ChatManagement.provide("", "default");
    } else {
      chatMgt = await ChatManagement.provide(ls.slice(-1)[0].id);
    }
    setChatMgt([chatMgt]);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  return (
    <Layout
      style={{
        display: "flex",
        height: "100%",
        flexDirection: "row",
        maxHeight: "100%",
        flexWrap: "nowrap",
        color: token.colorTextBase,
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Head>
        <title>助手 bot</title>
      </Head>
      {chatMgt[0] ? (
        <Chat
          chat={chatMgt[0]}
          setSettingShow={setSettingShow}
          setlistIsShow={setlistIsShow}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            height: "100%",
            maxHeight: "100%",
          }}
        ></div>
      )}

      {windowWidth > 1420 ? (
        <ChatList
          onCacle={() => {
            setlistIsShow(false);
          }}
          onSelected={(mgt) => {
            setChatMgt([mgt]);
            setlistIsShow(false);
          }}
        ></ChatList>
      ) : (
        <></>
      )}

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
