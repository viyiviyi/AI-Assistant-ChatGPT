import { chatGptModels, useService } from "@/core/AiService/ServiceProvider";
import { BgImageStore } from "@/core/BgImageStore";
import { ChatContext, ChatManagement, noneChat } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { downloadJson } from "@/core/utils";
import {
  CaretRightOutlined,
  DownloadOutlined,
  GithubOutlined,
  UploadOutlined
} from "@ant-design/icons";
import {
  Button,
  Collapse,
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
  const [activityKey, setActivityKey] = useState<string[]>(["GPT"]);
  const router = useRouter();
  const { setBgConfig } = useContext(ChatContext);
  const { reloadService } = useService();
  const [models, setModels] = useState<string[]>(chatGptModels);
  const [nextChat, setNextChat] = useState<ChatManagement>();
  const [group_Avatar, setGroup_Avatar] = useState(chatMgt?.group.avatar);
  const [group_background, setGroup_background] = useState(
    chatMgt?.group.background
  );
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
    config_bot_type: "None" | "ChatGPT" | "Slack";
    config_channel_id: string;
    slack_claude_id: string;
    group_name: string;
    setting_slack_proxy_url: string;
    slack_user_token: string;
  }>();
  useEffect(() => {
    BgImageStore.getInstance().getBgImage().then(setBackground);
    // ApiClient.getModelList(
    //   form.getFieldValue("setting_apitoken") ||
    //     KeyValueData.instance().getApiKey(),
    //   form.getFieldValue("setting_baseurl") || chatMgt?.config.baseUrl
    // ).then((res) => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    chatMgt.config.baseUrl = values.setting_baseurl;
    chatMgt.config.disableStrikethrough = values.config_disable_strikethrough;
    chatMgt.config.botType = values.config_bot_type;
    chatMgt.config.cloudChannelId = values.config_channel_id;
    chatMgt.saveConfig();

    chatMgt.group.name = values.group_name;
    chatMgt.group.avatar = group_Avatar;
    chatMgt.group.background = group_background;
    chatMgt.saveGroup();
    BgImageStore.getInstance().setBgImage(background || "");
    setBgConfig(group_background || background);

    KeyValueData.instance().setApiKey(
      values.setting_apitoken,
      values.config_saveKey
    );
    KeyValueData.instance().setSlackClaudeId(
      values.slack_claude_id,
      values.config_saveKey
    );
    KeyValueData.instance().setSlackUserToken(
      values.slack_user_token,
      values.config_saveKey
    );
    KeyValueData.instance().setSlackProxyUrl(
      values.setting_slack_proxy_url,
      values.config_saveKey
    );
    reloadService(chatMgt);
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
          config_saveKey: true,
          config_disable_strikethrough: chatMgt?.config.disableStrikethrough,
          setting_baseurl: chatMgt?.config.baseUrl?.trim().replace(/\/$/, ""),
          config_bot_type: chatMgt?.config.botType,
          config_channel_id: chatMgt?.config.cloudChannelId?.trim(),
          slack_claude_id: KeyValueData.instance().getSlackClaudeId()?.trim(),
          slack_user_token: KeyValueData.instance().getSlackUserToken()?.trim(),
          setting_slack_proxy_url: KeyValueData.instance()
            .getSlackProxyUrl()
            .trim()
            ?.replace(/\/$/, ""),
          group_name: chatMgt?.group.name,
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
          <Form.Item label={"会话头像"}>
            <AvatarUpload
              avatar={group_Avatar || undefined}
              onSave={setGroup_Avatar}
            />
            <Button
              type="text"
              style={{ marginLeft: "1em" }}
              onClick={() => {
                setGroup_Avatar(undefined);
              }}
            >
              清除
            </Button>
          </Form.Item>
          <Form.Item style={{ flex: 1 }} name="group_name" label="会话名称">
            <Input />
          </Form.Item>
          <Form.Item label={"会话背景图片"}>
            <div style={{ width: "100%", display: "flex", gap: "10px" }}>
              <Upload
                accept=".png,.jpg,.gif"
                {...{
                  beforeUpload(file, FileList) {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = (event) => {
                      if (event.target?.result) {
                        setGroup_background(event.target?.result.toString());
                      }
                    };
                    return false;
                  },
                  defaultFileList: [],
                  showUploadList: false,
                }}
              >
                <Button block style={{ width: "min(220px, 40vw)" }}>
                  设置
                </Button>
              </Upload>
              <Button
                style={{ flex: 1 }}
                onClick={() => {
                  setGroup_background(undefined);
                }}
              >
                清除
              </Button>
            </div>
          </Form.Item>
          <Form.Item>
            <Button.Group style={{ width: "100%" }}>
              <Button
                block
                onClick={() => {
                  let _chat = chatMgt!.toJson();
                  _chat.group.background = undefined;
                  downloadJson(JSON.stringify(_chat), chatMgt!.group.name);
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
                          const chat = nextChat || noneChat;
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
              <Button
                block
                // danger={true}
                style={{ borderColor: "#ff8d8e44" }}
                onClick={(e) => {
                  modal.confirm({
                    title: "确定删除？",
                    content: "删除操作不可逆，请谨慎操作。",
                    onOk: () => {
                      ChatManagement.remove(chatMgt!.group.id).then(() => {
                        router.push("/chat");
                        onCancel();
                      });
                    },
                  });
                }}
              >
                删除会话
              </Button>
            </Button.Group>
          </Form.Item>
          <Form.Item
            name="config_bot_type"
            label="Ai类型"
            extra="包含了一个临时开放且每天全局限制请求次数免费的GPT服务"
          >
            <Select style={{ width: "100%" }}>
              <Select.Option value="None">不启用AI</Select.Option>
              <Select.Option value="ChatGPT">ChatGPT</Select.Option>
              <Select.Option value="Slack">Slack(Claude)</Select.Option>
              <Select.Option value="GPTFree">ChatGPT(免费)</Select.Option>
            </Select>
          </Form.Item>
          <div style={{ width: "100%", display: "flex", gap: "10px" }}>
            <Form.Item
              style={{ flex: "1" }}
              name="config_disable_strikethrough"
              valuePropName="checked"
              label="禁用删除线"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              style={{ flex: "1" }}
              name="config_saveKey"
              valuePropName="checked"
              label="保存秘钥到浏览器"
            >
              <Switch />
            </Form.Item>
          </div>
          <Collapse
            // ghost
            bordered={false}
            activeKey={activityKey}
            onChange={(keys) => setActivityKey(keys as string[])}
            defaultActiveKey={"GPT"}
            expandIcon={({ isActive }) => (
              <CaretRightOutlined rotate={isActive ? 90 : 0} />
            )}
          >
            <Collapse.Panel
              key={"GPT"}
              header={"GPT配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item label="模型名称" name={"GptConfig_model"}>
                <Select options={models.map((v) => ({ value: v, label: v }))} />
              </Form.Item>
              <Form.Item
                name="GptConfig_msgCount"
                label="上下文数量"
                extra="对话模式下发送的最大前文数量，0表示全部，用于减少token消耗，搭配追加设定可以实现超长对话。每条消息也可以被单独勾选，可以不受此设置限制作为对话上下文发送。"
              >
                <Input.TextArea autoSize />
              </Form.Item>
              <Form.Item
                name="setting_baseurl"
                label="ChatGPT参数： 接口访问地址"
                extra="api代理地址 (反向代理了 https://api.openai.com 的地址)"
              >
                <Input type="text" placeholder="https://xxxx.xx.xx" />
              </Form.Item>
              <Form.Item
                name="setting_apitoken"
                label="OpenApi Key (全局生效)"
                extra={<span>请填写自己的key，没有key将不能使用。</span>}
              >
                <Input type="password" autoComplete="false" />
              </Form.Item>
            </Collapse.Panel>
            <Collapse.Panel
              key={"GPT_Args"}
              header={"GPT参数配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item
                name="GptConfig_role"
                label="ChatGPT参数： role"
                extra={" 用户使用的角色 建议使用user"}
              >
                <Radio.Group style={{ width: "100%" }}>
                  <Radio.Button value="assistant">assistant</Radio.Button>
                  <Radio.Button value="system">system</Radio.Button>
                  <Radio.Button value="user">user</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="GptConfig_max_tokens"
                label="ChatGPT参数： max_tokens"
                extra="指定生成文本的最大长度，不是字数；设为0表示不指定，使用官方默认值；GPT3最大4K，GPT4最大8K；GPT432k最大32K"
              >
                <InputNumber step="50" min={0} />
              </Form.Item>
              <Form.Item
                name="GptConfig_top_p"
                label="ChatGPT参数： top_p"
                extra={"指定从概率分布中选择的标记的概率阈值（不懂）"}
              >
                <InputNumber step="0.05" min={0} max={1} />
              </Form.Item>
              <Form.Item
                name="GptConfig_n"
                label="ChatGPT参数： n"
                extra={"指定生成文本的数量"}
              >
                <InputNumber step="1" min={1} max={10} />
              </Form.Item>
              <Form.Item
                name="GptConfig_temperature"
                label="ChatGPT参数： temperature"
                extra={"较高的值会产生更多样化的文本"}
              >
                <InputNumber step="0.05" min={0} max={1} />
              </Form.Item>
            </Collapse.Panel>
            <Collapse.Panel
              key={"Slack"}
              header={"Slack配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item
                name="config_channel_id"
                label="Slack配置：频道id (channel_id)"
                extra="获取方式参考： https://github.com/bincooo/claude-api/tree/main 和获取Claude的差不多"
              >
                <Input type="text" />
              </Form.Item>
              <Form.Item
                name="setting_slack_proxy_url"
                label="Slack配置： 接口访问地址 (全局生效)"
                extra="api代理地址 (反向代理了 https://slack.com 的地址)"
              >
                <Input type="text" placeholder="https://xxxx.xx.xx" />
              </Form.Item>
              <Form.Item
                name="slack_user_token"
                label="Slack配置：用户token (user-token) (全局生效)"
                extra="获取方式参考： https://github.com/bincooo/claude-api/tree/main"
              >
                <Input type="text" />
              </Form.Item>
              <Form.Item
                name="slack_claude_id"
                label="Slack配置：ClaudeID (全局生效)"
                extra="获取方式参考： https://github.com/bincooo/claude-api/tree/main"
              >
                <Input type="text" />
              </Form.Item>
            </Collapse.Panel>
            <Collapse.Panel
              key={"Glabal"}
              header={"全局设置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item label={"全局背景图片"}>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    gap: "10px",
                  }}
                >
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
                    <Button block style={{ width: "min(220px, 40vw)" }}>
                      设置
                    </Button>
                  </Upload>
                  <Button
                    style={{ flex: "1" }}
                    onClick={() => {
                      setBackground("");
                    }}
                  >
                    清除
                  </Button>
                </div>
              </Form.Item>
            </Collapse.Panel>
          </Collapse>
          <Form.Item></Form.Item>
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
