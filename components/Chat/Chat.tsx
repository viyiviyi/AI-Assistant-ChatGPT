import { ChatMessage } from "@/components/Chat/ChatMessage";
import { ChatContext } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import {
  SettingOutlined,
  UnorderedListOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { Avatar, Layout, message, theme, Typography } from "antd";
import React, { useContext, useState } from "react";
import { InputUtil } from "./InputUtil";

const { Content } = Layout;

export const MessageContext = React.createContext({
  onlyOne: false,
  closeAll: false,
  cite: {} as Message | undefined,
  setOnlyOne: (b: boolean) => {},
  setCloasAll: (b: boolean) => {},
  setCite: (msg: Message) => {},
});

export const Chat = ({
  togglelistIsShow,
  toggleSettingShow,
  toggleRoleConfig,
}: {
  togglelistIsShow: () => void;
  toggleSettingShow: () => void;
  toggleRoleConfig: () => void;
}) => {
  const { token } = theme.useToken();
  const { chat } = useContext(ChatContext);
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
        <div
          style={{
            flexWrap: "nowrap",
            gap: "16px",
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
            alignItems: "center",
            marginBottom: "3px",
            padding: "10px",
            position: "relative",
            borderRadius:
              "0" +
              " 0 " +
              token.borderRadius +
              "px " +
              token.borderRadius +
              "px",
            backgroundColor: token.colorFillContent,
          }}
        >
          <Avatar
            onClick={toggleRoleConfig}
            size={32}
            style={{ minWidth: "32px", minHeight: "32px" }}
            src={chat.group.avatar || chat?.virtualRole.avatar || undefined}
          ></Avatar>
          <Typography.Text ellipsis onClick={toggleSettingShow}>
            {chat?.group.name}
          </Typography.Text>
          <span style={{ flex: 1 }}></span>
          <UserAddOutlined onClick={() => toggleRoleConfig()} />
          <SettingOutlined
            onClick={() => toggleSettingShow()}
            style={{ marginLeft: "10px" }}
          />
          <UnorderedListOutlined
            onClick={() => {
              togglelistIsShow();
            }}
            style={{ marginLeft: "10px", marginRight: "10px" }}
          />
        </div>
        <Content
          id="content"
          style={{
            overflow: "auto",
            borderRadius: token.borderRadius,
            backgroundColor: token.colorFillContent,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <ChatMessage />
        </Content>
       <InputUtil></InputUtil>
      </div>
    </MessageContext.Provider>
  );
};
