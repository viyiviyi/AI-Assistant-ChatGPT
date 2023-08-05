import { ChatContext } from "@/core/ChatManagement";
import {
  SearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { Avatar, Drawer, Layout, theme, Typography } from "antd";
import React, { useContext, useState } from "react";
import { MemoBackgroundImage } from "../BackgroundImage";
import { ChatList } from "../ChatList";
import { Modal } from "../Modal";
import { Setting } from "../Setting";
import { VirtualRoleConfig } from "../VirtualRoleConfig";
import { reloadTopic } from "./MessageList";
import { MemoSearchWrap } from "./Search";

export const ChatHeader = () => {
  const { chat, activityTopic } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);
  const [roleConfigShow, setRoleConfigShow] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  return (
    <Layout.Header
      style={{
        flexWrap: "nowrap",
        // gap: "16px",
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
      <span style={{ marginLeft: 10 }}></span>
      <Typography.Text ellipsis onClick={() => setSettingShow(!settingIsShow)}>
        {chat?.group.name}
      </Typography.Text>
      <span style={{ flex: 1 }}></span>
      <SearchOutlined
        style={{ padding: "5px 10px" }}
        onClick={() => setOpenSearch(true)}
      />
      <Drawer
        placement={"right"}
        closable={false}
        width={"min(500px ,100vw - 100px)"}
        key={"search_nav_drawer"}
        bodyStyle={{ padding: "1em 0" }}
        open={openSearch}
        maskStyle={{ backgroundColor: "#0000" }}
        onClose={() => {
          setOpenSearch(false);
        }}
      >
        <MemoBackgroundImage />
        <div
          style={{
            position: "relative",
            height: "100%",
            zIndex: 99,
          }}
        >
          <MemoSearchWrap />
        </div>
      </Drawer>
      <UserAddOutlined
        style={{ padding: "5px 10px" }}
        onClick={() => setRoleConfigShow(!roleConfigShow)}
      />
      <SettingOutlined
        onClick={() => setSettingShow(!settingIsShow)}
        style={{ padding: "5px 10px" }}
      />
      <UnorderedListOutlined
        onClick={() => {
          setlistIsShow(!listIsShow);
        }}
        style={{ padding: "5px 10px" }}
      />
      <Modal
        isShow={roleConfigShow}
        onCancel={() => {
        }}
        items={
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
        }
      ></Modal>
      <Modal
        isShow={settingIsShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setSettingShow(false);
        }}
        items={
          <Setting
            onCancel={() => {
              setSettingShow(false);
            }}
            onSaved={() => {
              setSettingShow(false);
            }}
            chatMgt={chat}
          ></Setting>
        }
      ></Modal>
      <Modal
        isShow={listIsShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setlistIsShow(false);
        }}
        items={
          <ChatList
            onCacle={() => {
              setlistIsShow(false);
            }}
          ></ChatList>
        }
      ></Modal>
    </Layout.Header>
  );
};
export const MemoChatHeader = React.memo(ChatHeader);
