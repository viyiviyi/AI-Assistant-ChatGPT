import { ChatMessage } from "@/components/Chat/Message/ChatMessage";
import { ChatContext } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/db/KeyValueData";
import { useScreenSize } from "@/core/hooks/hooks";
import { activityScroll } from "@/core/utils/utils";
import { Message } from "@/Models/DataBase";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, message, Modal, theme } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { MemoChatHeader } from "../ChatHeader";
import { Hidden } from "../common/Hidden";
import { MarkdownView } from "../common/MarkdownView";
import { SkipExport } from "../common/SkipExport";
import { MemoNavigation } from "../Nav/Navigation";
import { QuickEditConfig } from "../VirtualRoleConfig/QuickEditConfig";
import { MemoInputUtil } from "./InputUtil";

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
  const { chatMgt: chat, forceRender } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [cite, setCite] = useState<Message>();
  const [_, contextHolder] = message.useMessage();
  const [onlyOne, setOnlyOne] = useState(forceRender ? false : true);
  const [closeAll, setCloasAll] = useState(false);
  const screenSize = useScreenSize();
  const [showConfigs, setShowConfigs] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  useEffect(() => {
    if (!window) return;
    if (location.origin.includes("22733.site")) {
      setShowNotice(true);
    }
    const uiConfig = KeyValueData.instance().getUIConfig();
    setShowNav(uiConfig.showNav === undefined ? true : uiConfig.showNav);
    setShowConfigs(
      uiConfig.showConfigPanl === undefined ? false : uiConfig.showConfigPanl
    );
  }, []);
  useEffect(() => {
    KeyValueData.instance().setUIConfig({
      showNav,
      showConfigPanl: showConfigs,
    });
  }, [showNav, showConfigs]);
  useEffect(() => {
    setShowConfigs((v) => {
      if (showNav && v && screenSize.width < 1300) {
        return false;
      }
      return v;
    });
  }, [showNav, screenSize]);
  useEffect(() => {
    setShowNav((v) => {
      if (showConfigs && v && screenSize.width < 1300) {
        return false;
      }
      return v;
    });
  }, [showConfigs, screenSize]);
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
          <div
            style={{
              display: "inline-flex",
              margin: "0 auto",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                height: 0,
                flex: 1,
              }}
            >
              <Layout.Sider
                hidden={!showNav || screenSize.width < 1200}
                width={300}
                style={{
                  overflow: "auto",
                  lineHeight: 1,
                  borderRadius: token.borderRadius,
                  backgroundColor: token.colorFillContent,
                  marginRight:
                    screenSize.width >= 1200
                      ? "clamp(5px,100vw - 1200px,50px)"
                      : 0,
                }}
              >
                <MemoNavigation></MemoNavigation>
              </Layout.Sider>
              <Hidden hidden={screenSize.width < 1200}>
                <div
                  style={{
                    position: "absolute",
                    left: showNav ? 10 : -40,
                    top: 10,
                  }}
                >
                  <Button
                    type="text"
                    style={{
                      color: token.colorTextBase,
                    }}
                    onClick={() => setShowNav((v) => !v)}
                    icon={
                      showNav ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                    }
                  ></Button>
                </div>
              </Hidden>

              <Content
                style={{
                  borderRadius: token.borderRadius,
                  backgroundColor: token.colorFillContent,
                  // width: "auto",
                  display: "flex",
                }}
                onTouchMove={() => {
                  activityScroll({});
                }}
                onWheel={() => {
                  activityScroll({});
                }}
              >
                <div
                  id={onlyOne ? undefined : "content"}
                  style={{
                    height: "100%",
                    overflow: "auto",
                    maxWidth: 1100,
                    width:
                      screenSize.width >= 1200
                        ? screenSize.width -
                          (showConfigs ? 340 : 0) -
                          (showNav
                            ? 300 +
                              Math.min(50, Math.max(5, screenSize.width - 1200))
                            : 0) -
                          120
                        : "100vw",
                    minWidth: 300,
                  }}
                >
                  <MemoChatMessage />
                </div>
                <Hidden hidden={!showConfigs}>
                  <div
                    style={{
                      width: 340,
                      padding: 10,
                    }}
                  >
                    <QuickEditConfig />
                  </div>
                </Hidden>
              </Content>
            </div>
            <SkipExport>
              <div>
                <MemoInputUtil></MemoInputUtil>
              </div>
            </SkipExport>
            <Hidden
              hidden={screenSize.width > 1460 ? false : screenSize.width < 1200}
            >
              <div style={{ position: "absolute", right: -40, bottom: 10 }}>
                <Button
                  type="text"
                  style={{
                    color: token.colorTextBase,
                  }}
                  onClick={() => setShowConfigs((v) => !v)}
                  icon={
                    showConfigs ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
                  }
                ></Button>
              </div>
            </Hidden>
          </div>
        </Layout>
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
