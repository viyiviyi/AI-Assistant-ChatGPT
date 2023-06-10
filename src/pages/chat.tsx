import { MemoBackgroundImage } from "@/components/BackgroundImage";
import { Chat } from "@/components/Chat/Chat";
import { ChatList } from "@/components/ChatList";
import { useService } from "@/core/AiService/ServiceProvider";
import { BgConfig, BgImageStore } from "@/core/BgImageStore";
import { ChatContext, ChatManagement, noneChat } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { KeyValueData } from "@/core/KeyValueData";
import { scrollToBotton } from "@/core/utils";
import { TopicMessage } from "@/Models/Topic";
import { Layout, theme } from "antd";
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
  const { bgConfig, loadingMsgs } = useContext(ChatContext);
  const [navList, setNavList] = useState([]);
  const [chatMgt, setChatMgt] = useState<ChatManagement>(noneChat);
  const [listIsShow, setlistIsShow] = useState(false);
  const [bgImg, setBgImg] = useState<BgConfig>(bgConfig);
  const [activityTopic, setActivityTopic] = useState<TopicMessage | undefined>(
    chatMgt.getActivityTopic()
  );
  const { reloadService } = useService();
  useEffect(() => {
    if(typeof window == 'undefined') return
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
            return { ...v };
          });
        });
      reloadService(selectChat, KeyValueData.instance());
      if (chatMgt.group.id == groupId) return;
      if (!selectChat.topics.length)
        await ChatManagement.loadTopics(selectChat);
      const newChatMgt = new ChatManagement(selectChat);
      setChatMgt(newChatMgt);
      if (screenSize.width <= 1420) {
        setlistIsShow(false);
      }

      const activityTopic = newChatMgt.getActivityTopic();
      setActivityTopic(activityTopic);
      setTimeout(() => {
        // 有可能滚动无效，但是去获取渲染完成的事件更麻烦
        scrollToBotton(activityTopic?.messages.slice(-1)[0]?.id || "", true);
      }, 500);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return (
    <ChatContext.Provider
      value={{
        chat: chatMgt,
        setChat: setChatMgt,
        activityTopic,
        loadingMsgs,
        setActivityTopic: (topic: TopicMessage) => {
          setActivityTopic(topic);
          chatMgt.config.activityTopicId = topic.id;
          chatMgt.saveConfig();
        },
        bgConfig: bgImg,
        // aiService,
        // resetService,
        setBgConfig(image) {
          setBgImg((v) => {
            if (v.backgroundImage == `url(${image})`) return v;
            v.backgroundImage = `url(${image})`;
            return { ...v };
          });
        },
        navList,
        reloadNav: (topic: TopicMessage) => {
          ChatManagement.loadTitleTree(topic).then(() => setNavList([]));
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
        <MemoBackgroundImage />
        <Head>
          <title>Chat助理</title>
        </Head>
        <MemoChat />
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
