import { Chat } from "@/components/Chat/Chat";
import { reloadTopic } from "@/components/Chat/ChatMessage";
import { ChatList } from "@/components/ChatList";
import { BgConfig, BgImageStore } from "@/core/BgImageStore";
import { ChatContext, ChatManagement, noneChat } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { KeyValueData } from "@/core/KeyValueData";
import { initClient } from "@/core/Slack";
import { Topic } from "@/Models/DataBase";
import { Drawer, Layout, theme } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";

const MemoChat = React.memo(Chat);
const MemoChatList = React.memo(ChatList);

export default function Page() {
  const router = useRouter();
  const screenSize = useScreenSize();
  const { id: groupId } = router.query;
  const { token } = theme.useToken();
  const { bgConfig } = useContext(ChatContext);
  const [chatMgt, setChatMgt] = useState<ChatManagement>(noneChat);
  const [listIsShow, setlistIsShow] = useState(false);
  const [bgImg, setBgImg] = useState<BgConfig>(bgConfig);
  const [activityTopic, setActivityTopic] = useState({
    id: "",
    name: "",
    groupId: "",
    createdAt: 0,
  });
  useEffect(() => {
    ChatManagement.load().then(async () => {
      let chats = ChatManagement.getGroups();
      if (chats.length == 0) return;
      let selectChat = chats[0];
      if (groupId)
        selectChat = chats.find((f) => f.group.id == groupId) || selectChat;
      BgImageStore.getInstance()
        .getBgImage()
        .then((res) => {
          setBgImg((v) => {
            v.backgroundImage = `url(${selectChat.group.background || res})`;
            return v;
          });
        });
      if (chatMgt.group.id == groupId) return;
      await ChatManagement.loadTopics(selectChat).then(() => {
        setChatMgt(new ChatManagement(selectChat));
        if (screenSize.width <= 1420) {
          setlistIsShow(false);
        }
      });
      initClient(
        KeyValueData.instance().getSlackUserToken(),
        KeyValueData.instance().getSlackClaudeId(),
        KeyValueData.instance().getSlackProxyUrl()
      );
      let aTopic = selectChat.topics.find(
        (f) => f.id == selectChat.config.activityTopicId
      ) || {
        id: "",
        name: "",
        groupId: "",
        createdAt: 0,
      };
      setActivityTopic(aTopic);
      reloadTopic(aTopic.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return (
    <ChatContext.Provider
      value={{
        chat: chatMgt,
        activityTopic,
        setActivityTopic: (topic: Topic) => {
          setActivityTopic(topic);
          chatMgt.config.activityTopicId = topic.id;
          chatMgt.saveConfig();
        },
        bgConfig: bgImg,
        setBgConfig(image) {
          setBgImg((v) => {
            if (v.backgroundImage == `url(${image})`) return v;
            v.backgroundImage = `url(${image})`;
            return { ...v };
          });
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
        <MemoChat />
        <Drawer
          title="Basic Drawer"
          placement="right"
          closable={false}
          onClose={() => {
            setlistIsShow(false);
          }}
          open={listIsShow}
          getContainer={false}
        >
          <MemoChatList
            onCacle={() => {
              setlistIsShow(false);
            }}
          ></MemoChatList>
        </Drawer>
        {screenSize.width > 1420 && listIsShow ? (
          <MemoChatList
            onCacle={() => {
              setlistIsShow(false);
            }}
          ></MemoChatList>
        ) : (
          <></>
        )}
      </Layout>
    </ChatContext.Provider>
  );
}
