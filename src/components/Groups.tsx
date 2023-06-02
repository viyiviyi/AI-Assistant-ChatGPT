import { IChat } from "@/core/ChatManagement";
import { Avatar, Card, theme } from "antd";

export const Groups = ({
  groups,
  onClick,
}: {
  groups: IChat[];
  onClick: (chat: IChat) => void;
}) => {
  const { token } = theme.useToken();
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
