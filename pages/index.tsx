import { Groups } from "@/components/Groups";
import { ChatManagement, IChat } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { Layout, theme } from "antd";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { token } = theme.useToken();
  const screenSize = useScreenSize();
  const [showGroups, setShowGroup] = useState(true);
  const [groups, setGroups] = useState<IChat[]>(ChatManagement.getGroups());
  useEffect(() => {
    ChatManagement.load().then(() => {
      const groups = ChatManagement.getGroups();
      setGroups([...groups]);
      if (screenSize.width * 1.5 > screenSize.height) {
        router.replace("/chat?id=" + (groups.length ? groups[0].group.id : ""));
      }
    });
  }, [router, screenSize]);

  return (
    <Layout
      style={{
        display: "flex",
        height: "100%",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        maxHeight: "100%",
        flexWrap: "nowrap",
        position: "relative",
        color: token.colorTextBase,
        backgroundColor: token.colorBgContainer,
      }}
    >
      <div
        style={{
          padding: "1em 12px",
          overflow: "auto",
          maxHeight: "100%",
          width: "min(460px , 100%)",
          margin: "0 auto",
        }}
      >
        {showGroups && (
          <Groups
            groups={groups}
            onClick={(chat: IChat) => {
              ChatManagement.toFirst(chat.group).then(() => {
                router.push("/chat?id=" + chat.group.id);
              });
            }}
          ></Groups>
        )}
      </div>
    </Layout>
  );
}
