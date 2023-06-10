import { ChatContext } from "@/core/ChatManagement";
import React, { useContext } from "react";

function BackgroundImage() {
  const { bgConfig } = useContext(ChatContext);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        ...bgConfig,
      }}
    ></div>
  );
}

export const MemoBackgroundImage = React.memo(BackgroundImage);
