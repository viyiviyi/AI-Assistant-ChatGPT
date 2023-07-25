import {
  aiServerList,
  aiServices,
  aiServiceType,
  getServiceInstance,
  useService
} from "@/core/AiService/ServiceProvider";
import { BgImageStore } from "@/core/BgImageStore";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { getToken, saveToken } from "@/core/tokens";
import { downloadJson } from "@/core/utils";
import {
  CaretRightOutlined,
  DownloadOutlined,
  GithubOutlined,
  PlusOutlined,
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
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import wx from "../../public/images/微信收款码.png";
import zfb from "../../public/images/支付宝收款码.jpg";
import AvatarUpload from "./AvatarUpload";
import { downloadTopic } from "./Chat/ChatMessage";
import { MarkdownView } from "./Chat/MarkdownView";

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
  const [activityKey, setActivityKey] = useState<string[]>(["UI"]);
  const router = useRouter();
  const { setBgConfig, setChat } = useContext(ChatContext);
  const { reloadService } = useService();
  const [models, setModels] = useState<string[]>([]);
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
    config_bot_type: aiServiceType;
    config_channel_id: string;
    config_page_size: number;
    config_page_repect: number;
    config_limit_pre_height: boolean;
    setting_user_server_url: string;
    slack_claude_id: string;
    group_name: string;
    setting_slack_proxy_url: string;
    slack_user_token: string;
  }>();
  useEffect(() => {
    BgImageStore.getInstance().getBgImage().then(setBackground);
    let vals: { [key: string]: any } = {
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
      setting_user_server_url: chatMgt?.config.userServerUrl
        ?.trim()
        .replace(/\/$/, ""),
      config_bot_type: chatMgt?.config.botType,
      config_channel_id: chatMgt?.config.cloudChannelId?.trim(),
      config_page_size: chatMgt?.config.pageSize || 20,
      config_page_repect: chatMgt?.config.pageRepect || 10,
      config_limit_pre_height: chatMgt?.config.limitPreHeight,
      slack_claude_id: KeyValueData.instance().getSlackClaudeId()?.trim(),
      slack_user_token: KeyValueData.instance().getSlackUserToken()?.trim(),
      setting_slack_proxy_url: KeyValueData.instance()
        .getSlackProxyUrl()
        .trim()
        ?.replace(/\/$/, ""),
      group_name: chatMgt?.group.name,
    };
    aiServices.current?.models().then((res) => {
      setModels(res);
      if (!res.includes(chatMgt?.gptConfig.model || "") && res.length) {
        vals.GptConfig_model = res[0];
        form.setFieldsValue(vals);
      }
    });
    aiServerList.forEach((v) => {
      let t = getToken(v.key);
      vals["global_tokens_" + v.key] = t.tokens;
    });
    form.setFieldsValue(vals);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.gptConfig.model = values.GptConfig_model;
    chatMgt.gptConfig.n = values.GptConfig_n;
    chatMgt.gptConfig.max_tokens = values.GptConfig_max_tokens;
    chatMgt.gptConfig.role = values.GptConfig_role;
    chatMgt.gptConfig.msgCount = values.GptConfig_msgCount;
    chatMgt.gptConfig.temperature = values.GptConfig_temperature;
    chatMgt.gptConfig.top_p = values.GptConfig_top_p;
    chatMgt.saveGptConfig();

    chatMgt.config.baseUrl = values.setting_baseurl?.trim()?.replace(/\/$/, "");
    chatMgt.config.disableStrikethrough = values.config_disable_strikethrough;
    chatMgt.config.botType = values.config_bot_type;
    chatMgt.config.cloudChannelId = values.config_channel_id;
    chatMgt.config.userServerUrl = values.setting_user_server_url
      ?.trim()
      ?.replace(/\/$/, "");
    chatMgt.config.limitPreHeight = values.config_limit_pre_height;
    chatMgt.config.pageSize = values.config_page_size;
    chatMgt.config.pageRepect = values.config_page_repect;
    chatMgt.saveConfig();

    chatMgt.group.name = values.group_name;
    chatMgt.group.avatar = group_Avatar;
    chatMgt.group.background = group_background;
    chatMgt.saveGroup();
    BgImageStore.getInstance().setBgImage(background || "");
    setBgConfig(group_background || background);

    KeyValueData.instance().setApiKey("", false);
    KeyValueData.instance().setSlackClaudeId(
      values.slack_claude_id,
      values.config_saveKey
    );
    KeyValueData.instance().setSlackUserToken(
      values.slack_user_token,
      values.config_saveKey
    );
    KeyValueData.instance().setSlackProxyUrl(
      values.setting_slack_proxy_url?.trim()?.replace(/\/$/, ""),
      values.config_saveKey
    );
    aiServerList.forEach((v) => {
      let t = getToken(v.key);
      t.tokens =
        ((values as any)["global_tokens_" + v.key] as Array<string>)?.filter(
          (v) => v
        ) || [];
      if (!t.tokens.includes(t.current)) t.current = t.tokens[0];
      saveToken(v.key, t);
    });
    reloadService(chatMgt, KeyValueData.instance());
    setChat(new ChatManagement(chatMgt));
    onSaved();
  }
  return (
    <>
      <Form form={form} layout="vertical" autoComplete="off">
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
              href="https://github.com/viyiviyi/AI-Assistant-ChatGPT"
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
                  modal.confirm({
                    title: "可选择导出的文件类型",
                    content:
                      "Markdown格式是分开导出所有的话题，且不支持用于还原",
                    okText: "JSON",
                    cancelText: "Markdown",
                    onCancel: () => {
                      chatMgt?.topics.forEach((v) => {
                        ChatManagement.loadMessage(v).then((t) => {
                          downloadTopic(v, false, chatMgt);
                        });
                      });
                    },
                    onOk: () => {
                      let _chat = chatMgt!.toJson();
                      _chat.group.background = undefined;
                      downloadJson(JSON.stringify(_chat), chatMgt!.group.name);
                    },
                  });
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
                          chatMgt
                            ?.fromJson(JSON.parse(e.target.result.toString()))
                            .then((chat) => {
                              setChat(new ChatManagement(chat));
                              onCancel();
                            });
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
          <Form.Item name="config_bot_type" label="Ai类型">
            <Select
              style={{ width: "100%" }}
              onChange={(value, o) => {
                let server = getServiceInstance(value, chatMgt!);
                if (!server) setModels([]);
                server?.models().then((res) => {
                  setModels(res);
                  if (
                    res.length &&
                    !res.includes(form.getFieldValue("GptConfig_model"))
                  ) {
                    form.setFieldValue("GptConfig_model", res[0]);
                  }
                });
              }}
            >
              {aiServerList.map((v) => (
                <Select.Option key={"ai_type" + v.key} value={v.key}>
                  {v.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {models.length && (
            <Form.Item label="ChatGPT模型名称" name={"GptConfig_model"}>
              <Select options={models.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          )}
          <Collapse
            // ghost
            bordered={false}
            activeKey={activityKey}
            onChange={(keys) => setActivityKey(keys as string[])}
            expandIcon={({ isActive }) => (
              <CaretRightOutlined rotate={isActive ? 90 : 0} />
            )}
          >
            <Collapse.Panel
              forceRender={true}
              key={"UI"}
              header={"界面配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item
                name="GptConfig_msgCount"
                label="上下文数量"
                extra="表示最近的几条消息会被当成上下文发送给AI，模拟聊天时建议10以上，当做辅助工具时建议1  "
              >
                <InputNumber
                  style={{ width: "100%" }}
                  step="1"
                  min={0}
                  autoComplete="off"
                />
              </Form.Item>
              <div style={{ width: "100%", display: "flex", gap: "10px" }}>
                <Form.Item
                  style={{ flex: "1" }}
                  name="config_page_size"
                  label="单页显示条数"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    step="1"
                    min={0}
                    autoComplete="off"
                  />
                </Form.Item>
                <Form.Item
                  style={{ flex: "1" }}
                  name="config_page_repect"
                  label="重复显示条数"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    step="1"
                    min={0}
                    autoComplete="off"
                  />
                </Form.Item>
              </div>
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
                  name="config_limit_pre_height"
                  valuePropName="checked"
                  label="代码块限高"
                >
                  <Switch />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel
              forceRender={true}
              key={"GPT_Args"}
              header={"参数配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item extra="ChatGLM与ChatGPT共用了部分参数"></Form.Item>
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
                extra="指定生成文本的最大长度，不是字数；设为0表示不指定，使用官方默认值；GPT3最大4K，GPT4最大8K；GPT432k最大32K；在ChatGPT是返回的内容的token限制，在ChatGLM是总内容的token限制，为方便，在ChatGLM会对这个值乘以10。"
              >
                <InputNumber step="50" min={0} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="GptConfig_top_p"
                label="ChatGPT参数： top_p"
                extra={"指定从概率分布中选择的标记的概率阈值（不懂）"}
              >
                <InputNumber step="0.05" min={0} max={1} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="GptConfig_n"
                label="ChatGPT参数： n"
                extra={"指定生成文本的数量"}
              >
                <InputNumber step="1" min={1} max={10} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="GptConfig_temperature"
                label="ChatGPT参数： temperature"
                extra={"较高的值会产生更多样化的文本"}
              >
                <InputNumber step="0.05" min={0} max={1} autoComplete="off" />
              </Form.Item>
            </Collapse.Panel>
            <Collapse.Panel
              forceRender={true}
              key={"Slack"}
              header={"Slack配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item
                name="config_channel_id"
                label="Slack配置：频道id (channel_id)"
                extra="获取方式参考： https://github.com/bincooo/claude-api/tree/main 和获取Claude的差不多"
              >
                <Input type="text" autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="slack_claude_id"
                label="Slack配置：ClaudeID (全局生效)"
                extra="获取方式参考： https://github.com/bincooo/claude-api/tree/main"
              >
                <Input type="text" autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="slack_user_token"
                label="Slack配置：用户token (user-token) (全局生效)"
                extra="获取方式参考： https://github.com/bincooo/claude-api/tree/main"
              >
                <Input.Password autoComplete="off" />
              </Form.Item>
            </Collapse.Panel>
            <Collapse.Panel
              forceRender={true}
              key={"token"}
              header={"秘钥配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item
                style={{ flex: "1" }}
                name="config_saveKey"
                valuePropName="checked"
                label="保存秘钥到浏览器"
              >
                <Switch />
              </Form.Item>
              {aiServerList
                .filter((s) => ["Kamiya", "ChatGPT"].includes(s.key))
                .map((s) => {
                  return (
                    <Form.Item
                      key={"global_tokens_" + s.key}
                      label={s.name + " token (全局生效)"}
                    >
                      <Form.List name={"global_tokens_" + s.key}>
                        {(fields, { add, remove }, { errors }) => {
                          return (
                            <div style={{ overflow: "auto" }}>
                              {fields.map((field, index) => {
                                return (
                                  <Form.Item {...field}>
                                    <Input.Password autoComplete="off" />
                                  </Form.Item>
                                );
                              })}
                              <Form.Item extra="当存在多个token时，每次请求后都会切换到下一个token">
                                <Button
                                  type="dashed"
                                  onClick={() => {
                                    add();
                                  }}
                                  block
                                  icon={<PlusOutlined />}
                                >
                                  增加 token
                                </Button>
                                <Form.ErrorList errors={errors} />
                              </Form.Item>
                            </div>
                          );
                        }}
                      </Form.List>
                    </Form.Item>
                  );
                })}
              {/* <Form.Item
                name="setting_apitoken"
                label="OpenApi Key (全局生效)"
                extra={<span>请填写自己的key，没有key将不能使用。</span>}
              >
                <Input.Password autoComplete="off" />
              </Form.Item>
              */}
            </Collapse.Panel>
            <Collapse.Panel
              forceRender={true}
              key={"network"}
              header={"网络配置"}
              style={{ padding: "0 8px" }}
            >
              <Form.Item
                name="setting_baseurl"
                label="ChatGPT参数： 接口访问地址"
                extra="api代理地址 (反向代理了 https://api.openai.com 的地址)"
              >
                <Input
                  type="text"
                  placeholder="https://xxxx.xx.xx"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="setting_slack_proxy_url"
                label="Slack配置： 接口访问地址 (全局生效)"
                extra="api代理地址 (反向代理了 https://slack.com 的地址)"
              >
                <Input
                  type="text"
                  placeholder="https://xxxx.xx.xx"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="setting_user_server_url"
                label="自定义服务地址"
                extra="用于访问自建AI服务的地址，比如ChatGLM"
              >
                <Input
                  type="text"
                  placeholder="https://xxxx.xx.xx"
                  autoComplete="off"
                />
              </Form.Item>
            </Collapse.Panel>
            <Collapse.Panel
              forceRender={true}
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
            <Collapse.Panel
              forceRender={false}
              key={"what?"}
              header={"帮助文档"}
              style={{ padding: "0 8px" }}
            >
              <MarkdownView
                markdown={`
### 对话功能

- 使用/开头代替AI发言。
- 使用\\开头发送一条不会发送给ChatGPT的消息。
- 使用::开头以系统的身份发送内容，/::可以发送后不触发ChatGPT。
- 输入内容为空时在支持上下文的AI会把当前上下文发送出去，不支持上下文的AI会获取历史记录。
- 每条消息都可以任意编辑、删除、重复发送（电脑端把鼠标移到消息上，手机端点击消息，消息下方会出现插入内容和重复发送的按钮）。
- 输入框上方的话题名称点击后可以锁定只显示当前话题，锁定后正在回复的消息将会保持在页面底部。
- 左侧导航将会显示全部话题，并且能从消息中读取标题（只读取第一行）。可以通过增加话题或增加标题（Markdown语法 #开头加空格后接标题内容）的方式方便查找。
- 可以通过选中消息的方式灵活的指定哪些内容不受上下文限制的发送给AI。
- 可以快速复制内容。
- 可以快速导入消息到编辑框。
- 可以复制代码块。
- 可以开任意数量话题，可以多个话题同步进行（如果上下文数量是1时，单个话题也能同时进行多个对话）。
- 可以备份还原会话的配置和消息。
- 可以导出话题为markdown文档（在话题标题的下载按钮），可以导出会话的全部话题到单独的Markdown文档（在设置的备份按钮）。
- 上下文的配置将会影响发送给AI时的上下文数量，更多的上下文会让对话更合理，但也会消耗更多的token，并且总的token是有上限的，也可以通过在消息列表里勾选指定消息的方式让限制范围外的重要消息也被发送。

### 助理配置

- 可配置头像和昵称，英语名称用于多助理(人格)模式时区分发言的助理(还没写完)
- 使用/开头的内容将用于伪造AI的发言。
- 使用::开头以系统的身份发送内容。
- 可以增加任意数量的附加配置，方便诱导AI和编写规则。
- 可以删除或调整附加配置的顺序。
- 可配置用户的头像，显示的名称
- 用户简介配置后将会自动以系统的身份告诉ChatGPT用户的简介。

### 会话配置

- 可配置会话标题和头像。
- 可以指定AI类型，可以使用不同的AI交叉使用，但可能出问题。
- 可以为会话指定使用的模型
- 可以指定上下文数量。上下文数量在支持上下文的AI里，可以自由的调整发送内容给AI时从当前话题加载多少条记录发送给AI，如果是模拟聊天，建议10以上，如果是提问或创作，建议设为1，临时需要包含前面的内容进行提问时，可以临时勾选后发送。
- 需要在秘钥配置配置相关的key后才能使用对应的AI
- 可配置接口代理地址(因为没有使用服务器转发的方式，而是直接由浏览器请求，所有代理地址需要将此网站加入允许跨域访问的名单)，同ip多人访问可能产生封号危险，所有这里你可以使用你自己的代理地址。参考[chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI)
- 接口代理地址的最后不能有‘/’
- 可以配置AI支持的参数，如果有需要的话，正常情况下使用默认值即可。
- 除标注的几个配置外，其他配置都是仅当前会话生效。

## 关于此项目
- 此项目提供了一个类似聊天窗口的使用界面，可以同时发起多个对话，并及时的显示回复进度。
- 可以随时编辑对话历史（Slack(Claude)模式无效，因为这个的上下文是存在Slack的服务里的）。
- 可以导出为markdown文档，可以导出为json格式用于备份或在设备间传递。
- 支持自定义上下文数量，创作或工作时设置为1，对话时建议设置10条以上。
- 可以自由勾选提问时发送的上下文，对于需要连续提问时很方便。
- 使用 会话-话题 的方式管理对话，一个会话有多个话题，大部分配置都安照会话做区分。
- 可以为每个会话独立的配置助理设定，工作娱乐分开进行。
- 可以自定义修改每个会话的背景（可以让界面好看一些）。
- 此项目没有后端服务也没有直接访问ChatGPT或Claude的api地址，而是访问另两个使用cloudflare Workers反向代理([示例](#cloudflare反向代理))的地址，用于绕过浏览器的跨域检测。
- 支持随时修改到自己的反向代理地址，文档后面有代码配置示例。
- 如果担心代理地址多人在用有可能被封号，可以使用自己的API代理地址
- 可以访问 [https://litechat.22733.site](https://litechat.22733.site) 或 [https://22733.site](https://22733.site) 直接使用（可能被墙了）。
- 如果你需要自己部署，请看[这里](#独立部署)
- 如果要使用ChatGLM作为机器人，可以看这个项目：[ChatGLM-6B_Api_kaggle](https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle) 并将得到的地址填到ChatGPT的代理地址里就可以使用ChatGLM作为免费的AI助理。
- [一个有很多助理设定的网站 (为什么我没有早点发现Orz)](https://ai.usesless.com/scene)
- [一个购买key的商店（询问过卖家可以挂上来）,一个5刀的key就可以用半个月了。](https://gptnb.net)
- [ClaudeApi调用相关的key获取方式，我也是从这学会的](https://github.com/bincooo/claude-api) 
- [一个赞助入口 ₍₍ ◟(∗˙ ꒵ ˙∗)◞ ₎₎](./%E8%BF%99%E4%B8%AA%E6%96%87%E4%BB%B6%E6%B2%A1%E4%BA%BA%E4%BC%9A%E7%82%B9%E5%BC%80%E7%9A%84%E5%90%A7.md)


**最后两个收款码，～(￣▽￣～)~**

**项目现在是部署在cloudfire上面，使用的免费额度，功能需求也只是我自己的需求，四舍五入就是0成本，所以...这个赞助码 ₍₍ ◟(∗˙ ꒵ ˙∗)◞ ₎₎**

`}
              ></MarkdownView>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Image src={zfb} alt="支付宝收款码" width={300}></Image>
                <Image src={wx} alt="微信收款码" width={300}></Image>
              </div>
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
