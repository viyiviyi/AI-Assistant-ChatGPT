import { ChatManagement } from "@/core/ChatManagement";
import { usePushMessage } from "@/core/hooks";
import { onTextareaTab } from "@/core/utils";
import { CtxRole } from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import { CloseOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Input, theme } from "antd";
import React, { useState } from "react";
import { CtxRoleButton } from "./CtxRoleButton";

// export const insertInputRef = React.createRef<HTMLInputElement>();
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
  const [insertInputRef] = useState(React.createRef<HTMLInputElement>());
  const [role, setRole] = useState<[CtxRole, boolean]>(["user", true]);

  const onSubmit = (text: string, idx: number) => {
    if(!text.trim()) return
    pushMessage(text, idx, topic, role, () => {
      onHidden();
      setInsertText("");
    });
  };

  return (
    <>
      <div
        style={{
          width: "calc(100%)",
          borderRadius: token.borderRadius,
          backgroundColor: token.colorFillContent,
          padding: "2px",
          marginTop: "20px",
        }}
      >
        <div style={{ display: "flex", marginBottom: 5 }}>
          <CtxRoleButton
            value={role}
            onChange={setRole}
            inputRef={insertInputRef}
          />
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
          autoFocus={true}
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
            setInsertText((v) =>
              onTextareaTab(
                v,
                e.currentTarget?.selectionStart,
                e.currentTarget?.selectionEnd,
                e.currentTarget,
                e.shiftKey
              )
            ))
          }
        />
      </div>
    </>
  );
}
export const MemoInsertInput = React.memo(InsertInput);
