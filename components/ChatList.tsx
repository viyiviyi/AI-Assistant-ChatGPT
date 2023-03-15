import { ChatManagement } from "@/core/ChatManagement";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  message,
  theme,
  Typography,
  Upload,
  UploadProps,
} from "antd";
import { useState } from "react";

export const ChatList = ({
  onSelected,
  onCacle,
}: {
  onCacle: () => void;
  onSelected: (chatMgt: ChatManagement) => void;
}) => {
  const { token } = theme.useToken();
  const [groups, setGroups] = useState<ChatManagement[]>(
    ChatManagement.getList()
  );
  async function create() {
    await ChatManagement.provide().then(onSelected);
  }

  return (
    <>
      <div
        style={{
          padding: token.paddingSM,
          width: "min(90vw, 460px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "auto",
            marginBottom: "20px",
            paddingRight: "10px",
          }}
        >
          {groups.map((v, idx) => (
            <Card
              key={idx}
              actions={[
                <DownloadOutlined
                  key="download"
                  onClick={() => {
                    downloadJson(
                      v.toJson(),
                      v.group.name + "_" + v.virtualRole.name
                    );
                  }}
                />,
                <Upload
                  {...{
                    beforeUpload(file, FileList) {
                      const fr = new FileReader();
                      fr.onloadend = (e) => {
                        if (e.target?.result) {
                          v.fromJson(e.target.result.toString());
                          setGroups([...ChatManagement.getList()]);
                          onSelected(v)
                        }
                      };
                      fr.readAsText(file);
                      return false;
                    },
                    defaultFileList: [],
                    showUploadList: false,
                  }}
                >
                  <UploadOutlined key="upload" />
                </Upload>,
                <CheckOutlined
                  key="selected"
                  onClick={() => {
                    onSelected(v);
                  }}
                />,
                <DeleteOutlined
                  key="delete"
                  onClick={() => {
                    v.remove().then(() => {
                      setGroups([...ChatManagement.getList()]);
                    });
                  }}
                />,
              ]}
              style={{ marginBottom: "20px" }}
            >
              <Card.Meta
                avatar={<Avatar src={v.virtualRole.avatar} />}
                title={
                  <Typography.Title
                    level={5}
                    editable={{
                      onChange: (val) => {
                        v.group.name = val;
                      },
                      onCancel: () => {
                        setGroups([...ChatManagement.getList()]);
                      },
                    }}
                  >
                    {v.group.name}
                  </Typography.Title>
                }
                description={v.virtualRole.name}
              />
            </Card>
          ))}
        </div>

        <Button
          block
          onClick={(e) => {
            e.stopPropagation();
            create().then(() => {
              setGroups([...ChatManagement.getList()]);
            });
          }}
        >
          <div>
            <span>新建</span>
          </div>
        </Button>
        <Button
          block
          style={{ marginTop: "10px", justifyContent: "center" }}
          onClick={() => onCacle()}
        >
          <span>关闭</span>
        </Button>
      </div>
    </>
  );
};
function downloadJson(jsonData: string, filename: string) {
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
