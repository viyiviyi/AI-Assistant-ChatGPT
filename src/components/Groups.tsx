import { ChatManagement, IChat } from "@/core/ChatManagement";
import { Avatar, Card, theme } from "antd";
import { useEffect, useState } from "react";

export const Groups = ({ onClick }: { onClick: (chat: IChat) => void }) => {
  const { token } = theme.useToken();
  const [groups, setGroups] = useState<IChat[]>(ChatManagement.getGroups());
  useEffect(() => {
    ChatManagement.load().then(() => {
      const groups = ChatManagement.getGroups();
      setGroups([...groups]);
    });
  }, []);
  return (
    <>
      {groups.map((v, idx) => (
        <Card
          key={v.group.id}
          style={{
            marginBottom: "20px",
            backgroundColor: token.colorFillContent,
          }}
          bordered={false}
          bodyStyle={{ padding: "16px" }}
          onClick={() => {
            onClick(v);
          }}
        >
          <Card.Meta
            avatar={
              <Avatar
                shape="square"
                size={52}
                src={v.group.avatar || v.virtualRole.avatar || undefined}
              />
            }
            title={v.group.name}
            description={v.virtualRole.name}
          />
        </Card>
      ))}
    </>
  );
};
