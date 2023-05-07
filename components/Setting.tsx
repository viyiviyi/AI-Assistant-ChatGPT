import { ApiClient } from "@/core/ApiClient";
import { BgImage } from "@/core/BgImage";
import {
  ChatContext,
  ChatManagement,
  defaultChat
} from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { downloadJson } from "@/core/utils";
import {
  DownloadOutlined,
  EyeOutlined,
  GithubOutlined,
  UploadOutlined
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Switch,
  theme,
  Upload
} from "antd";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import AvatarUpload from "./AvatarUpload";

export const Setting = ({
  chatMgt,
  onCancel,
  onSaved,
}: {
  chatMgt?: ChatManagement;
  onSaved: () => void;
  onCancel: () => void;
}) => {
  const [modal, contextHolder] = Modal.useModal();
  const router = useRouter();
  const { setBgConfig } = useContext(ChatContext);
  const [models, setModels] = useState<string[]>(ApiClient.textModels);
  const [balance, steBalance] = useState("");
  const [nextChat, setNextChat] = useState<ChatManagement>();
  const [group_Avatar, setGroup_Avatar] = useState(chatMgt?.group.avatar);
  const [background, setBackground] = useState<string>();
  const { token } = theme.useToken();
  const [form] = Form.useForm<{
    setting_apitoken: string;
    GptConfig_msgCount: number;
    GptConfig_role: "assistant" | "system" | "user";
    GptConfig_max_tokens: number;
    GptConfig_top_p: number;
    GptConfig_temperature: number;
    GptConfig_n: number;
    GptConfig_model: string;
    config_saveKey: boolean;
    config_disable_strikethrough: boolean;
    setting_baseurl: string;
    group_name: string;
    group_background?: string;
  }>();
  useEffect(() => {
    BgImage.getInstance().getBgImage().then(setBackground);
  }, []);
  async function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    if (nextChat) await chatMgt.fromJson(nextChat);
    chatMgt.gptConfig.model = values.GptConfig_model;
    chatMgt.gptConfig.n = values.GptConfig_n;
    chatMgt.gptConfig.max_tokens = values.GptConfig_max_tokens;
    chatMgt.gptConfig.role = values.GptConfig_role;
    chatMgt.gptConfig.msgCount = values.GptConfig_msgCount;
    chatMgt.gptConfig.temperature = values.GptConfig_temperature;
    chatMgt.gptConfig.top_p = values.GptConfig_top_p;
    chatMgt.saveGptConfig();

    chatMgt.config.saveKey = values.config_saveKey;
    chatMgt.config.baseUrl = values.setting_baseurl;
    chatMgt.config.disableStrikethrough = values.config_disable_strikethrough;
    chatMgt.saveConfig();

    chatMgt.group.name = values.group_name;
    chatMgt.group.avatar = group_Avatar;
    chatMgt.group.background = values.group_background;
    chatMgt.saveGroup();
    BgImage.getInstance().setBgImage(background || "");
    setBgConfig(chatMgt.group.background || background);

    KeyValueData.instance().setApiKey(
      values.setting_apitoken,
      values.config_saveKey
    );
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
          GptConfig_msgCount: chatMgt?.gptConfig.msgCount,
          GptConfig_role: chatMgt?.gptConfig.role,
          GptConfig_max_tokens: chatMgt?.gptConfig.max_tokens,
          GptConfig_top_p: chatMgt?.gptConfig.top_p,
          GptConfig_temperature: chatMgt?.gptConfig.temperature,
          GptConfig_n: chatMgt?.gptConfig.n,
          GptConfig_model: chatMgt?.gptConfig.model,
          config_saveKey: chatMgt?.config.saveKey,
          config_disable_strikethrough: chatMgt?.config.disableStrikethrough,
          setting_baseurl: chatMgt?.config.baseUrl,
          group_name: chatMgt?.group.name,
          group_background: chatMgt?.group.background,
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            <a
              href="https://github.com/viyiviyi/ChatGpt-lite-chat-web"
              rel="noopener noreferrer"
              target={"_blank"}
            >
              <GithubOutlined size={64} />
            </a>
          </div>
          <Form.Item>
            <Upload
              accept=".png,.jpg,.gif"
              {...{
                beforeUpload(file, FileList) {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onloadend = (event) => {
                    if (event.target?.result) {
                      setBackground(event.target?.result.toString());
                    }
                  };
                  return false;
                },
                defaultFileList: [],
                showUploadList: false,
              }}
            >
              <Button type="text">设置全局背景图片</Button>
            </Upload>
            <Button
              type="text"
              onClick={() => {
                setBackground("");
              }}
            >
              清除
            </Button>
          </Form.Item>
          <Form.Item>
            <Upload
              accept=".png,.jpg,.gif"
              {...{
                beforeUpload(file, FileList) {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onloadend = (event) => {
                    if (event.target?.result) {
                      form.setFieldValue(
                        "group_background",
                        event.target?.result.toString()
                      );
                    }
                  };
                  return false;
                },
                defaultFileList: [],
                showUploadList: false,
              }}
            >
              <Button type="text">设置会话背景图片</Button>
            </Upload>
            <Button
              type="text"
              onClick={() => {
                form.setFieldValue("group_background", undefined);
              }}
            >
              清除
            </Button>
          </Form.Item>

          <Form.Item>
            <AvatarUpload avatar={group_Avatar} onSave={setGroup_Avatar} />
          </Form.Item>
          <Form.Item style={{ flex: 1 }} name="group_name" label="会话名称">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button.Group>
              <Button
                block
                onClick={() => {
                  let _chat = chatMgt!.toJson();
                  _chat.group.background = undefined;
                  downloadJson(
                    JSON.stringify(_chat),
                    chatMgt!.group.name
                  );
                }}
              >
                <DownloadOutlined key="download" />
                备份会话
              </Button>
              <Button block>
                <Upload
                  accept=".json"
                  {...{
                    beforeUpload(file, FileList) {
                      const fr = new FileReader();
                      fr.onloadend = (e) => {
                        if (e.target?.result) {
                          const chat =
                            nextChat || new ChatManagement(defaultChat);
                          chat
                            .fromJson(JSON.parse(e.target.result.toString()))
                            .then();
                          setNextChat(chat);
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
                  还原会话
                </Upload>
              </Button>
            </Button.Group>
          </Form.Item>
          <Form.Item label="模型名称" name={"GptConfig_model"}>
            <Select
              style={{ width: "160px" }}
              options={models.map((v) => ({ value: v, label: v }))}
            />
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
            name="config_disable_strikethrough"
            valuePropName="checked"
            label="禁用删除线 (使用中文～替换了~)"
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
              label="role  用户使用的角色 建议使用user"
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
          <Form.Item>
            <Button
              block
              style={{ marginTop: "20px" }}
              danger={true}
              onClick={(e) => {
                modal.confirm({
                  title: "确定删除？",
                  content: "删除操作不可逆，请谨慎操作。",
                  onOk: () => {
                    ChatManagement.remove(chatMgt!.group.id).then(() => {
                      router.push("/chat");
                    });
                  },
                });
              }}
            >
              删除
            </Button>
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
        {contextHolder}
      </Form>
    </>
  );
};
