import { ChatContext } from "@/core/ChatManagement";
import {
  SettingOutlined,
  UnorderedListOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { Avatar, Layout, theme, Typography } from "antd";
import { useContext, useState } from "react";
import { ChatList } from "../ChatList";
import { Modal } from "../Modal";
import { Setting } from "../Setting";
import { VirtualRoleConfig } from "../VirtualRoleConfig";
import { reloadTopic } from "./MessageList";

export const ChatHeader = () => {
  const { chat, activityTopic } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);
  const [roleConfigShow, setRoleConfigShow] = useState(false);
  return (
    <Layout.Header
      style={{
        flexWrap: "nowrap",
        gap: "16px",
        width: "100%",
        justifyContent: "flex-end",
        display: "flex",
        alignItems: "center",
        marginBottom: "3px",
        padding: "10px",
        height: "52px",
        position: "relative",
        borderRadius:
          "0" + " 0 " + token.borderRadius + "px " + token.borderRadius + "px",
        backgroundColor: token.colorFillContent,
      }}
    >
      <Avatar
        onClick={(v) => {
          setRoleConfigShow(roleConfigShow!);
        }}
        size={32}
        style={{ minWidth: "32px", minHeight: "32px" }}
        src={chat.group.avatar || chat?.virtualRole.avatar || undefined}
      ></Avatar>
      <Typography.Text ellipsis onClick={() => setSettingShow(!settingIsShow)}>
        {chat?.group.name}
      </Typography.Text>
      <span style={{ flex: 1 }}></span>
      <UserAddOutlined onClick={() => setRoleConfigShow(!roleConfigShow)} />
      <SettingOutlined
        onClick={() => setSettingShow(!settingIsShow)}
        style={{ marginLeft: "10px" }}
      />
      <UnorderedListOutlined
        onClick={() => {
          setlistIsShow(!listIsShow);
        }}
        style={{ marginLeft: "10px", marginRight: "10px" }}
      />
      <Modal
        isShow={roleConfigShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setRoleConfigShow(false);
        }}
      >
        <VirtualRoleConfig
          onCancel={() => {
            setRoleConfigShow(false);
          }}
          onSaved={() => {
            setRoleConfigShow(false);
            if (activityTopic) reloadTopic(activityTopic.id);
          }}
          chatMgt={chat}
        ></VirtualRoleConfig>
      </Modal>
      <Modal
        isShow={settingIsShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setSettingShow(false);
        }}
      >
        <Setting
          onCancel={() => {
            setSettingShow(false);
          }}
          onSaved={() => {
            setSettingShow(false);
          }}
          chatMgt={chat}
        ></Setting>
      </Modal>
      <Modal
        isShow={listIsShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setlistIsShow(false);
        }}
      >
        <ChatList
          onCacle={() => {
            setlistIsShow(false);
          }}
        ></ChatList>
      </Modal>
    </Layout.Header>
  );
};
