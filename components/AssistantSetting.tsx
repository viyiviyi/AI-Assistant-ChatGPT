import { useState } from "react";

export const AssistantSetting = ({
  name,
  propPrefix,
  onOk,
  onCacle,
}: {
  name: string;
  propPrefix: string;
  onOk: (value: { name: string; prefix: string; msgCount: number }) => void;
  onCacle: () => void;
}) => {
  const [assistanName, setName] = useState(name);
  const [prefix, setPrefix] = useState(propPrefix);
  const [msgCount, setMsgCount] = useState(4);

  return (
    <div
      style={{
        width: "min(95vw, 420px)",
        padding: "20px",
        borderRadius: "5px",
        backgroundColor: "rgb(var(--background-start-rgb))",
        border: "1px solid rgb(var(--foreground-rgb))",
      }}
      onClick={e=>e.stopPropagation()}
    >
      <div style={{ display: "flex", marginBottom: "15px" }}>
        <span>助理名称:</span>
        <input
          style={{
            flex: 1,
            height: "32px",
            marginLeft: "5px",
            textIndent: "1em",
          }}
          onChange={(e) => {
            setName(e.target.value);
          }}
          type="text"
          name="assistanName"
          value={assistanName}
        />
      </div>
      <div>
        <div>消息前缀:</div>
        <textarea
          style={{
            flex: 1,
            width: "100%",
            marginTop: "5px",
            height: "10em",
            minHeight: "5em",
            maxHeight: "20em",
            resize: "vertical",
            lineHeight: 1.4,
            padding: "1em",
            boxSizing: "border-box",
          }}
          onChange={(e) => {
            setPrefix(e.target.value);
          }}
          name="assistanName"
          value={prefix}
        />
      </div>
      <div>
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>消息数量: (对话时发送用于维持状态的对话数量, 设为0表示全部)</div>
          <input
            style={{
              height: "32px",
              textIndent: "1em",
            }}
            onChange={(e) => {
              setMsgCount(Number(e.target.value));
            }}
            type="number"
            name="msgCount"
            value={msgCount}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "10px",
        }}
      >
        <button
          style={{
            marginRight: "15px",
            cursor: "pointer",
            padding: "8px 16px",
          }}
          onClick={onCacle}
        >
          取消
        </button>
        <button
          style={{ cursor: "pointer", padding: "8px 16px" }}
          onClick={() => {
            onOk({ name: assistanName, prefix, msgCount });
          }}
        >
          确定
        </button>
      </div>
    </div>
  );
};
