import { aiServices } from "@/core/AiService/ServiceProvider";
import { ChatManagement } from "@/core/ChatManagement";
import { usePushMessage } from "@/core/hooks";
import { TopicMessage } from "@/Models/Topic";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Input, theme, Tooltip } from "antd";
import React, { useState } from "react";

export const insertInputRef = React.createRef<HTMLInputElement>();
function InsertInput({
  topic,
  chat,
  onHidden,
  insertIndex,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
  onHidden: () => void;
  insertIndex: number;
}) {
  const [insertText, setInsertText] = useState("");
  const { pushMessage } = usePushMessage(chat);
  const { token } = theme.useToken();

  const onSubmit = (text: string, idx: number) => {
    if (!aiServices.current?.customContext) {
      if (!text.startsWith("/") && !text.startsWith("\\")) {
        text = "\\" + text;
      }
    }
    pushMessage(text, idx, topic, () => {
      onHidden();
      setInsertText("");
    });
  };
  const onTextareaTab = (
    start: number,
    end: number,
    textarea: EventTarget & HTMLTextAreaElement
  ) => {
    setInsertText((v) => v.substring(0, start) + "    " + v.substring(start));
    setTimeout(() => {
      textarea.selectionStart = start + 4;
      textarea.selectionEnd = end + 4;
    }, 0);
  };
  return (
    <>
      <div
        style={{
          width: "calc(100%)",
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
          padding: "2px",
        }}
      >
        <div style={{ display: "flex", marginBottom: 5 }}>
          <Tooltip title={"作为AI消息"}>
            <Button
              type="text"
              size="large"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInsertText((v) => "/" + ChatManagement.parseText(v));
              }}
            >
              /
            </Button>
          </Tooltip>
          <Tooltip title={"作为用户消息，不访问AI"}>
            <Button
              type="text"
              size="large"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInsertText((v) => "\\" + ChatManagement.parseText(v));
              }}
            >
              \
            </Button>
          </Tooltip>
          <Tooltip title={"作为系统消息"}>
            <Button
              type="text"
              size="large"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInsertText((v) => "::" + ChatManagement.parseText(v));
              }}
            >
              ::
            </Button>
          </Tooltip>
          <Tooltip title={"作为系统消息，不访问AI"}>
            <Button
              type="text"
              size="large"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInsertText((v) => "/::" + ChatManagement.parseText(v));
              }}
            >
              /::
            </Button>
          </Tooltip>
          <span style={{ flex: 1 }}></span>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={<CloseOutlined />}
            onClick={() => {
              onHidden && onHidden();
            }}
          ></Button>
          <span style={{ marginLeft: 10 }}></span>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={<MessageOutlined />}
            onClick={() => {
              onSubmit(insertText, insertIndex);
            }}
          ></Button>
        </div>
        <Input.TextArea
          placeholder="Ctrl + S 或 Ctrl + Enter 插入消息"
          autoSize={{ maxRows: 10 }}
          allowClear
          ref={insertInputRef}
          autoFocus={false}
          value={insertText}
          onKeyUp={(e) =>
            (e.key === "s" && e.altKey && onSubmit(insertText, insertIndex)) ||
            (e.key === "Enter" &&
              e.ctrlKey &&
              onSubmit(insertText, insertIndex))
          }
          onChange={(e) => setInsertText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Tab" &&
            (e.preventDefault(),
            onTextareaTab(
              e.currentTarget?.selectionStart,
              e.currentTarget?.selectionEnd,
              e.currentTarget
            ))
          }
        />
      </div>
    </>
  );
}
export const MemoInsertInput = React.memo(InsertInput);
