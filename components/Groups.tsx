import { ChatManagement, IChat } from "@/core/ChatManagement";
import { Avatar, Card } from "antd";
import { useRouter } from "next/router";

export const Groups = ({ groups }: { groups: IChat[] }) => {
  const router = useRouter();
  return (
    <>
      {groups.map((v, idx) => (
        <Card
          key={idx}
          style={{ marginBottom: "20px" }}
          bodyStyle={{ padding: "16px" }}
          onClick={() => {
            ChatManagement.toFirst(v.group).then(() => {
              router.push("/chat?id=" + v.group.id);
            });
          }}
        >
          <Card.Meta
            avatar={
              <Avatar
                shape="square"
                size={60}
                src={v.group.avatar || v.virtualRole.avatar}
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
