import { ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import {
  EyeOutlined,
  MenuOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import {
  Avatar,
  Button,
  Form,
  FormListFieldData,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Switch,
  theme,
} from "antd";
import AvatarUpload from "./AvatarUpload";
import { ApiClient } from "@/core/ApiClient";

function getLengthArray(len: number = 0): number[] {
  let arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
}

export const Setting = ({
  chatMgt,
  onCancel,
  onSaved,
}: {
  chatMgt?: ChatManagement;
  onSaved: () => void;
  onCancel: () => void;
}) => {
  const [virtualRole_Avatar, setVirtualRole_Avatar] = useState(
    chatMgt?.virtualRole.avatar
  );
  const [user_Avatar, setUser_Avatar] = useState(chatMgt?.user.avatar);
  const [balance, steBalance] = useState("");
  const { token } = theme.useToken();
  const [form] = Form.useForm<{
    virtualRole_name: string;
    virtualRole_bio: string;
    virtualRole_settings: string[];
    virtualRole_en_name: string;
    user_name: string;
    user_bio: string;
    user_en_name: string;
    setting_apitoken: string;
    GptConfig_msgCount: number;
    GptConfig_role: "assistant" | "system" | "user";
    GptConfig_max_tokens: number;
    GptConfig_top_p: number;
    GptConfig_temperature: number;
    config_saveKey: boolean;
    setting_baseurl: string;
    GptConfig_n: number;
  }>();

  function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.virtualRole.name = values.virtualRole_name;
    chatMgt.virtualRole.bio = values.virtualRole_bio;
    chatMgt.virtualRole.settings = values.virtualRole_settings
      .map((v) => v?.trim())
      .filter((f) => f);
    chatMgt.virtualRole.avatar = virtualRole_Avatar;
    chatMgt.virtualRole.enName = values.virtualRole_en_name;
    chatMgt.saveVirtualRoleBio();

    chatMgt.gptConfig.n = values.GptConfig_n;
    chatMgt.gptConfig.max_tokens = values.GptConfig_max_tokens;
    chatMgt.gptConfig.role = values.GptConfig_role;
    chatMgt.gptConfig.msgCount = values.GptConfig_msgCount;
    chatMgt.gptConfig.temperature = values.GptConfig_temperature;
    chatMgt.gptConfig.top_p = values.GptConfig_top_p;
    chatMgt.saveGptConfig();

    chatMgt.user.name = values.user_name;
    chatMgt.user.bio = values.user_bio;
    chatMgt.user.avatar = user_Avatar;
    chatMgt.user.enName = values.user_en_name;
    chatMgt.saveUser();

    chatMgt.config.saveKey = values.config_saveKey;
    chatMgt.config.baseUrl = values.setting_baseurl;
    chatMgt.saveConfig();

    KeyValueData.instance().setApiKey(
      values.setting_apitoken,
      values.config_saveKey
    );
    onSaved();
  }
  let roleNames = Object.keys(chatMgt?.virtualRoles || {}).map((key) => {
    return chatMgt?.virtualRoles[key];
  });
  return (
    <>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={{
          setting_apitoken: KeyValueData.instance().getApiKey(),
          virtualRole_name: chatMgt?.virtualRole.name,
          virtualRole_bio: chatMgt?.virtualRole.bio,
          virtualRole_settings: chatMgt?.virtualRole.settings,
          virtualRole_en_name: chatMgt?.virtualRole.enName,
          user_name: chatMgt?.user.name,
          user_bio: chatMgt?.user.bio,
          user_en_name: chatMgt?.user.enName,
          GptConfig_msgCount: chatMgt?.gptConfig.msgCount,
          GptConfig_role: chatMgt?.gptConfig.role,
          GptConfig_max_tokens: chatMgt?.gptConfig.max_tokens,
          GptConfig_top_p: chatMgt?.gptConfig.top_p,
          GptConfig_temperature: chatMgt?.gptConfig.temperature,
          GptConfig_n: chatMgt?.gptConfig.n,
          config_saveKey: chatMgt?.config.saveKey,
          setting_baseurl: chatMgt?.config.baseUrl,
        }}
      >
        <div
          style={{
            maxHeight: "70vh",
            width: "min(90vw, 500px)",
            overflow: "auto",
            padding: token.paddingContentHorizontalSM + "px",
          }}
        >
          <Form.Item>
            <AvatarUpload
              avatar={virtualRole_Avatar}
              onSave={setVirtualRole_Avatar}
            />
          </Form.Item>
          <div style={{ width: "100%", display: "flex", gap: "10px" }}>
            <Form.Item
              style={{ flex: 1 }}
              name="virtualRole_name"
              label="助理名称"
            >
              <Input />
            </Form.Item>
            <Form.Item
              style={{ flex: 1 }}
              name="virtualRole_en_name"
              label="英文名称;用于区分角色"
              rules={[
                {
                  type: "string",
                  pattern: /^[a-zA-Z0-9]+$/,
                  message: "只能使用大小写字母和数字",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            name="virtualRole_bio"
            label="助理设定"
            extra="当助理模式开启时，所有发送的内容都将以此内容开头"
          >
            <Input.TextArea autoSize />
          </Form.Item>
          <Form.List name="virtualRole_settings">
            {(fields, { add, remove }, { errors }) => {
              return (
                <div style={{ overflow: "auto" }}>
                  {fields.map((field, index) => {
                    return (
                      <Form.Item
                        required={false}
                        key={field.key}
                        style={{ position: "relative" }}
                      >
                        <Popconfirm
                          icon={<></>}
                          placement="topLeft"
                          title="移动顺序"
                          onConfirm={() => {
                            let val =
                              form.getFieldsValue().virtualRole_settings &&
                              form.getFieldsValue().virtualRole_settings[index];
                            remove(index);
                            add(val, Math.max(index - 1, 0));
                          }}
                          onCancel={() => {
                            let val =
                              form.getFieldsValue().virtualRole_settings &&
                              form.getFieldsValue().virtualRole_settings[index];
                            remove(index);
                            add(val, Math.min(index + 1, fields.length - 1));
                          }}
                          okText="上移"
                          cancelText="下移"
                        >
                          <MenuOutlined
                            className="dynamic-delete-button"
                            style={{
                              padding: ".5em",
                              position: "absolute",
                              left: "0",
                              top: "2px",
                              zIndex: 1,
                            }}
                          />
                        </Popconfirm>
                        <Form.Item
                          {...field}
                          validateTrigger={["onChange", "onBlur"]}
                          noStyle
                        >
                          <Input.TextArea
                            placeholder="追加内容"
                            autoSize
                            style={{ paddingRight: "2em", paddingLeft: "2em" }}
                          />
                        </Form.Item>
                        <Popconfirm
                          title="确定删除？"
                          placement="topRight"
                          onConfirm={() => {
                            remove(index);
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <MinusCircleOutlined
                            className="dynamic-delete-button"
                            style={{
                              padding: ".5em",
                              position: "absolute",
                              right: "0",
                              top: "2px",
                            }}
                          />
                        </Popconfirm>
                      </Form.Item>
                    );
                  })}
                  <Form.Item extra="当助理模式开启时，这些内容将追加在设定后面，以/开头表示内容是机器人发出的">
                    <Button
                      type="dashed"
                      onClick={() => {
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
              );
            }}
          </Form.List>
          <Form.Item>
            <AvatarUpload avatar={user_Avatar} onSave={setUser_Avatar} />
          </Form.Item>
          <div style={{ width: "100%", display: "flex", gap: "10px" }}>
            <Form.Item style={{ flex: 1 }} name="user_name" label="用户名称">
              <Input />
            </Form.Item>
            <Form.Item
              style={{ flex: 1 }}
              name="user_en_name"
              label="英文名称;用于区分角色"
              rules={[
                {
                  type: "string",
                  pattern: /^[a-zA-Z0-9]+$/,
                  message: "只能使用大小写字母和数字",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="user_bio" label="用户简介">
            <Input.TextArea autoSize />
          </Form.Item>
          <Form.Item
            name="setting_apitoken"
            label="openapi key"
            extra={
              <span>
                请填写自己的key，没有key将不能使用。
                <span>
                  余额：{balance || ""}
                  <span style={{ marginLeft: "1em" }}>
                    <Button
                      type={"ghost"}
                      onClick={() => {
                        ApiClient.getOpanAIBalance(
                          KeyValueData.instance().getApiKey(),
                          chatMgt?.config.baseUrl
                        ).then((res) => {
                          steBalance(res);
                        });
                      }}
                    >
                      <EyeOutlined />
                    </Button>
                  </span>
                </span>
              </span>
            }
          >
            <Input type="password" />
          </Form.Item>
          <Form.Item
            name="config_saveKey"
            valuePropName="checked"
            label="保存key到浏览器（不加密，请在私人设备时才勾选）"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="setting_baseurl"
            label="接口访问地址"
            extra="api代理地址 (反向代理了 https://api.openai.com 的地址)"
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item
            name="GptConfig_msgCount"
            label="上下文数量"
            extra="对话模式下发送的最大前文数量，0表示全部，用于减少token消耗，搭配追加设定可以实现超长对话。每条消息也可以被单独勾选，可以不受此设置限制作为对话上下文发送。"
          >
            <Input.TextArea autoSize />
          </Form.Item>
          <Form.Item label="接口参数">
            <Form.Item
              name="GptConfig_role"
              label="role  指定对话角色，用于区分对话的用户 不建议使用user"
            >
              <Radio.Group>
                <Radio.Button value="assistant">assistant</Radio.Button>
                <Radio.Button value="system">system</Radio.Button>
                <Radio.Button value="user">user</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="GptConfig_max_tokens"
              label="max_tokens 指定生成文本的最大长度，不是字数；设为0表示不指定，使用官方默认值；GPT3最大4K，GPT4最大8K；GPT432k最大32K"
            >
              <InputNumber step="50" min={0} />
            </Form.Item>
            <Form.Item
              name="GptConfig_top_p"
              label="top_p 指定从概率分布中选择的标记的概率阈值（不懂）"
            >
              <InputNumber step="0.05" min={0} max={1} />
            </Form.Item>
            <Form.Item name="GptConfig_n" label="n 指定生成文本的数量">
              <InputNumber step="1" min={1} max={10} />
            </Form.Item>
            <Form.Item
              name="GptConfig_temperature"
              label="temperature 较高的值会产生更多样化的文本"
            >
              <InputNumber step="0.05" min={0} max={1} />
            </Form.Item>
          </Form.Item>
        </div>
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
