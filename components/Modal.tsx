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
            alignItems: "center",
          }}
        >
          {children}
        </div>
      ) : (
        ""
      )}
    </>
  );
};
