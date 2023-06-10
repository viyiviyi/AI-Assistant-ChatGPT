import { ChatManagement, IChat } from "@/core/ChatManagement";

import { Button, theme } from "antd";
import { useRouter } from "next/router";

import { Groups } from "./Groups";

export const ChatList = ({ onCacle }: { onCacle: () => void }) => {
  const router = useRouter();
  const { token } = theme.useToken();

  return (
    <>
      <div
        style={{
          padding: token.paddingSM,
          width: "min(90vw, 460px)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100%",
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "auto",
            marginBottom: "20px",
          }}
        >
          <Groups
            onClick={(chat: IChat) => {
              ChatManagement.toFirst(chat.group).then(() => {
                router.replace("/chat?id=" + chat.group.id);
                onCacle();
              });
            }}
          ></Groups>
        </div>
        <Button.Group>
          <Button
            block
            onClick={(e) => {
              e.stopPropagation();
              ChatManagement.createChat().then((v) => {
                router.replace("/chat?id=" + v.group.id);
                onCacle();
              });
            }}
          >
            <div>
              <span>新建</span>
            </div>
          </Button>
          <Button block onClick={() => onCacle()}>
            <span>关闭</span>
          </Button>
        </Button.Group>
      </div>
    </>
  );
};
