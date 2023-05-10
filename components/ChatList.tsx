import { ChatManagement, IChat } from "@/core/ChatManagement";

import { Button, theme } from "antd";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import { Groups } from "./Groups";

export const ChatList = ({ onCacle }: { onCacle: () => void }) => {
  const router = useRouter();
  const { token } = theme.useToken();
  const [groups, setGroups] = useState<IChat[]>(ChatManagement.getGroups());
  useEffect(() => {
    ChatManagement.load().then(() => {
      setGroups([...ChatManagement.getGroups()]);
    });
  }, []);

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
            groups={groups}
            onClick={(chat: IChat) => {
              ChatManagement.toFirst(chat.group).then(() => {
                router.replace("/chat?id=" + chat.group.id);
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
