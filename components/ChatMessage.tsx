import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { MarkdownView } from "./MarkdownView";
import style from "../styles/index.module.css";
import {
  CopyOutlined,
  DeleteOutlined,
  FunnelPlotOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Message } from "@/Models/DataBase";
import { CahtManagement } from "@/core/ChatManagement";

export const ChatMessage = ({
  chat,
  rBak,
  onDel,
  onSkip,
}: {
  chat?: CahtManagement;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  onSkip: (v: Message) => void;
  }) => {
  if (!chat) return <></>
  return (
    <>
      {chat.getMessages().map((msg, idx) => {
        return (
          <div className={style.message} key={idx}>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "5px 10px",
                boxSizing: "border-box",
                maxWidth: "100%",
              }}
            >
              <div className={style.message__header}></div>
              <div className={style.message__body}>
                <MarkdownView markdown={msg.text} />
              </div>
              <div className={style.message__footer}>
                <span className={style.message__nickname}>
                  {msg.virtualRoleId ? chat.virtualRole.name : chat.user?.name}
                </span>
                <span style={{ marginLeft: "10px" }}></span>
                <span className={style.message__timestamp}>
                  {new Date(msg.timestamp).toLocaleString()}
                </span>
                <span style={{ marginLeft: "10px" }}></span>
                <CopyToClipboard text={msg.text}>
                  <CopyOutlined />
                </CopyToClipboard>
                <span style={{ marginLeft: "10px" }}></span>
                <RollbackOutlined
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    rBak(msg);
                  }}
                />
                <span style={{ marginLeft: "10px", flex: 1 }}></span>
                <DeleteOutlined
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    onDel(msg);
                  }}
                />

                {/* <span style={{ marginLeft: "10px" }}></span>
          <FunnelPlotOutlined
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              onSkip(msg);
            }}
          />
          {msg.isSkip ?<span style={{fontSize:'12px',textIndent:'1em'}}>从记录中排除</span>:<></> } */}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
