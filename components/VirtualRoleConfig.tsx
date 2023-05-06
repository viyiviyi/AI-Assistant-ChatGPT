import { ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { VirtualRole } from "@/Models/DataBase";
import {
  MenuOutlined,
  MinusCircleOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { Button, Form, Input, Popconfirm, Space, Switch, theme } from "antd";
import { useState } from "react";
import AvatarUpload from "./AvatarUpload";

let copyRoleVal: VirtualRole | undefined = undefined;

export const VirtualRoleConfig = ({
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
  const { token } = theme.useToken();
  const [form] = Form.useForm<{
    virtualRole_name: string;
    virtualRole_bio: string;
    virtualRole_settings: string[];
    virtualRole_enable: boolean;
    virtualRole_en_name: string;
    user_name: string;
    user_bio: string;
    user_en_name: string;
  }>();

  function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.virtualRole.name = values.virtualRole_name;
    chatMgt.virtualRole.bio = values.virtualRole_bio;
    chatMgt.virtualRole.settings = values.virtualRole_settings
      .map((v) => v?.trim())
      .filter((f) => f);
    chatMgt.virtualRole.avatar = virtualRole_Avatar || "";
    chatMgt.virtualRole.enName = values.virtualRole_en_name;
    chatMgt.saveVirtualRoleBio();

    chatMgt.config.enableVirtualRole = values.virtualRole_enable;
    chatMgt.saveConfig();

    chatMgt.user.name = values.user_name;
    chatMgt.user.bio = values.user_bio;
    chatMgt.user.enName = values.user_en_name;
    chatMgt.user.avatar = user_Avatar || "";
    chatMgt.saveUser();
    onSaved();
  }
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
          virtualRole_enable: chatMgt?.config.enableVirtualRole,
          virtualRole_en_name: chatMgt?.virtualRole.enName,
          user_name: chatMgt?.user.name,
          user_bio: chatMgt?.user.bio,
          user_en_name: chatMgt?.user.enName,
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
          <Space size={32}>
            <Form.Item
              name="virtualRole_enable"
              label="启用助理"
              valuePropName="checked"
            >
              <Switch></Switch>
            </Form.Item>
            <Form.Item name="virtualRole_copy" label="复制配置">
              <Button.Group>
                <Button
                  onClick={() => {
                    copyRoleVal = JSON.parse(
                      JSON.stringify(chatMgt?.virtualRole)
                    );
                  }}
                >
                  复制
                </Button>
                <Button
                  disabled={!copyRoleVal}
                  onClick={() => {
                    form.setFieldValue("virtualRole_name", copyRoleVal?.name);
                    form.setFieldValue("virtualRole_bio", copyRoleVal?.bio);
                    form.setFieldValue(
                      "virtualRole_settings",
                      copyRoleVal?.settings
                    );
                  }}
                >
                  粘贴
                </Button>
              </Button.Group>
            </Form.Item>
          </Space>
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
          <Form.Item name="user_bio" label="用户简介" extra="当简介不为空时，会在设定后面追加用户设定，可能导致助理设定异常">
            <Input.TextArea autoSize />
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
