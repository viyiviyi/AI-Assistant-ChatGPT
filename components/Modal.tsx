import { ReactElement, useEffect } from "react";

export const Modal = ({
  isShow = false,
  children,
}: {
  isShow: boolean;
  children: ReactElement<any, any>;
  }) => {
  return (
    <>
      {isShow ? (
        <div
          onClick={() => {
            isShow = false;
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
