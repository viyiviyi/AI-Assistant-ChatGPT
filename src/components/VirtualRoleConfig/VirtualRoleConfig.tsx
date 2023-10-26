import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/db/KeyValueData";
import { useScreenSize } from "@/core/hooks/hooks";
import { getUuid } from "@/core/utils";
import { VirtualRole } from "@/Models/DataBase";
import {
  Button,
  Dropdown,
  Form,
  Input,
  message,
  Space,
  Switch,
  Tabs,
  theme
} from "antd";
import copy from "copy-to-clipboard";
import { CSSProperties, useContext, useMemo, useState } from "react";
import ImageUpload from "../common/ImageUpload";
import { Modal, ModalCallback } from "../common/Modal";
import { VirtualRoleConfigInfo } from "./VirtualRoleConfigInfo";
import { VirtualRoleConfigList } from "./VirtualRoleConfigList";

let copyRoleVal: VirtualRole | undefined = undefined;

export const VirtualRoleConfig = ({
  chatMgt,
  cbs,
}: {
  chatMgt?: ChatManagement;
  cbs: ModalCallback;
}) => {
  const [virtualRole_Avatar, setVirtualRole_Avatar] = useState(
    chatMgt?.virtualRole.avatar
  );
  const [user_Avatar, setUser_Avatar] = useState(chatMgt?.user.avatar);
  const { token } = theme.useToken();
  const { setChat } = useContext(ChatContext);
  const [showInfo, setShowInfo] = useState(false);
  const screenSize = useScreenSize();
  const [form] = Form.useForm<{
    virtualRole_name: string;
    virtualRole_bio: string;
    virtualRole_enable: boolean;
    virtualRole_en_name: string;
    user_name: string;
    user_en_name: string;
  }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [virtualRole_settings, setVirtualRole_settings] = useState(
    chatMgt?.virtualRole.settings?.map((v, i) => ({
      ...v,
      ctx: v.ctx.map((c) => ({ ...c })),
      edit: false,
    })) || []
  );
  const currentSettings = useMemo(
    () => ({ current: virtualRole_settings }),
    [virtualRole_settings]
  );

  function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.virtualRole.name = values.virtualRole_name;
    chatMgt.virtualRole.bio = values.virtualRole_bio;
    (currentSettings.current || virtualRole_settings).forEach((v) =>
      v.ctx.forEach((c) => (c.content = c.content?.trim()))
    );
    chatMgt.virtualRole.settings = (
      currentSettings.current || virtualRole_settings
    )
      .filter((f) => f && (f.ctx.filter((_f) => _f.content).length || f.title))
      .map((v) => ({ ...v, edit: undefined }));
    chatMgt.virtualRole.avatar = virtualRole_Avatar || "";
    chatMgt.virtualRole.enName = values.virtualRole_en_name;
    chatMgt.saveVirtualRoleBio();

    chatMgt.config.enableVirtualRole = values.virtualRole_enable;
    chatMgt.saveConfig();

    chatMgt.user.name = values.user_name;
    chatMgt.user.enName = values.user_en_name;
    chatMgt.user.avatar = user_Avatar || "";
    chatMgt.saveUser();
    setChat(chatMgt.getChat());
  }
  cbs.current.okCallback = onSave;

  const tabItemStyle: CSSProperties = {
    maxHeight: screenSize.height - 300,
    overflow: "auto",
  };
  const VirtualRoleInfo = (
    <div style={{ ...tabItemStyle }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          gap: "10px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Form.Item>
            <ImageUpload
              avatar={virtualRole_Avatar || undefined}
              onSave={setVirtualRole_Avatar}
            />
          </Form.Item>
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
        <div>
          <Form.Item>
            <ImageUpload
              avatar={user_Avatar || undefined}
              onSave={setUser_Avatar}
            />
          </Form.Item>
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
      </div>
      <Form.Item
        name="virtualRole_bio"
        label="助理设定"
        extra="当助理模式开启时，所有发送的内容都将以此内容开头"
      >
        <Input.TextArea autoSize />
      </Form.Item>
    </div>
  );
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
          virtualRole_enable: chatMgt?.config.enableVirtualRole,
          virtualRole_en_name: chatMgt?.virtualRole.enName,
          user_name: chatMgt?.user.name,
          user_en_name: chatMgt?.user.enName,
        }}
      >
        {contextHolder}
        <div>
          <div
            style={{
              width: "100%",
              height: 54,
              position: "fixed",
              left: "0",
              top: "0",
            }}
            onClick={cbs.current.cancel}
          ></div>
          <Space size={32}>
            <Form.Item
              name="virtualRole_enable"
              label="启用"
              valuePropName="checked"
            >
              <Switch></Switch>
            </Form.Item>
            <Form.Item name="virtualRole_copy" label="操作">
              <Button.Group>
                <Button
                  onClick={() => {
                    copyRoleVal = JSON.parse(
                      JSON.stringify(chatMgt?.virtualRole)
                    );
                  }}
                >
                  {"复制"}
                </Button>
                <Button
                  disabled={!copyRoleVal}
                  onClick={() => {
                    form.setFieldValue("virtualRole_name", copyRoleVal?.name);
                    form.setFieldValue("virtualRole_bio", copyRoleVal?.bio);
                    setVirtualRole_Avatar(copyRoleVal?.avatar);
                    setVirtualRole_settings(
                      copyRoleVal?.settings?.map((v, i) => ({
                        ...v,
                        key: getUuid(),
                        edit: false,
                      })) || []
                    );
                  }}
                >
                  {"粘贴"}
                </Button>
                <Button
                  onClick={() => {
                    setShowInfo(true);
                  }}
                >
                  {"预览"}
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "1",
                        label: (
                          <a
                            onClick={() => {
                              if (
                                copy(
                                  JSON.stringify(
                                    JSON.stringify(chatMgt?.virtualRole)
                                  )
                                )
                              ) {
                                messageApi.success("已复制");
                              }
                            }}
                          >
                            {"复制到剪切板"}
                          </a>
                        ),
                      },
                      {
                        key: "2",
                        label: (
                          <a
                            onClick={() => {
                              navigator?.clipboard.readText().then((text) => {
                                try {
                                  if (!text) return;
                                  let res: VirtualRole = JSON.parse(text);
                                  if (typeof res == "string")
                                    res = JSON.parse(res);
                                  form.setFieldValue(
                                    "virtualRole_name",
                                    res?.name
                                  );
                                  form.setFieldValue(
                                    "virtualRole_bio",
                                    res?.bio
                                  );
                                  setVirtualRole_Avatar(res?.avatar);
                                  setVirtualRole_settings(
                                    res?.settings?.map((v, i) => ({
                                      ...v,
                                      key: getUuid(),
                                      edit: false,
                                    })) || []
                                  );
                                } catch (err) {}
                              });
                            }}
                          >
                            {"从剪切板读取"}
                          </a>
                        ),
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <Button>{"更多"}</Button>
                </Dropdown>
              </Button.Group>
            </Form.Item>
            <Form.Item name={"VirtualRoleConfigInfo"}>
              <Modal
                open={showInfo}
                onCancel={() => {
                  setShowInfo(false);
                }}
                okText={null}
                bodyStyle={{
                  maxHeight: "calc(100vh - 200px)",
                  minHeight: "50vh",
                  overflow: "auto",
                  padding: 0,
                }}
                items={() => {
                  return (
                    <VirtualRoleConfigInfo
                      bio={form.getFieldValue("virtualRole_bio")}
                      settings={virtualRole_settings}
                    />
                  );
                }}
              ></Modal>
            </Form.Item>
          </Space>
          <Tabs
            type="card"
            defaultActiveKey="settings"
            style={{ minHeight: "calc(70vh - 118px)" }}
            items={[
              {
                label: `助理设定`,
                key: "virtualRole",
                forceRender: true,
                children: VirtualRoleInfo,
              },
              {
                label: `设定列表`,
                key: "settings",
                forceRender: true,
                children: (
                  <div style={{ ...tabItemStyle }}>
                    <VirtualRoleConfigList
                      currentSettings={currentSettings}
                      inputSettings={virtualRole_settings}
                    />
                  </div>
                ),
              },
              {
                label: `插件列表`,
                key: "extensions_cloud",
                forceRender: true,
                children: <div>功能未完成，占个地</div>,
              },
            ]}
          />
        </div>
      </Form>
    </>
  );
};
