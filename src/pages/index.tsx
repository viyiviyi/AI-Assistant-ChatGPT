import { MemoBackgroundImage } from "@/components/BackgroundImage";
import { Chat } from "@/components/Chat/Chat";
import { ChatList } from "@/components/ChatList";
import { useService } from "@/core/AiService/ServiceProvider";
import { BgConfig } from "@/core/BgImageStore";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { KeyValueData } from "@/core/KeyValueData";
import { initTokenStore } from "@/core/tokens";
import { TopicMessage } from "@/Models/Topic";
import { Layout, theme } from "antd";
import Head from "next/head";
import React, { useContext, useEffect, useState } from "react";
import chatConfig from "../../public/使用示例.json";

const MemoChat = React.memo(Chat);
const MemoChatList = React.memo(ChatList);

export default function Page() {
  const screenSize = useScreenSize();
  const { token } = theme.useToken();
  const { bgConfig, loadingMsgs } = useContext(ChatContext);
  const [navList, setNavList] = useState([]);
  const [chatMgt, setChatMgt] = useState<ChatManagement>(
    new ChatManagement(chatConfig as any)
  );
  const [listIsShow, setlistIsShow] = useState(false);
  const [bgImg, setBgImg] = useState<BgConfig>(bgConfig);
  const [activityTopic, setActivityTopic] = useState<TopicMessage | undefined>(
    chatMgt.getActivityTopic()
  );
  chatMgt.virtualRole.avatar = "/logo.png";
  chatMgt.user.avatar = "/logo.png";
  const { reloadService } = useService();

  useEffect(() => {
    ChatManagement.load().then(async () => {
      initTokenStore().then(() => {
        reloadService(chatMgt, KeyValueData.instance());
      });
      let chats = ChatManagement.getGroups();
      // 如果不在本地保存一份，编辑是会出错的
      chatMgt.group.id = "1f8c8194-2392-400e-9ab1-5a91dc1f08fd";
      let idx = chats.findIndex((f) => f.group.id == chatMgt.group.id);
      chatMgt.group.index = chats.length;
      if (idx == -1) {
        await ChatManagement.createGroup(chatMgt.group);
      }
      await chatMgt.fromJson(chatMgt, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadService]);

  return (
    <ChatContext.Provider
      value={{
        chat: chatMgt,
        setChat: setChatMgt,
        activityTopic,
        loadingMsgs,
        setActivityTopic: (topic?: TopicMessage) => {
          if (topic) {
            setActivityTopic(topic);
            chatMgt.config.activityTopicId = topic.id;
            chatMgt.saveConfig();
          } else {
            setActivityTopic(undefined);
            chatMgt.config.activityTopicId = "";
          }
        },
        bgConfig: bgImg,
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
        forceRender: true,
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
          <title>Chat助理 灵活简洁美观的ChatGPT客户端</title>
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
