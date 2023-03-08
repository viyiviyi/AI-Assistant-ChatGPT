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
import { Message } from "@/Models/models";

export const ChatMessage = ({
  msg,
  rBak,
  onDel,
  onSkip,
}: {
  msg: Message;
  rBak: (v: Message) => void;
  onDel: (v: Message) => void;
  onSkip: (v: Message) => void;
}) => {
  const { isPull, tagColor, timestamp, message, nickname } = msg;
  return (
    <div className={style.message}>
      {isPull ? (
        <div
          style={{ width: "10px", backgroundColor: tagColor }}
        ></div>
      ) : (
        <></>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column",padding:'5px 10px' }}>
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
      {isPull ? (
        <></>
      ) : (
        <div
          style={{  width: "10px", backgroundColor: tagColor}}
          ></div>
      )}
    </div>
  );
};
