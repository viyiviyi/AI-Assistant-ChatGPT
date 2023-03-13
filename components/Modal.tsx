import { theme } from "antd";
import { ReactElement, useEffect } from "react";

export const Modal = ({
  isShow = false,
  onCancel = () => {},
  children,
}: {
  isShow: boolean;
  children: ReactElement<any, any>;
  onCancel?: () => void;
}) => {
  const { token } = theme.useToken();
  return (
    <>
      {isShow ? (
        <div
          onClick={() => {
            onCancel();
          }}
          style={{
            position: "fixed",
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            backgroundColor: token.colorBgMask,
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: token.paddingSM,
              backgroundColor: token.colorBgElevated,
              borderRadius: token.borderRadiusLG,
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};
