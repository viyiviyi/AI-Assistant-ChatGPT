import { Groups } from "@/components/Groups";
import { ChatManagement, IChat } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { Layout, theme } from "antd";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import NoSSR from "react-no-ssr";

export default function Home() {
  const router = useRouter();
  const { token } = theme.useToken();
  const screenSize = useScreenSize();
  useEffect(() => {
    if (screenSize.width * 1.5 > screenSize.height) {
      router.replace("/chat");
    }
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
      <Head>
        <title>Chat助理</title>
      </Head>
      <div
        style={{
          padding: "1em 12px",
          overflow: "auto",
          maxHeight: "100%",
          width: "min(460px , 100%)",
          margin: "0 auto",
        }}
      >
        <NoSSR>
          <Groups
            onClick={(chat: IChat) => {
              ChatManagement.toFirst(chat.group).then(() => {
                router.push("/chat?id=" + chat.group.id);
              });
            }}
          ></Groups>
        </NoSSR>
      </div>
    </Layout>
  );
}
