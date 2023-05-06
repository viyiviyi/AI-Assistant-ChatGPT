import { Groups } from "@/components/Groups";
import { ChatManagement, IChat } from "@/core/ChatManagement";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [showGroups, setShowGroup] = useState(false);
  const [groups, setGroups] = useState<IChat[]>(ChatManagement.getGroups());
  useEffect(() => {
    ChatManagement.load().then(() => {
      const groups = ChatManagement.getGroups();
      setGroups([...groups]);
      if (window.innerWidth * 1.5 <= window.innerHeight) {
        setShowGroup(true);
      } else {
        router.replace("/chat/" + (groups.length ? groups[0].group.id : ""));
      }
    });
  }, [router]);

  return (
    <div style={{ padding: "1em 12px", overflow: "auto", maxHeight: "100%" }}>
      {showGroups && <Groups groups={groups}></Groups>}
    </div>
  );
}
