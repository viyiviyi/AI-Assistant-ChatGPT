import { ChatMessage } from "@/components/Chat/ChatMessage";
import { useScreenSize } from "@/core/hooks";
import { Message } from "@/Models/DataBase";
import { Layout, message, theme } from "antd";
import React, { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { InputUtil } from "./InputUtil";
import { MemoNavigation } from "./Navigation";

const { Content, Footer } = Layout;
const MemoChatMessage = React.memo(ChatMessage);

export const MessageContext = React.createContext({
  onlyOne: false,
  closeAll: false,
  cite: {} as Message | undefined,
  setOnlyOne: (b: boolean) => {},
  setCloasAll: (b: boolean) => {},
  setCite: (msg: Message) => {},
});

export const Chat = () => {
  const { token } = theme.useToken();
  const [cite, setCite] = useState<Message>();
  const [_, contextHolder] = message.useMessage();
  const [onlyOne, setOnlyOne] = useState(false);
  const [closeAll, setCloasAll] = useState(false);
  const screenSize = useScreenSize();
  return (
    <MessageContext.Provider
      value={{
        onlyOne,
        setOnlyOne,
        closeAll,
        setCloasAll,
        cite,
        setCite,
      }}
    >
      {contextHolder}
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          height: "100%",
          width: "100%",
          maxHeight: "100%",
          maxWidth: "min(1500px, 100%)",
          margin: "0 auto",
        }}
      >
        <ChatHeader></ChatHeader>
        <Layout
          style={{
            color: token.colorTextBase,
            backgroundColor: "#0000",
          }}
        >
          <Layout.Sider
            hidden={screenSize.width < 1500}
            width={250}
            style={{
              overflow: "auto",
              lineHeight: 1,
              borderRadius: token.borderRadius,
              backgroundColor: token.colorFillContent,
            }}
          >
            <MemoNavigation></MemoNavigation>
          </Layout.Sider>
          <Content
            id="content"
            style={{
              overflow: "auto",
              borderRadius: token.borderRadius,
              backgroundColor: token.colorFillContent,
              width: "100%",
              maxWidth: "100%",
              marginLeft: screenSize.width >= 1500 ? "50px" : 0,
            }}
          >
            <MemoChatMessage />
          </Content>
        </Layout>
        <Footer
          id="footer"
          style={{
            padding: 0,
            backgroundColor: "#0000",
            // position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
          }}
        >
          <InputUtil></InputUtil>
        </Footer>
      </div>
    </MessageContext.Provider>
  );
};
