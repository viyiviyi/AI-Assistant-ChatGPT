import { ChatManagement } from "@/core/ChatManagement";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Radio,
  Tabs,
  TabsProps,
  theme,
} from "antd";

export const Setting = ({
  chatMgt,
  onCancel,
  onSaved,
}: {
  chatMgt?: ChatManagement;
  onSaved: () => void;
  onCancel: () => void;
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm<{
    virtualRole_name: string;
    virtualRole_bio: string;
    virtualRole_settings: string[];
    user_name: string;
    user_bio: string;
    setting_apitoken: string;
    GptConfig_msgCount: number;
    GptConfig_role: "assistant" | "system" | "user";
    GptConfig_max_tokens: number;
    GptConfig_top_p: number;
    GptConfig_temperature: number;
  }>();
  function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.virtualRole.name = values.virtualRole_name;
    chatMgt.virtualRole.bio = values.virtualRole_bio;
    chatMgt.virtualRole.settings =
      values.virtualRole_settings?.filter((f) => f) || [];
    chatMgt.user.name = values.user_name;
    chatMgt.user.bio = values.user_bio;
    chatMgt.gptConfig.max_tokens = values.GptConfig_max_tokens;
    chatMgt.gptConfig.role = values.GptConfig_role;
    chatMgt.gptConfig.msgCount = values.GptConfig_msgCount;
    chatMgt.gptConfig.temperature = values.GptConfig_temperature;
    chatMgt.gptConfig.top_p = values.GptConfig_top_p;
    onSaved();
  }
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
          <Form.Item name="virtualRole_name" label="助理名称">
            <Input />
          </Form.Item>
          <Form.Item
            name="virtualRole_bio"
            label="助理设定"
            extra="当助理模式开启时，所有发送的内容都将以此内容开头"
          >
            <Input.TextArea autoSize />
          </Form.Item>
          <Form.List
            name="virtualRole_settings"
            initialValue={chatMgt?.virtualRole.settings}
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
                <Form.Item extra="当助理模式开启时，这些内容将追加在设定后面">
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
      children: (
        <>
          <div
            style={{
              maxHeight: "70vh",
              width: "min(90vw, 500px)",
              overflow: "auto",
            }}
          >
            <Form.Item name="user_name" label="用户名称">
              <Input />
            </Form.Item>
            <Form.Item name="user_bio" label="用户简介">
              <Input.TextArea autoSize />
            </Form.Item>
          </div>
        </>
      ),
    },
    {
      key: "3",
      label: "设置",
      children: (
        <>
          <div
            style={{
              maxHeight: "70vh",
              width: "min(90vw, 500px)",
              overflow: "auto",
            }}
          >
            <Form.Item
              name="setting_apitoken"
              label="openapi token"
              extra="当该项有值时，将从浏览器直接访问接口，请保持网络可用（功能还没写）"
            >
              <Input type="password" />
            </Form.Item>
            <Form.Item
              name="GptConfig_msgCount"
              label="上下文数量"
              extra="对话模式下发送的最大前文数量，0表示全部"
            >
              <Input.TextArea autoSize />
            </Form.Item>
            <Form.Item label="接口参数">
              <Form.Item name="GptConfig_role" label="role">
                <Radio.Group>
                  <Radio.Button value="assistant">assistant</Radio.Button>
                  <Radio.Button value="system">system</Radio.Button>
                  <Radio.Button value="user">user</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="GptConfig_max_tokens" label="max_tokens">
                <InputNumber step="50" min={50} max={2048} />
              </Form.Item>
              <Form.Item name="GptConfig_top_p" label="top_p">
                <InputNumber step="0.1" min={0} max={1} />
              </Form.Item>
              <Form.Item name="GptConfig_temperature" label="max_tokens">
                <InputNumber step="0.1" min={0} max={1} />
              </Form.Item>
            </Form.Item>
          </div>
        </>
      ),
    },
  ];
  return (
    <>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={{
          virtualRole_name: chatMgt?.virtualRole.name,
          virtualRole_bio: chatMgt?.virtualRole.bio,
          virtualRole_settings: chatMgt?.virtualRole.settings,
          user_name: chatMgt?.user.name,
          user_bio: chatMgt?.user.bio,
          setting_apitoken: "",
          GptConfig_msgCount: chatMgt?.gptConfig.msgCount,
          GptConfig_role: chatMgt?.gptConfig.role,
          GptConfig_max_tokens: chatMgt?.gptConfig.max_tokens,
          GptConfig_top_p: chatMgt?.gptConfig.top_p,
          GptConfig_temperature: chatMgt?.gptConfig.temperature,
        }}
      >
        <Tabs defaultActiveKey="1" items={items} />
        <Button.Group style={{ width: "100%" }}>
          <Button
            block
            style={{ marginTop: "20px" }}
            onClick={(e) => {
              onCancel();
            }}
          >
            关闭
          </Button>
          <Button
            block
            style={{ marginTop: "20px" }}
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
          >
            保存
          </Button>
        </Button.Group>
      </Form>
    </>
  );
};
