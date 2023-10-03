import { Chat } from "@/components/Chat/Chat";
import { MemoBackgroundImage } from "@/components/common/BackgroundImage";
import { SkipExport } from "@/components/common/SkipExport";
import { useService } from "@/core/AiService/ServiceProvider";
import { BgConfig, BgImageStore } from "@/core/BgImageStore";
import {
  ChatContext,
  ChatManagement,
  IChat,
  noneChat
} from "@/core/ChatManagement";
import { KeyValueData } from "@/core/db/KeyValueData";
import { initTokenStore } from "@/core/tokens";
import { scrollToBotton } from "@/core/utils";
import { TopicMessage } from "@/Models/Topic";
import { Layout, Spin, theme } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import appManifest from "../../public/manifest.json";

const MemoChat = React.memo(Chat);

export default function Page() {
  const router = useRouter();
  const { id: groupId } = router.query;
  const { token } = theme.useToken();
  const { bgConfig, loadingMsgs } = useContext(ChatContext);
  const [loading, setLoading] = useState(false);
  const [navList, setNavList] = useState([]);
  const [chatMgt, setChatMgt] = useState<ChatManagement>(noneChat);
  const [bgImg, setBgImg] = useState<BgConfig>(bgConfig);
  const [activityTopic, setActivityTopic] = useState<TopicMessage | undefined>(
    chatMgt.getActivityTopic()
  );
  const { reloadService } = useService();

  useEffect(() => {
    if (typeof window == "undefined") return;
    setLoading(true);
    ChatManagement.load().then(async () => {
      let chats = ChatManagement.getGroups();
      if (chats.length == 0) return setLoading(false);
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
      initTokenStore().then(() => {
        reloadService(selectChat, KeyValueData.instance());
      });
      if (chatMgt.group.id == groupId) return setLoading(false);
      if (!selectChat.topics.length)
        await ChatManagement.loadTopics(selectChat);
      const newChatMgt = new ChatManagement(selectChat);
      setChatMgt(newChatMgt);

      const activityTopic = newChatMgt.getActivityTopic();
      setActivityTopic(activityTopic);

      newChatMgt.loadMessages().then(() => {
        setNavList([]);
      });

      setTimeout(() => {
        // 有可能滚动无效，但是去获取渲染完成的事件更麻烦
        scrollToBotton(activityTopic?.messages.slice(-1)[0]?.id || "");
        setLoading(false);
      }, 500);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return (
    <ChatContext.Provider
      value={{
        chatMgt: chatMgt,
        setChat: (chat: IChat) => {
          setChatMgt(new ChatManagement(chat));
        },
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
        forceRender: false,
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
        <SkipExport>
          <MemoBackgroundImage />
        </SkipExport>
        <SkipExport>
          <MemoBackgroundImage
            src="url(images/mask.jpg)"
            style={{
              opacity: 0.1,
            }}
          />
        </SkipExport>
        <Head>
          <title>
            {appManifest.name} {chatMgt.group.name}
          </title>
        </Head>
        <Spin
          style={{
            margin: "50% auto",
            zIndex: 99,
            position: "absolute",
            width: "100%",
          }}
          spinning={loading}
        ></Spin>
        <MemoChat />
      </Layout>
    </ChatContext.Provider>
  );
}
