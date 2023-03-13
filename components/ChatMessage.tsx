import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { MarkdownView } from "./MarkdownView";
// import style from "../styles/index.module.css";
import {
  CopyOutlined,
  DeleteOutlined,
  FunnelPlotOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Message, Topic } from "@/Models/DataBase";
import { ChatManagement } from "@/core/ChatManagement";
import { Avatar, Collapse, GlobalToken, Popover, theme } from "antd";
import { CaretRightOutlined, UserOutlined } from "@ant-design/icons";

const { Panel } = Collapse;
export const ChatMessage = ({
  chat,
  rBak,
  onDel,
}: {
  chat?: ChatManagement;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
}) => {
  const { token } = theme.useToken();
  const [activeKeys, setActiveKeys] = useState([
    ...(chat?.topic.map((v) => v.id) || []),
  ]);
  if (!chat) return <></>;
  function rendTopic(topic: Topic,idx:number) {
    let messages = chat?.getMessages().filter((f) => f.topicId === topic.id);
    if (messages?.length) {
      return (
        <Panel
          header={topic.name + " " + topic.createdAt.toLocaleString()}
          key={idx}
          style={{
            marginBottom: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            border: "none",
          }}
        >
          {chat
            ?.getMessages()
            .filter((f) => f.topicId === topic.id)
            .map(Messages)}
        </Panel>
      );
    }
    return <div key={idx}></div>;
  }

  function Messages(msg: Message, idx: number) {
    return (
      <div
        key={idx}
        style={{
          display: "flex",
          justifyContent: msg.virtualRoleId ? "flex-start" : "flex-end",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            maxWidth: "calc(100% - 64px)",
            flexDirection: msg.virtualRoleId ? "row" : "row-reverse",
          }}
        >
          <Avatar style={{ width: "32px",height:'32px' }} icon={<UserOutlined />} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                padding: "0 5px",
                flexDirection: msg.virtualRoleId ? "row" : "row-reverse",
              }}
            >
              <span>
                {msg.virtualRoleId ? chat?.virtualRole.name : chat?.user?.name}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                padding: "5px 10px",
                flexDirection: "column",
                boxSizing: "border-box",
                borderRadius: token.borderRadiusLG,
                border: "1px solid " + token.colorFillAlter,
                backgroundColor: token.colorFillContent,
                marginBottom: "12px",
                boxShadow: token.boxShadowTertiary,
              }}
            >
              <div>
                <MarkdownView markdown={msg.text} />
              </div>
              <div
                style={{
                  display: "flex",
                  borderTop: "1px solid #ccc3",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ marginLeft: "10px" }}></span>
                <span>{new Date(msg.timestamp).toLocaleString()}</span>
                <span style={{ marginLeft: "16px" }}></span>
                <CopyToClipboard text={msg.text}>
                  <CopyOutlined />
                </CopyToClipboard>
                <span style={{ marginLeft: "16px" }}></span>
                <RollbackOutlined
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    rBak(msg);
                  }}
                />
                <span style={{ marginLeft: "30px" }}></span>
                <DeleteOutlined
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    onDel(msg);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <Collapse
      bordered={false}
      defaultActiveKey={[chat.topic.slice(-1)[0].id]}
      expandIcon={({ isActive }) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
      )}
      style={{ background: token.colorBgContainer }}
    >
      {chat.topic.map(rendTopic)}
    </Collapse>
  );
};