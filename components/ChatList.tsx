import { ChatManagement, IChat } from "@/core/ChatManagement";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Popconfirm,
  theme,
  Typography,
  Upload,
} from "antd";
import { useEffect, useState } from "react";

export const ChatList = ({
  onSelected,
  onCacle,
}: {
  onCacle: () => void;
  onSelected: (chatMgt: IChat) => void;
}) => {
  const { token } = theme.useToken();
  const [groups, setGroups] = useState<ChatManagement[]>(
    ChatManagement.getGroups().map((v) => new ChatManagement(v))
  );
  async function create() {
    await ChatManagement.createChat().then(onSelected);
  }
  useEffect(() => {
    ChatManagement.load().then(() => {
      setGroups([
        ...ChatManagement.getGroups().map((v) => new ChatManagement(v)),
      ]);
    });
  }, []);

  return (
    <>
      <div
        style={{
          padding: token.paddingSM,
          width: "min(90vw, 460px)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100%",
        }}
      >
        <div
          style={{
            flex: 1,
            overflow: "auto",
            marginBottom: "20px",
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
                      JSON.stringify(v.toJson()),
                      v.group.name + "_" + v.virtualRole.name
                    );
                  }}
                />,
                <Upload
                  accept=".json"
                  {...{
                    beforeUpload(file, FileList) {
                      const fr = new FileReader();
                      fr.onloadend = (e) => {
                        if (e.target?.result) {
                          v.fromJson(JSON.parse(e.target.result.toString()));
                          setGroups([...groups]);
                          onSelected(v);
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
                    ChatManagement.loadMessage(v).then(() => onSelected(v));
                  }}
                />,
                <Popconfirm
                  title="确定删除？"
                  onConfirm={() => {
                    ChatManagement.remove(v).then(() => {
                      setGroups([
                        ...ChatManagement.getGroups().map(
                          (v) => new ChatManagement(v)
                        ),
                      ]);
                    });
                  }}
                  okText="确定"
                  cancelText="取消"
                >
                  <DeleteOutlined />
                </Popconfirm>,
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
                        v.saveGroup();
                        setGroups([...groups]);
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
              setGroups([
                ...ChatManagement.getGroups().map((v) => new ChatManagement(v)),
              ]);
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
