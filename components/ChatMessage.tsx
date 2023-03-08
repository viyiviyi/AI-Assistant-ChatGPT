import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { MarkdownView } from "./MarkdownView";
import style from "../styles/index.module.css";
import { CopyOutlined, DeleteOutlined, FunnelPlotOutlined, RollbackOutlined } from "@ant-design/icons";
import { Message } from "@/Models/models";

export const ChatMessage = ({
  msg,
  rBak,
  onDel,
onSkip
}: {
  msg: Message;
    rBak: (v: Message) => void;
    onDel?: () => void;
    onSkip?:()=>void
}) => {
  const { isPull, tagColor, timestamp, message, nickname } = msg;
  return (
    <div className={style.message}>
      {isPull ? (
        <div
          style={{ height: "100%", width: "10px", backgroundColor: tagColor }}
        ></div>
      ) : (
        <></>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className={style.message__header}></div>
        <div className={style.message__body}>
          <MarkdownView markdown={message} />
        </div>
        <div className={style.message__footer}>
          <span className={style.message__nickname}>{nickname}</span>
          <span style={{ marginLeft: "10px" }}></span>
          <span className={style.message__timestamp}>
            {new Date(timestamp).toLocaleString()}
          </span>
          <span style={{ marginLeft: "10px" }}></span>
          <CopyToClipboard text={message}>
            <CopyOutlined />
          </CopyToClipboard>
          <span style={{ marginLeft: "10px" }}></span>
          <RollbackOutlined
            style={{ cursor: "pointer" }}
            onClick={() => {
              rBak(msg);
            }}
          />
          <span style={{ marginLeft: "10px" }}></span>
          <DeleteOutlined style={{ cursor: "pointer" }}/>
          
          <span style={{ marginLeft: "10px" }}></span>
          <FunnelPlotOutlined style={{ cursor: "pointer" }}/>
        </div>
      </div>
      {isPull ? (
        <></>
      ) : (
        <div
          style={{ height: "100%", width: "10px", backgroundColor: tagColor }}
        ></div>
      )}
    </div>
  );
};
