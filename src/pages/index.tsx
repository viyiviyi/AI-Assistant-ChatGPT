import { MemoBackgroundImage } from "@/components/BackgroundImage";
import { Chat } from "@/components/Chat/Chat";
import { SkipExport } from "@/components/SkipExport";
import { useService } from "@/core/AiService/ServiceProvider";
import { BgConfig } from "@/core/BgImageStore";
import { ChatContext, ChatManagement, IChat } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { initTokenStore } from "@/core/tokens";
import { TopicMessage } from "@/Models/Topic";
import { Layout, theme } from "antd";
import Head from "next/head";
import React, { useContext, useEffect, useState } from "react";
import chatConfig from "../../public/使用示例.json";

const MemoChat = React.memo(Chat);

export default function Page() {
  const { token } = theme.useToken();
  const { bgConfig, loadingMsgs } = useContext(ChatContext);
  const [navList, setNavList] = useState([]);
  const [chatMgt, setChatMgt] = useState<ChatManagement>(
    new ChatManagement(chatConfig as any)
  );
  const [bgImg, setBgImg] = useState<BgConfig>(bgConfig);
  const [activityTopic, setActivityTopic] = useState<TopicMessage | undefined>(
    chatMgt.getActivityTopic()
  );

  chatMgt.virtualRole.avatar = "";
  chatMgt.user.avatar = "";
  const { reloadService } = useService();

  useEffect(() => {
    ChatManagement.load().then(async () => {
      initTokenStore().then(() => {
        reloadService(chatMgt.toJson(), KeyValueData.instance());
      });
      let chats = ChatManagement.getGroups();
      // 如果不在本地保存一份，编辑是会出错的
      chatMgt.group.id = "1f8c8194-2392-400e-9ab1-5a91dc1f08fd";
      let idx = chats.findIndex((f) => f.group.id == chatMgt.group.id);
      chatMgt.group.index = chats.length;
      if (idx == -1) {
        await ChatManagement.createGroup(chatMgt.group);
      }
      await chatMgt.fromJson(chatMgt.toJson(), false);
    });
  }, [reloadService, chatMgt]);

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
          <title>Chat助理 灵活简洁美观的ChatGPT客户端</title>
        </Head>
        <MemoChat />
      </Layout>
    </ChatContext.Provider>
  );
}
