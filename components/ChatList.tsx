import { CahtManagement } from "@/core/ChatManagement";
import { useEffect, useState } from "react";

export const ChatList = ({ cb }: { cb: (chatMgt: CahtManagement) => void }) => {
  const [chatList, setChatList] = useState<CahtManagement[]>([]);
  useEffect(() => {
    CahtManagement.list().then((v) => {
      setChatList(chatList);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div style={{ padding: "40px 20px", margin: "20px 10px" }}>
        <div>
          {chatList.map((v, idx) => (
            <div style={{ display: "flex" }} key={idx}>
              <div></div>
              <div>
                <span>{v.config.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
