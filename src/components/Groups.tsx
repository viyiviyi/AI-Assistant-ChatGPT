import { ChatManagement, IChat } from "@/core/ChatManagement";
import { Avatar, Card, theme } from "antd";

export const Groups = ({ onClick }: { onClick: (chat: IChat) => void }) => {
  const { token } = theme.useToken();
  return (
    <>
      {ChatManagement.getGroups().map((v, idx) => (
        <Card
          size={"small"}
          key={v.group.id}
          style={{
            marginBottom: "20px",
            backgroundColor: token.colorFillContent,
          }}
          bordered={false}
          bodyStyle={{ padding: 10 }}
          onClick={() => {
            onClick(v);
          }}
        >
          <div style={{ display: "flex" }}>
            <Avatar
              shape="square"
              size={52}
              src={v.group.avatar || v.virtualRole.avatar || undefined}
            />
            <div style={{marginLeft:8}}>
              <h3>{v.group.name}</h3>
              <h4 style={{ color: token.colorTextDescription }}>
                {v.virtualRole.name}
              </h4>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};
