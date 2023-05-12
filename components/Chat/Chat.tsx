import { ChatMessage } from "@/components/Chat/ChatMessage";
import { Message } from "@/Models/DataBase";
import { Layout, message, theme } from "antd";
import React, { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { InputUtil } from "./InputUtil";

const { Content, Footer } = Layout;

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
          maxWidth: "min(1200px, 100%)",
          margin: "0 auto",
        }}
      >
        <ChatHeader></ChatHeader>
        <Content
          id="content"
          style={{
            overflow: "auto",
            borderRadius: token.borderRadius,
            backgroundColor: token.colorFillContent,
            width: "100%",
            maxWidth: "100%",
            // marginBottom: "47px",
          }}
        >
          <ChatMessage />
        </Content>
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
