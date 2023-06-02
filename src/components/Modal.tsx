import { theme } from "antd";
import { ReactElement } from "react";

export const Modal = ({
  isShow = false,
  onCancel = () => {},
  children,
  maxHight,
}: {
  isShow: boolean;
  children: ReactElement<any, any>;
  onCancel?: () => void;
  maxHight?: string;
}) => {
  const { token } = theme.useToken();
  if (!isShow) return <></>;
  return (
    <div
      onClick={() => {
        onCancel();
      }}
      style={{
        position: "fixed",
        width: "100vw",
        minHeight: "100%",
        maxHeight: "100%",
        height: "100%",
        left: 0,
        top: 0,
        display: "flex",
        justifyContent: "center",
        backgroundColor: token.colorBgMask,
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: token.paddingSM,
          backgroundColor: token.colorBgElevated,
          borderRadius: token.borderRadiusLG,
          maxHeight: maxHight ? maxHight : "calc(100% - 40px)",
          borderWidth: 1,
          borderColor: token.colorBorder,
          borderStyle: "solid",
          height: "100%",
          overflow: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
};
