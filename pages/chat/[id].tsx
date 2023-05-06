import { Chat } from "@/components/Chat";
import { ChatList } from "@/components/ChatList";
import { Modal } from "@/components/Modal";
import { Setting } from "@/components/Setting";
import { VirtualRoleConfig } from "@/components/VirtualRoleConfig";
import { BgConfig, BgImage } from "@/core/BgImage";
import {
  ChatContext,
  ChatManagement,
  defaultChat
} from "@/core/ChatManagement";
import { Layout, theme } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const { id: groupId } = router.query;

  const { token } = theme.useToken();

  const { bgConfig, setBgConfig } = useContext(ChatContext);
  const [chatMgt, setChatMgt] = useState<ChatManagement>(
    new ChatManagement(defaultChat)
  );
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);
  const [roleConfigShow, setRoleConfigShow] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [bgImg, setBgImg] = useState<BgConfig>(bgConfig);
  const [activityTopic, setActivityTopic] = useState(
    chatMgt.topics.find((f) => f.id == chatMgt.config.activityTopicId) || {
      id: "",
      name: "",
      groupId: "",
      createdAt: 0,
    }
  );

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    setWindowWidth(window.innerWidth || 0);
    window.addEventListener("resize", handleResize);
    ChatManagement.load().then(async () => {
      let chats = ChatManagement.getGroups();
      if (chats.length == 0) return;
      let defaultChat = chats[0];
      if (groupId)
        defaultChat = chats.find((f) => f.group.id == groupId) || defaultChat;
      ChatManagement.loadTopics(defaultChat).then(() => {
        setChatMgt(new ChatManagement(defaultChat));
      });
      BgImage.getInstance()
        .getBgImage()
        .then((res) => {
          setBgConfig(res || defaultChat.group.background);
        });
      setActivityTopic(
        defaultChat.topics.find(
          (f) => f.id == chats[0].config.activityTopicId
        ) || {
          id: "",
          name: "",
          groupId: "",
          createdAt: 0,
        }
      );
    });
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [groupId, setBgConfig]);

  return (
    <ChatContext.Provider
      value={{
        chat: chatMgt,
        activityTopic,
        setActivityTopic,
        bgConfig: bgImg,
        setBgConfig(image) {
          if (image) {
            setBgImg((v) => {
              v.backgroundImage = `url(${image})`;
              return v;
            });
          }
        },
      }}
    >
      <Layout
        style={{
          display: "flex",
          height: "100%",
          flexDirection: "row",
          maxHeight: "100%",
          flexWrap: "nowrap",
          position: "relative",
          color: token.colorTextBase,
          backgroundColor: token.colorBgContainer,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            ...bgImg,
          }}
        ></div>
        <Head>
          <title>ChatGPT聊天工具</title>
        </Head>
        {chatMgt ? (
          <Chat
            toggleSettingShow={() => {
              setSettingShow((v) => !v);
            }}
            toggleRoleConfig={() => {
              setRoleConfigShow((v) => !v);
            }}
            togglelistIsShow={() => {
              setlistIsShow((v) => !v);
            }}
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

        {windowWidth > 1420 && listIsShow ? (
          <ChatList
            onCacle={() => {
              setlistIsShow(false);
            }}
          ></ChatList>
        ) : (
          <></>
        )}
        <Modal
          isShow={roleConfigShow}
          maxHight={"calc(70vh + 84px)"}
          onCancel={() => {
            setRoleConfigShow(false);
          }}
        >
          <VirtualRoleConfig
            onCancel={() => {
              setRoleConfigShow(false);
            }}
            onSaved={() => {
              // setChatMgt(new ChatManagement(chatMgt!));
              setRoleConfigShow(false);
            }}
            chatMgt={chatMgt}
          ></VirtualRoleConfig>
        </Modal>
        <Modal
          isShow={settingIsShow}
          maxHight={"calc(70vh + 84px)"}
          onCancel={() => {
            setSettingShow(false);
          }}
        >
          <Setting
            onCancel={() => {
              setSettingShow(false);
            }}
            onSaved={() => {
              // setChatMgt(new ChatManagement(chatMgt!));
              setSettingShow(false);
            }}
            chatMgt={chatMgt}
          ></Setting>
        </Modal>
        <Modal
          isShow={listIsShow && windowWidth <= 1420}
          maxHight={"calc(70vh + 84px)"}
          onCancel={() => {
            setlistIsShow(false);
          }}
        >
          <ChatList
            onCacle={() => {
              setlistIsShow(false);
            }}
          ></ChatList>
        </Modal>
      </Layout>
    </ChatContext.Provider>
  );
}
