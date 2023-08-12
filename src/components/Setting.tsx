import {
  aiServerList,
  aiServices,
  aiServiceType,
  getServiceInstance,
  useService
} from "@/core/AiService/ServiceProvider";
import { BgImageStore } from "@/core/BgImageStore";
import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import { KeyValueData } from "@/core/KeyValueData";
import { getToken, saveToken } from "@/core/tokens";
import { downloadJson } from "@/core/utils";
import { CtxRole } from "@/Models/DataBase";
import {
  CaretRightOutlined,
  DownloadOutlined,
  GithubOutlined,
  PlusOutlined,
  UploadOutlined
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Segmented,
  Select,
  Switch,
  theme,
  Upload
} from "antd";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { downloadTopic } from "./Chat/ChatMessage";
import ImageUpload from "./ImageUpload";
import { SkipExport } from "./SkipExport";

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
  const screenSize = useScreenSize();
  const [group_Avatar, setGroup_Avatar] = useState(chatMgt?.group.avatar);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    assistant: true,
    system: true,
    user: true,
    isMarkdown: false,
  });
  const [group_background, setGroup_background] = useState(
    chatMgt?.group.background
  );
  const [background, setBackground] = useState<string>();
  const { token } = theme.useToken();
  const [form] = Form.useForm<{
    setting_apitoken: string;
    GptConfig_msgCount: number;
    GptConfig_role: CtxRole;
    GptConfig_max_tokens: number;
    GptConfig_top_p: number;
    GptConfig_temperature: number;
    GptConfig_n: number;
    GptConfig_model: string;
    GptConfig_frequency_penalty: number;
    GptConfig_presence_penalty: number;
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
    config_disable_renderType: string;
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
      GptConfig_frequency_penalty: chatMgt?.gptConfig.frequency_penalty || 0,
      GptConfig_presence_penalty: chatMgt?.gptConfig.presence_penalty || 0,
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
      config_disable_renderType: chatMgt?.config.renderType,
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
    chatMgt.gptConfig.presence_penalty = values.GptConfig_presence_penalty;
    chatMgt.gptConfig.frequency_penalty = values.GptConfig_frequency_penalty;
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
    chatMgt.config.renderType = values.config_disable_renderType as
      | "default"
      | "document";
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
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <a
                href="https://github.com/viyiviyi/AI-Assistant-ChatGPT"
                rel="noopener noreferrer"
                target={"_blank"}
              >
                <SkipExport>
                  <GithubOutlined size={64} />
                </SkipExport>
              </a>
              <a
                href="https://gitee.com/yiyiooo/AI-Assistant-ChatGPT"
                rel="noopener noreferrer"
                target={"_blank"}
              >
                {/* <div style={{ width: 32, height: 64, overflow: "hidden" ,marginLeft:10}} >
                  <Image
                    style={{marginTop:-5}}
                    width={100}
                    height={32}
                    src={
                      "https://gitee.com/static/images/logo-black.svg?t=158106664"
                    }
                    alt="项目地址 https://gitee.com/yiyiooo/AI-Assistant-ChatGPT"
                  />
                </div> */}
              </a>
            </div>
            <div style={{ fontSize: 16 }}>QQ群 816545732</div>
          </div>
          <Form.Item label={"会话头像"}>
            <ImageUpload
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
              <ImageUpload
                onSave={setGroup_background}
                width={screenSize.screenWidth}
                height={screenSize.screenHeight}
                trigger={
                  <Button block style={{ width: "min(220px, 40vw)" }}>
                    设置
                  </Button>
                }
              ></ImageUpload>
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
              <Modal
                open={showExportModal}
                centered={true}
                title={"导出会话"}
                onCancel={() => setShowExportModal(false)}
                onOk={() => {
                  if (exportConfig.isMarkdown) {
                    chatMgt?.topics.forEach((v) => {
                      ChatManagement.loadMessage(v).then((t) => {
                        downloadTopic(v, false, chatMgt, exportConfig);
                      });
                    });
                  } else {
                    let _chat = chatMgt!.toJson();
                    _chat.group.background = undefined;
                    downloadJson(JSON.stringify(_chat), chatMgt!.group.name);
                  }
                  setShowExportModal(false);
                }}
              >
                <p>
                  Markdown格式是分开导出所有的话题为多个文件，且不能用于还原。
                </p>
                <div>
                  <Checkbox
                    checked={exportConfig.isMarkdown}
                    onChange={(e) => {
                      setExportConfig((v) => ({
                        ...v,
                        isMarkdown: true,
                      }));
                    }}
                  >
                    {" Markdown"}
                  </Checkbox>
                  <Checkbox
                    checked={!exportConfig.isMarkdown}
                    onChange={(e) => {
                      setExportConfig((v) => ({
                        ...v,
                        isMarkdown: false,
                      }));
                    }}
                  >
                    {"JSON"}
                  </Checkbox>
                </div>
                {exportConfig.isMarkdown ? (
                  <div>
                    <p>可选需要导出的内容的角色</p>
                    <Checkbox
                      checked={exportConfig.user}
                      onChange={(e) => {
                        setExportConfig((v) => ({
                          ...v,
                          user: e.target.checked,
                        }));
                      }}
                    >
                      {"用户"}
                    </Checkbox>
                    <Checkbox
                      checked={exportConfig.assistant}
                      onChange={(e) => {
                        setExportConfig((v) => ({
                          ...v,
                          assistant: e.target.checked,
                        }));
                      }}
                    >
                      {"助理"}
                    </Checkbox>
                    <Checkbox
                      checked={exportConfig.system}
                      onChange={(e) => {
                        setExportConfig((v) => ({
                          ...v,
                          system: e.target.checked,
                        }));
                      }}
                    >
                      {"系统"}
                    </Checkbox>
                  </div>
                ) : (
                  <></>
                )}
              </Modal>
              <Button block onClick={() => setShowExportModal(true)}>
                <SkipExport>
                  <DownloadOutlined key="download" />
                </SkipExport>
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
                  <SkipExport>
                    <UploadOutlined key="upload" />
                  </SkipExport>
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
          {models.length ? (
            <Form.Item label="ChatGPT模型名称" name={"GptConfig_model"}>
              <Select options={models.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          ) : (
            <></>
          )}
          <Collapse
            // ghost
            bordered={false}
            activeKey={activityKey}
            onChange={(keys) => setActivityKey(keys as string[])}
            expandIcon={({ isActive }) => (
              <SkipExport>
                {" "}
                <CaretRightOutlined rotate={isActive ? 90 : 0} />
              </SkipExport>
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
              <div style={{ width: "100%", display: "flex", gap: "10px" }}>
                <Form.Item
                  style={{ flex: "1" }}
                  name="config_disable_renderType"
                  label="渲染方式"
                >
                  <Segmented
                    options={[
                      { label: "对话", value: "default" },
                      { label: "文档", value: "document" },
                    ]}
                  />
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
                <InputNumber step="0.05" min={0} max={2} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="GptConfig_presence_penalty"
                label="ChatGPT参数： presence_penalty"
                extra={"较高的值会增加模型谈论新话题的可能性"}
              >
                <InputNumber step="0.01" min={-2} max={2} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="GptConfig_frequency_penalty"
                label="ChatGPT参数： frequency_penalty"
                extra={"较高的值会降低模型直接重复相同语句的可能性"}
              >
                <InputNumber step="0.05" min={-2} max={2} autoComplete="off" />
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
                                  icon={
                                    <SkipExport>
                                      <PlusOutlined />
                                    </SkipExport>
                                  }
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
                  <ImageUpload
                    onSave={setBackground}
                    width={screenSize.screenWidth}
                    height={screenSize.screenHeight}
                    trigger={
                      <Button block style={{ width: "min(220px, 40vw)" }}>
                        设置
                      </Button>
                    }
                  ></ImageUpload>
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
