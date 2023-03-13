import { ChatManagement } from "@/core/ChatManagement";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Tabs, TabsProps, theme } from "antd";

export const Setting = ({ chatMgt }: { chatMgt?: ChatManagement }) => {
  const { token } = theme.useToken();
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "助理",
      children: (
        <div
          style={{
            maxHeight: "70vh",
            width: "min(90vw, 500px)",
            overflow: "auto",
          }}
        >
          <Form.Item name="virtualRole.name" label="助理名称">
            <Input value={chatMgt?.virtualRole.name} />
          </Form.Item>
          <Form.Item name="name" label="助理设定">
            <Input.TextArea autoSize value={chatMgt?.virtualRole.bio} />
          </Form.Item>
          <Form.List
            name="chatMgt?.virtualRole.settings"
            initialValue={chatMgt?.virtualRole.settings}
            rules={[
              {
                validator: async (_, names) => {
                  if (!names || names.length < 2) {
                    return Promise.reject(new Error("At least 2 passengers"));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <div style={{ overflow: "auto" }}>
                {fields.map((field, index) => (
                  <Form.Item required={false} key={field.key}>
                    <Form.Item
                      {...field}
                      validateTrigger={["onChange", "onBlur"]}
                      noStyle
                    >
                      <Input
                        placeholder="追加内容"
                        value={chatMgt?.virtualRole.settings[index]}
                        suffix={
                          <MinusCircleOutlined
                            className="dynamic-delete-button"
                            onClick={() => {
                              chatMgt?.virtualRole.settings.splice(index, 1);
                              remove(field.name);
                            }}
                          />
                        }
                      />
                    </Form.Item>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => {
                      chatMgt?.virtualRole.settings.push("");
                      add();
                    }}
                    block
                    icon={<PlusOutlined />}
                  >
                    增加设定
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </div>
            )}
          </Form.List>
        </div>
      ),
    },
    {
      key: "2",
      label: "用户",
      children: <></>,
    },
    {
      key: "3",
      label: "设置",
      children: <></>,
    },
  ];
  return (
    <>
      <Form layout="vertical">
        <Tabs defaultActiveKey="1" items={items} />
      </Form>
    </>
  );
};
