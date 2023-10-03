import { ChatManagement, IChat } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks/hooks";

import { Button, theme, Typography } from "antd";
import { useRouter } from "next/router";

import { Groups } from "./Groups";

export const ChatList = ({ onCacle }: { onCacle: () => void }) => {
  const router = useRouter();
  const { token } = theme.useToken();
  const screenSize = useScreenSize();

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: screenSize.height - 250,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          <Typography.Title level={4} style={{ textAlign: "center" }}>
            {"会话列表"}
          </Typography.Title>
          <Groups
            onClick={(chat: IChat) => {
              ChatManagement.toFirst(chat.group).then(() => {
                router.replace("/chat?id=" + chat.group.id);
                onCacle();
              });
            }}
          ></Groups>
        </div>
        <Button
          block
          ghost
          onClick={(e) => {
            e.stopPropagation();
            ChatManagement.createChat().then((v) => {
              router.replace("/chat?id=" + v.group.id);
              onCacle();
            });
          }}
          style={{
            marginTop: 10,
            padding: 10,
            height: "auto",
            color: token.colorTextPlaceholder,
            borderColor: token.colorTextQuaternary,
          }}
        >
          <div>
            <span>新建</span>
          </div>
        </Button>
      </div>
    </>
  );
};
