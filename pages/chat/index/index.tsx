import { ChatManagement } from "@/core/ChatManagement";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    ChatManagement.load().then(() => {
      let chats = ChatManagement.getGroups();
      if (chats.length == 0) return;
      router.push("/chat?id=" + chats[0].group.id);
    });
  }, [router]);
  return <></>;
}
