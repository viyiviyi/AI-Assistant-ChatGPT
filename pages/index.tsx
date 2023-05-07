import { Groups } from "@/components/Groups";
import { ChatManagement, IChat } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const screenSize = useScreenSize();
  const [showGroups, setShowGroup] = useState(false);
  const [groups, setGroups] = useState<IChat[]>(ChatManagement.getGroups());
  useEffect(() => {
    ChatManagement.load().then(() => {
      const groups = ChatManagement.getGroups();
      setGroups([...groups]);
      if (screenSize.width * 1.5 <= screenSize.height) {
        setShowGroup(true);
      } else {
        router.replace("/chat/" + (groups.length ? groups[0].group.id : ""));
      }
    });
  }, [router, screenSize]);

  return (
    <div style={{ padding: "1em 12px", overflow: "auto", maxHeight: "100%" }}>
      {showGroups && <Groups groups={groups}></Groups>}
    </div>
  );
}
