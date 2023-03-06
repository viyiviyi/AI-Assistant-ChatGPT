import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { MarkdownView } from "./MarkdownView";
import style from "../styles/index.module.css";

export const PushMessage = ({
  nickname,
  timestamp,
  message,
  isPull,
}: {
  nickname: string;
  timestamp: number;
  message: string;
  isPull: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <div className={style.message}>
      {isPull ? (
        <div
          style={{ height: "100%", width: "10px", backgroundColor: "#10a37f" }}
        ></div>
      ) : (
        <></>
      )}
      <div>
        <div className={style.message__body}>
          <MarkdownView markdown={message} />
        </div>
        <div className={style.message__header}>
          <span className={style.message__nickname}>{nickname}</span>
          <span className={style.message__timestamp}>{timestamp}</span>
        </div>
        <div
          className={style.message__footer}
          style={{ justifyContent: isPull ? "flex-start" : "flex-end" }}
        >
          <CopyToClipboard text={message} onCopy={handleCopy}>
            <span>Copy</span>
          </CopyToClipboard>
        </div>
      </div>
      {isPull ? (
        <></>
      ) : (
        <div
          style={{ height: "100%", width: "10px", backgroundColor: "#10a37f" }}
        ></div>
      )}
    </div>
  );
};
