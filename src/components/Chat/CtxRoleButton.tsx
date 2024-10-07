import { CtxRole } from "@/Models/CtxRole";
import { Flex, Segmented } from "antd";
import { CSSProperties } from "react";

export function CtxRoleButton({
  style,
  onChange,
  value,
  inputRef,
}: {
  style?: CSSProperties | undefined;
  value: [CtxRole, boolean];
  onChange: (value: [CtxRole, boolean]) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  return (
    <Flex gap={10} style={style}>
      <Segmented
        value={value[0]}
        onChange={(val) => {
          onChange([val as CtxRole, value[1]]);
          inputRef?.current?.focus();
        }}
        options={[
          { label: "助理", value: "assistant" },
          { label: "系统", value: "system" },
          { label: "用户", value: "user" },
        ]}
      />
      <Segmented
        value={value[1] ? "true" : "false"}
        onChange={(val) => {
          onChange([value[0], val == "true"]);
          inputRef?.current?.focus();
        }}
        options={[
          { label: "在线", value: "true" },
          { label: "离线", value: "false" },
        ]}
      />
    </Flex>
  );
}
