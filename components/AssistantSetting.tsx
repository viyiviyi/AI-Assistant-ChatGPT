import { useState } from "react";

export const AssistantSetting = ({
  name,
  propPrefix,
  onOk,
  onCacle,
}: {
  name: string;
  propPrefix: string;
  onOk: (value: { name: string; prefix: string }) => void;
  onCacle: () => void;
}) => {
  const [assistanName, setName] = useState(name);
  const [prefix, setPrefix] = useState(propPrefix);

  return (
    <div
      style={{
        width: "420px",
        height: "260px",
        backgroundColor: "rgba(var(--foreground-rgb), .5)",
        padding: "20px",
        borderRadius: "5px",
        border: "1px solid rgb(var(--foreground-rgb))",
      }}
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
            maxHeight: "11em",
            maxWidth: "100%",
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
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
            onOk({ name: assistanName, prefix });
          }}
        >
          确定
        </button>
      </div>
    </div>
  );
};
