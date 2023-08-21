import { ChatMessage } from "@/components/Chat/ChatMessage";
import { ChatContext } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { activityScroll } from "@/core/utils";
import { Message } from "@/Models/DataBase";
import { Layout, message, Modal, theme } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { SkipExport } from "../SkipExport";
import { MemoChatHeader } from "./ChatHeader";
import { MemoInputUtil } from "./InputUtil";
import { MarkdownView } from "./MarkdownView";
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
  const { chatMgt: chat } = useContext(ChatContext);
  const [showNotice, setShowNotice] = useState(false);
  useEffect(() => {
    if (!window) return;
    if (location.origin.includes("22733.site")) {
      setShowNotice(true);
    }
  }, []);
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
        <SkipExport>
          <MemoChatHeader></MemoChatHeader>
        </SkipExport>
        <Layout
          style={{
            color: token.colorTextBase,
            backgroundColor: "#0000",
          }}
        >
          <Layout.Sider
            hidden={screenSize.width < 1200}
            width={250}
            style={{
              overflow: "auto",
              lineHeight: 1,
              borderRadius: token.borderRadius,
              backgroundColor:token.colorFillContent,
            }}
          >
            <MemoNavigation></MemoNavigation>
          </Layout.Sider>
          <Content
            id="content"
            style={{
              overflow: "auto",
              borderRadius: token.borderRadius,
              backgroundColor:token.colorFillContent,
              width: "100%",
              maxWidth: "100%",
              marginLeft:
                screenSize.width >= 1200 ? "clamp(5px,100vw - 1200px,50px)" : 0,
            }}
            onTouchMove={() => {
              activityScroll({});
            }}
            onWheel={() => {
              activityScroll({});
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
            bottom: 0,
            left: 0,
            width: "100%",
          }}
        >
          <SkipExport>
            <MemoInputUtil></MemoInputUtil>
          </SkipExport>
        </Footer>
      </div>
      <SkipExport>
        <Modal
          title={"重要通知"}
          open={showNotice}
          centered
          onCancel={() => setShowNotice(false)}
          onOk={() => setShowNotice(false)}
        >
          <MarkdownView
            markdown={`
### 此站点已经转移到新域名，将在不久后停止访问，请尽快导出会话并导入到新域名。

---

#### 新域名：[https://eaias.com/](https://eaias.com/)
`}
          ></MarkdownView>
        </Modal>
      </SkipExport>
    </MessageContext.Provider>
  );
};
