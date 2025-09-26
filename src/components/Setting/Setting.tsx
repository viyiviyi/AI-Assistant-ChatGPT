import { aiServerList, aiServices, aiServiceType, getServiceInstance, useService } from '@/core/AiService/ServiceProvider';
import { BgImageStore } from '@/core/BgImageStore';
import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { KeyValueData } from '@/core/db/KeyValueData';
import { useScreenSize } from '@/core/hooks/hooks';
import { useSpeechSynthesis } from '@/core/hooks/tts';
import { getToken, saveToken } from '@/core/tokens';
import { downloadJson, isJson } from '@/core/utils/utils';
import { CtxRole } from '@/Models/CtxRole';
import { GroupConfig } from '@/Models/DataBase';
import { CaretRightOutlined, DownloadOutlined, GithubOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Collapse,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Segmented,
  Select,
  Switch,
  theme,
  Upload
} from 'antd';
import copy from 'copy-to-clipboard';
import { useRouter } from 'next/router';
import { useContext, useEffect, useMemo, useState } from 'react';
import { downloadTopic } from '../Chat/Message/ChatMessage';
import { DragList } from '../common/DragList';
import ImageUpload from '../common/ImageUpload';
import { ModalCallback } from '../common/Modal';
import { SkipExport } from '../common/SkipExport';

export const Setting = ({
  chatMgt,
  cbs,
}: {
  chatMgt?: ChatManagement;

  cbs: ModalCallback;
}) => {
  const [modal, contextHolder] = Modal.useModal();
  const [activityKey, setActivityKey] = useState<string[]>(['UI']);
  const router = useRouter();
  const { setBgConfig, setChat } = useContext(ChatContext);
  const { reloadService } = useService();
  const [models, setModels] = useState<string[]>([]);
  const [connectors, setConnectors] = useState<{ id: string; name: string }[]>([]);
  const screenSize = useScreenSize();
  const [group_Avatar, setGroup_Avatar] = useState(chatMgt?.group.avatar);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    assistant: true,
    system: true,
    user: true,
    isMarkdown: false,
  });
  const [group_background, setGroup_background] = useState(chatMgt?.group.background);
  const [background, setBackground] = useState<string>();
  const [userAiServer, setUserAiServer] = useState<string[]>([]);
  const [ttsVoc, setTtsVoc] = useState<GroupConfig['voiceConfigs']>([]);
  const [modelArgs, setModelArgs] = useState<GroupConfig['modelArgs']>([]);
  const { token } = theme.useToken();
  const speechSynthesis = useSpeechSynthesis();
  const [messageApi, messageContextHolder] = message.useMessage();
  useEffect(() => {
    setUserAiServer(KeyValueData.instance().getaiServerList());
  }, []);
  const [form] = Form.useForm<{
    setting_apitoken: string;
    GptConfig_msgCount: number;
    GptConfig_msgCountMin: number;
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
    config_auto_wrap_code: boolean;
    config_buttom_tool_send: boolean;
    config_tool_to_bottom: boolean;
    setting_user_server_url: string;
    slack_claude_id: string;
    group_name: string;
    chat_connectors: string[];
    setting_slack_proxy_url: string;
    setting_api_transfer_url: string;
    slack_user_token: string;
    config_voice_name: string;
    config_voice_open: boolean;
    config_disable_renderType: string;
    config_use_virtual_role_img: boolean;
  }>();
  const formValus = useMemo(() => {
    const model = typeof chatMgt?.gptConfig.model == 'string' ? chatMgt?.gptConfig.model : chatMgt?.gptConfig.model[chatMgt.config.botType];
    return {
      setting_apitoken: KeyValueData.instance().getApiKey(),
      GptConfig_msgCount: chatMgt?.gptConfig.msgCount,
      GptConfig_msgCountMin: chatMgt?.gptConfig.msgCountMin,
      GptConfig_role: chatMgt?.gptConfig.role,
      GptConfig_max_tokens: chatMgt?.gptConfig.max_tokens,
      GptConfig_top_p: chatMgt?.gptConfig.top_p,
      GptConfig_temperature: chatMgt?.gptConfig.temperature,
      GptConfig_n: chatMgt?.gptConfig.n,
      GptConfig_model: model,
      GptConfig_frequency_penalty: chatMgt?.gptConfig.frequency_penalty || 0,
      GptConfig_presence_penalty: chatMgt?.gptConfig.presence_penalty || 0,
      config_saveKey: true,
      config_disable_strikethrough: chatMgt?.config.disableStrikethrough,
      setting_baseurl: chatMgt?.config.baseUrl?.trim().replace(/\/$/, ''),
      setting_user_server_url: chatMgt?.config.userServerUrl?.trim().replace(/\/$/, ''),
      config_bot_type: chatMgt?.config.botType,
      config_channel_id: chatMgt?.config.cloudChannelId?.trim(),
      config_page_size: chatMgt?.config.pageSize || 20,
      config_page_repect: chatMgt?.config.pageRepect || 0,
      config_limit_pre_height: chatMgt?.config.limitPreHeight,
      config_disable_renderType: chatMgt?.config.renderType,
      config_use_virtual_role_img: chatMgt?.config.useVirtualRoleImgToBack || false,
      config_auto_wrap_code: chatMgt?.config.autoWrapCode,
      config_buttom_tool_send: chatMgt?.config.buttomTool?.sendBtn,
      config_tool_to_bottom: chatMgt?.config.toolBarToBottom,
      config_voice_name: chatMgt?.config.voiceName,
      config_voice_open: chatMgt?.config.voiceOpen,
      slack_claude_id: KeyValueData.instance().getSlackClaudeId()?.trim(),
      slack_user_token: KeyValueData.instance().getSlackUserToken()?.trim(),
      chat_connectors: aiServices.current?.getCurrentConnectors?.call(aiServices.current?.getCurrentConnectors).map((v) => v.id),
      setting_slack_proxy_url: KeyValueData.instance().getSlackProxyUrl().trim()?.replace(/\/$/, ''),
      setting_api_transfer_url: KeyValueData.instance().getApiTransferUrl(),
      group_name: chatMgt?.group.name,
      ...(() => {
        let d: { [key: string]: string[] } = {};
        [
          ...aiServerList,
          ...KeyValueData.instance()
            .getaiServerList()
            .map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true })),
        ].forEach((v) => {
          let t = getToken(v.key);
          d['global_tokens_' + v.key] = t.tokens;
        });
        return d;
      })(),
    };
  }, [chatMgt]);
  useEffect(() => {
    let vocs = chatMgt?.config.voiceConfigs?.map((v) => ({ ...v })) || [{ reg: '', url: '', default: false }];
    if (vocs.length == 0) vocs = [{ reg: '', url: '', default: false }];
    setTtsVoc(vocs);
    setModelArgs(chatMgt?.config.modelArgs?.map((v) => ({ ...v })));
  }, [chatMgt]);
  useEffect(() => {
    BgImageStore.getInstance().getBgImage().then(setBackground);
    const model = typeof chatMgt?.gptConfig.model == 'string' ? chatMgt?.gptConfig.model : chatMgt?.gptConfig.model[chatMgt.config.botType];
    aiServices.current?.models().then((res) => {
      setModels(res);
      if (!res.includes(model || '') && res.length) {
        formValus.GptConfig_model = res[0];
        form.setFieldsValue(formValus);
      }
    });
    aiServices.current?.getConnectors &&
      aiServices.current?.getConnectors().then((res) => {
        setConnectors(res);
      });
    // formValus.chat_connectors = aiServices.current?.getCurrentConnectors
    //   ?.call(aiServices.current?.getCurrentConnectors)
    //   .map((v) => v.id);
    form.setFieldsValue(formValus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    const model = typeof chatMgt?.gptConfig.model == 'string' ? chatMgt?.gptConfig.model : chatMgt?.gptConfig.model[values.config_bot_type];
    chatMgt.gptConfig.model = {
      ...(typeof chatMgt?.gptConfig.model == 'object' ? chatMgt?.gptConfig.model : {}),
      [values.config_bot_type]: values.GptConfig_model || model,
    };
    chatMgt.gptConfig.n = values.GptConfig_n;
    chatMgt.gptConfig.max_tokens = values.GptConfig_max_tokens;
    chatMgt.gptConfig.role = values.GptConfig_role;
    chatMgt.gptConfig.msgCount = values.GptConfig_msgCount;
    chatMgt.gptConfig.msgCountMin = values.GptConfig_msgCountMin;
    chatMgt.gptConfig.temperature = values.GptConfig_temperature;
    chatMgt.gptConfig.top_p = values.GptConfig_top_p;
    chatMgt.gptConfig.presence_penalty = values.GptConfig_presence_penalty;
    chatMgt.gptConfig.frequency_penalty = values.GptConfig_frequency_penalty;
    if (aiServices.current?.setConfig) {
      chatMgt.gptConfig.aiServerConfig = aiServices.current?.setConfig({
        model: chatMgt.gptConfig.model,
        connectors: values.chat_connectors?.map((v) => ({ id: v })) ?? [],
      });
    }
    chatMgt.saveGptConfig();

    chatMgt.config.baseUrl = values.setting_baseurl?.trim()?.replace(/\/$/, '');
    chatMgt.config.disableStrikethrough = values.config_disable_strikethrough;
    chatMgt.config.botType = values.config_bot_type;
    chatMgt.config.cloudChannelId = values.config_channel_id;
    chatMgt.config.userServerUrl = values.setting_user_server_url?.trim()?.replace(/\/$/, '');
    chatMgt.config.limitPreHeight = values.config_limit_pre_height;
    chatMgt.config.pageSize = values.config_page_size;
    chatMgt.config.pageRepect = values.config_page_repect;
    chatMgt.config.renderType = values.config_disable_renderType as 'default' | 'document';
    chatMgt.config.useVirtualRoleImgToBack = values.config_use_virtual_role_img;
    chatMgt.config.autoWrapCode = values.config_auto_wrap_code;
    chatMgt.config.buttomTool = { sendBtn: values.config_buttom_tool_send };
    chatMgt.config.toolBarToBottom = values.config_tool_to_bottom;
    chatMgt.config.voiceName = values.config_voice_name;
    chatMgt.config.voiceOpen = values.config_voice_open;
    chatMgt.config.voiceConfigs = ttsVoc?.filter((f) => !!f.url);
    chatMgt.config.modelArgs = modelArgs?.filter((f) => f.serverUrl && f.value && isJson(f.value));
    chatMgt.saveConfig();

    chatMgt.group.name = values.group_name;
    chatMgt.group.avatar = group_Avatar;
    chatMgt.group.background = group_background;
    chatMgt.saveGroup();
    BgImageStore.getInstance().setBgImage(background || '');
    setBgConfig(group_background || background);

    KeyValueData.instance().setApiKey('', false);
    KeyValueData.instance().setSlackClaudeId(values.slack_claude_id, values.config_saveKey);
    KeyValueData.instance().setSlackUserToken(values.slack_user_token, values.config_saveKey);
    KeyValueData.instance().setSlackProxyUrl(values.setting_slack_proxy_url?.trim()?.replace(/\/$/, ''), values.config_saveKey);
    KeyValueData.instance().setApiTransferUrl(values.setting_api_transfer_url?.trim()?.replace(/\/$/, ''), values.config_saveKey);
    KeyValueData.instance().setaiServerList(userAiServer.filter((f) => f && f != '|').map((v) => v.replace(/\/+$/, '')));
    let userAiServerList = userAiServer
      .filter((f) => f && f != '|')
      .map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true }));
    [...aiServerList.filter((v) => !userAiServer.join(',').includes(v.key)), ...userAiServerList].forEach((v) => {
      let t = getToken(v.key);
      t.tokens = ((values as any)['global_tokens_' + v.key] as Array<string>)?.filter((v) => v) || [];
      if (!t.tokens.includes(t.current)) t.current = t.tokens[0];
      saveToken(v.key, t);
    });
    reloadService(chatMgt.getChat(), KeyValueData.instance());
    setChat(chatMgt.getChat());
  }
  const panlProp = {
    forceRender: true,
    style: { padding: '0 8px' },
  };
  cbs.current.okCallback = onSave;
  const AiServerItem = ({
    item,
    index,
  }: {
    item: {
      name: string;
      url: string;
      key: string;
    };
    index: number;
  }) => {
    const [url, setUrl] = useState(item.url);
    const [name, setName] = useState(item.name);
    return (
      <div key={index} style={{ flex: 1 }}>
        <Form.Item label={index + 1 + ' 名称'}>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            onBlur={() => {
              setUserAiServer((v) => {
                v[index] = name.trim() + '|' + url;
                return v;
              });
            }}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item label={index + 1 + ' 接口地址'}>
          <Input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
            }}
            onBlur={() => {
              setUserAiServer((v) => {
                v[index] = name.trim() + '|' + url;
                return v;
              });
            }}
            autoComplete="off"
          />
        </Form.Item>
      </div>
    );
  };
  return (
    <>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        style={{
          padding: 0,
        }}
      >
        <div
          style={{
            maxHeight: screenSize.height - 200,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '32px',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a href="https://github.com/viyiviyi/AI-Assistant-ChatGPT" rel="noopener noreferrer" target={'_blank'}>
                <SkipExport>
                  <GithubOutlined size={64} />
                </SkipExport>
              </a>
            </div>
            <div style={{ fontSize: 16 }}>QQ群 816545732</div>
          </div>
          <Form.Item label={'会话头像'}>
            <Flex>
              <ImageUpload avatar={group_Avatar || undefined} onSave={setGroup_Avatar} />
              <Button
                type="text"
                style={{ marginLeft: '1em' }}
                onClick={() => {
                  setGroup_Avatar(undefined);
                }}
              >
                清除
              </Button>
            </Flex>
          </Form.Item>
          <Form.Item style={{ flex: 1 }} name="group_name" label="会话名称">
            <Input />
          </Form.Item>
          <Form.Item label={'会话背景图片'}>
            <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
              <ImageUpload
                onSave={setGroup_background}
                width={screenSize.screenWidth}
                height={screenSize.screenHeight}
                trigger={
                  <Button block style={{ width: 'min(220px, 40vw)' }}>
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
            <Button.Group style={{ width: '100%' }}>
              <Modal
                open={showExportModal}
                centered={true}
                title={'导出会话'}
                onCancel={() => setShowExportModal(false)}
                onOk={() => {
                  if (exportConfig.isMarkdown) {
                    chatMgt?.topics.forEach((v) => {
                      ChatManagement.loadMessage(v).then((t) => {
                        downloadTopic(v, false, chatMgt.getChat(), exportConfig);
                      });
                    });
                  } else {
                    let _chat = chatMgt!.toJson();
                    _chat.group.background = undefined;
                    downloadJson(JSON.stringify(_chat), chatMgt!.group.name + '_eaias.com');
                  }
                  setShowExportModal(false);
                }}
              >
                <p>Markdown格式是分开导出所有的话题为多个文件，且不能用于还原。</p>
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
                    {' Markdown'}
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
                    {'JSON'}
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
                      {'用户'}
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
                      {'助理'}
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
                      {'系统'}
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
                          chatMgt?.fromJson(JSON.parse(e.target.result.toString())).then((chat) => {
                            setChat(chat);
                            cbs.current.cancel();
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
                style={{ borderColor: '#ff8d8e44' }}
                onClick={(e) => {
                  modal.confirm({
                    title: '确定删除？',
                    okType: 'danger',
                    content: '删除操作不可逆，请谨慎操作。',
                    bodyStyle: { whiteSpace: 'nowrap' },
                    onOk: () => {
                      ChatManagement.remove(chatMgt!.group.id).then(() => {
                        router.push('/chat');
                        if (ChatManagement.getGroups().length) {
                          setChat(ChatManagement.getGroups()[0]);
                        } else {
                          location.reload();
                        }
                        cbs.current.cancel();
                      });
                    },
                  });
                }}
              >
                {'删除会话'}
              </Button>
            </Button.Group>
          </Form.Item>
          <Form.Item name="config_bot_type" label="Ai类型">
            <Select
              style={{ width: '100%' }}
              onChange={(value, o) => {
                setModels([]);
                let server = getServiceInstance(value, chatMgt!.getChat());
                const model =
                  typeof chatMgt?.gptConfig.model == 'string' ? chatMgt?.gptConfig.model : chatMgt?.gptConfig.model[value] || '';
                form.setFieldValue('GptConfig_model', model || server?.defaultModel);
                server?.models().then((res) => {
                  setModels(res);
                });
                setConnectors([]);
                server?.getConnectors &&
                  server?.getConnectors().then((res) => {
                    setConnectors(res);
                  });
              }}
            >
              {[
                ...aiServerList.filter((v) => !userAiServer.join(',').includes(v.key)),
                ...userAiServer.filter((f) => f && f != '|').map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true })),
              ].map((v) => (
                <Select.Option key={'ai_type' + v.key} value={v.key}>
                  {v.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {models.length ? (
            <Form.Item label="Chat模型名称" name={'GptConfig_model'}>
              <Select options={models.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          ) : (
            <Form.Item label="Chat模型名称" name={'GptConfig_model'}>
              <Input type="text" autoComplete="off" />
            </Form.Item>
          )}
          {connectors.length ? (
            <Form.Item label="Chat连接器" name={'chat_connectors'}>
              <Select
                allowClear
                mode="multiple"
                options={connectors.map((v) => ({
                  value: v.id,
                  label: v.name,
                }))}
              />
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
                <CaretRightOutlined rotate={isActive ? 90 : 0} />
              </SkipExport>
            )}
            items={[
              {
                key: 'UI',
                label: '界面配置',
                ...panlProp,
                children: (
                  <div>
                    <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                      <Form.Item
                        style={{ flex: '1' }}
                        name="GptConfig_msgCount"
                        label="上下文数量"
                        extra="大于该值之前的不会作为上下文发送，0表示不限制。"
                      >
                        <InputNumber style={{ width: '100%' }} step="1" min={0} autoComplete="off" />
                      </Form.Item>
                      <Form.Item
                        style={{ flex: '1' }}
                        name="GptConfig_msgCountMin"
                        label="最小上下文数量"
                        extra="上下文数量低于该值时不限制上下文数量。"
                      >
                        <InputNumber style={{ width: '100%' }} step="1" min={0} autoComplete="off" />
                      </Form.Item>
                    </div>
                    <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                      <Form.Item style={{ flex: '1' }} name="config_page_size" label="单页显示条数">
                        <InputNumber style={{ width: '100%' }} step="1" min={0} autoComplete="off" />
                      </Form.Item>
                      <Form.Item style={{ flex: '1' }} name="config_page_repect" label="重复显示条数">
                        <InputNumber style={{ width: '100%' }} step="1" min={0} autoComplete="off" />
                      </Form.Item>
                    </div>
                    <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                      <Form.Item style={{ flex: '1' }} name="config_limit_pre_height" valuePropName="checked" label="代码块限高">
                        <Switch />
                      </Form.Item>
                      <Form.Item style={{ flex: '1' }} name="config_auto_wrap_code" valuePropName="checked" label="代码块自动换行">
                        <Switch />
                      </Form.Item>
                    </div>
                    <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                      <Form.Item style={{ flex: '1' }} name="config_disable_strikethrough" valuePropName="checked" label="禁用删除线">
                        <Switch />
                      </Form.Item>
                      <Form.Item style={{ flex: '1' }} name="config_use_virtual_role_img" valuePropName="checked" label="角色卡设为背景">
                        <Switch />
                      </Form.Item>
                    </div>
                    <div style={{ width: '100%', display: 'flex', gap: '10px' }}>
                      <Form.Item style={{ flex: '1' }} name="config_disable_renderType" label="渲染方式">
                        <Segmented
                          options={[
                            { label: '对话', value: 'default' },
                            { label: '文档', value: 'document' },
                          ]}
                        />
                      </Form.Item>
                      {/* <Form.Item style={{ flex: '1' }} name="config_buttom_tool_send" valuePropName="checked" label="下方发送按钮">
                        <Switch />
                      </Form.Item> */}
                      <Form.Item style={{ flex: '1' }} name="config_tool_to_bottom" valuePropName="checked" label="发送按钮下移">
                        <Switch />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                key: 'GPT_Args',
                label: '参数配置',
                ...panlProp,
                children: (
                  <div>
                    <Form.Item extra="ChatGLM与ChatGPT共用了部分参数"></Form.Item>
                    <Form.Item name="GptConfig_role" label="ChatGPT参数： role" extra={' 用户使用的角色 建议使用user'}>
                      <Radio.Group style={{ width: '100%' }}>
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
                      extra={'控制生成内容的多样性, 推荐0.5-0.9, 稍高一些, 保证有一定的词汇多样性，也可能出现一长串形容词'}
                    >
                      <InputNumber step="0.05" min={0} max={1} autoComplete="off" />
                    </Form.Item>
                    <Form.Item name="GptConfig_n" label="ChatGPT参数： n" extra={'指定生成文本的数量'}>
                      <InputNumber step="1" min={1} max={10} autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name="GptConfig_temperature"
                      label="ChatGPT参数： temperature"
                      extra={'控制生成内容的随机性, 推荐0.5-0.1, 较低一些, 使内容更加清晰连贯，写文建议值0.7 - 1,'}
                    >
                      <InputNumber step="0.05" min={0} max={2} autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name="GptConfig_presence_penalty"
                      label="ChatGPT参数： presence_penalty"
                      extra={
                        '减少生成过于重复和没有信息量的内容, 减少无意义的重复。推荐0.5-1, 避免重复内容过多。使用cohere.ai时，可以通过设置为0来关闭此参数，且当frequency_penalty有值时，此值无效。'
                      }
                    >
                      <InputNumber step="0.01" min={-2} max={2} autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name="GptConfig_frequency_penalty"
                      label="ChatGPT参数： frequency_penalty"
                      extra={
                        '减少生成高频词汇, 促进使用更多低频词汇, 推荐1-1.5, 适度降低高频词。使用cohere.ai时，可以通过设置为0来关闭此参数。'
                      }
                    >
                      <InputNumber step="0.05" min={-2} max={2} autoComplete="off" />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'token',
                label: '秘钥配置',
                ...panlProp,
                children: (
                  <div>
                    <Form.Item style={{ flex: '1' }} name="config_saveKey" valuePropName="checked" label="保存秘钥到浏览器">
                      <Switch />
                    </Form.Item>
                    {[
                      ...aiServerList.filter((v) => !userAiServer.join(',').includes(v.key)),
                      ...userAiServer
                        .filter((f) => f && f != '|')
                        .map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true })),
                    ]
                      .filter((s) => s.hasToken)
                      .map((s) => {
                        return (
                          <Form.Item key={'global_tokens_' + s.key} label={s.name + ' token (全局生效)'}>
                            <Form.List name={'global_tokens_' + s.key}>
                              {(fields, { add, remove }, { errors }) => {
                                return (
                                  <div style={{ overflow: 'auto' }}>
                                    {fields.map((field, index) => {
                                      return (
                                        <Form.Item {...field}>
                                          <Input.Password autoComplete="off" type="text" />
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
                  </div>
                ),
              },
              {
                key: 'tts_config',
                label: 'TTS配置',
                ...panlProp,
                children: (
                  <div>
                    <Form.Item label="是否启用">
                      <Flex>
                        <Form.Item name="config_voice_open" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                        <span style={{ marginLeft: 30 }}></span>
                        <Button.Group>
                          <Button
                            onClick={() => {
                              if (copy(Buffer.from(JSON.stringify(ttsVoc)).toString('base64'))) {
                                messageApi.success('已复制');
                              }
                            }}
                          >
                            {'复制'}
                          </Button>
                          <Button
                            onClick={() => {
                              try {
                                navigator?.clipboard.readText().then((text) => {
                                  if (!text) return;
                                  text = Buffer.from(text, 'base64').toString();
                                  let res: typeof ttsVoc = JSON.parse(text);
                                  if (typeof res == 'string') res = JSON.parse(res);
                                  setTtsVoc(res);
                                });
                              } catch (error) {
                                messageApi.warning('读取剪切板失败');
                              }
                            }}
                          >
                            {'粘贴'}
                          </Button>
                        </Button.Group>
                      </Flex>
                    </Form.Item>
                    <Form.Item style={{ flex: '1' }} label="系统TTS发言人" name={'config_voice_name'}>
                      <Select
                        allowClear
                        options={(speechSynthesis?.getVoices() || [])
                          .filter((f) => f.lang == 'zh-CN')
                          .map((v) => ({ value: v.name, label: v.name + ' ' + v.lang + ' ' + (v.localService ? '本地' : '') }))}
                      />
                    </Form.Item>
                    <Form.Item label={'TTS服务地址，默认请求第一个地址，优先使用网络TTS服务'}>
                      <DragList
                        data={(ttsVoc || []).map((v, i) => Object.assign(v, { key: i + '' }))}
                        onChange={(data) => {
                          setTtsVoc(data);
                        }}
                        style={{
                          borderRadius: 8,
                          border: '1px solid ' + token.colorBorder,
                          padding: 5,
                          marginBottom: 8,
                        }}
                        itemDom={(s, i) => {
                          return (
                            <div key={i} style={{ flex: 1 }}>
                              <Divider orientation={'left'}>
                                <Checkbox
                                  checked={!s.disabled}
                                  onChange={(e) => {
                                    s.disabled = !e.target.checked;
                                    setTtsVoc((v) => [...v!]);
                                  }}
                                ></Checkbox>
                                <span style={{ marginLeft: 30 }}></span>第{i + 1}组{' '}
                              </Divider>
                              <Form.Item label={'正则，如果有值则仅匹配时调用此服务'}>
                                <Input
                                  autoComplete="off"
                                  type="text"
                                  value={s.reg}
                                  onChange={(v) => {
                                    s.reg = v.target.value;
                                    setTtsVoc((v) => [...v!]);
                                  }}
                                />
                              </Form.Item>
                              <Form.Item label={'正则替换，当需要修改匹配的内容时使用'}>
                                <Input
                                  autoComplete="off"
                                  type="text"
                                  value={s.regOut}
                                  onChange={(v) => {
                                    s.regOut = v.target.value;
                                    setTtsVoc((v) => [...v!]);
                                  }}
                                />
                              </Form.Item>
                              <Form.Item label={'请求地址，文本占位符：{{text}}'}>
                                <Input
                                  autoComplete="off"
                                  type="text"
                                  value={s.url}
                                  onChange={(v) => {
                                    s.url = v.target.value;
                                    setTtsVoc((v) => [...v!]);
                                  }}
                                />
                              </Form.Item>
                            </div>
                          );
                        }}
                      ></DragList>
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => {
                            setTtsVoc((v) => {
                              v?.push({ reg: '', url: '', default: false });
                              return [...(v || [{ reg: '', url: '', default: false }])];
                            });
                          }}
                          block
                          icon={
                            <SkipExport>
                              <PlusOutlined />
                            </SkipExport>
                          }
                        >
                          增加 TTS服务
                        </Button>
                      </Form.Item>
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'network',
                label: '网络配置',
                ...panlProp,
                children: (
                  <div>
                    <Form.Item
                      name="setting_baseurl"
                      label="ChatGPT参数： 接口访问地址"
                      extra="api代理地址 (反向代理了 https://api.openai.com 的地址)"
                    >
                      <Input type="text" placeholder="https://xxxx.xx.xx" autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name="setting_api_transfer_url"
                      label="第三方API服务地址 (全局生效)"
                      extra="如果使用第三方API，可以将地址设置在这里，比如 https://oneapi.huinong.co ; 如果地址不允许跨域访问，可以在地址前面拼接 https://proxy.eaias.com/ ; 如： https://proxy.eaias.com/https://oneapi.huinong.co"
                    >
                      <Input type="text" placeholder="https://xxxx.xx.xx" autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name="setting_user_server_url"
                      label="自定义服务地址"
                      extra="此地址会覆盖除以上和自定义服务之外的API服务地址"
                    >
                      <Input type="text" placeholder="https://xxxx.xx.xx" autoComplete="off" />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'userAiServer',
                label: '其他AI服务',
                ...panlProp,
                children: (
                  <div style={{ overflow: 'auto' }}>
                    <DragList
                      data={userAiServer.map((a, i) => {
                        return {
                          name: a.split('|')[0],
                          url: a.split('|')[1],
                          key: a.split('|')[1] + i + '',
                        };
                      })}
                      onChange={(d) => setUserAiServer(d.map((v) => v.name + '|' + v.url))}
                      style={{
                        borderRadius: 8,
                        border: '1px solid ' + token.colorBorder,
                        padding: 5,
                        marginBottom: 8,
                      }}
                      itemDom={(val, index) => {
                        return <AiServerItem item={val} index={index} />;
                      }}
                    />
                    {/* {userAiServer.map((val, index) => {
                      let [name, url] = val.split('|');
                      return (
                        <div key={index}>
                          <Form.Item label={index + 1 + ' 名称'}>
                            <Input
                              type="text"
                              value={name}
                              onChange={(e) => {
                                setUserAiServer((v) => {
                                  v[index] = e.target.value.trim() + '|' + url.trim();
                                  return [...v];
                                });
                              }}
                              autoComplete="off"
                            />
                          </Form.Item>
                          <Form.Item label={index + 1 + ' 接口地址'}>
                            <Input
                              type="text"
                              value={url}
                              onChange={(e) => {
                                setUserAiServer((v) => {
                                  v[index] = name.trim() + '|' + e.target.value.trim();
                                  return [...v];
                                });
                              }}
                              autoComplete="off"
                            />
                          </Form.Item>
                        </div>
                      );
                    })} */}
                    <Form.Item extra="仅支持兼容ChatGPT类型的API服务，如果地址需要跨域，可以尝试在地址前加 https://proxy.eaias.com/">
                      <Button
                        type="dashed"
                        onClick={() => {
                          setUserAiServer((v) => [...v, '|']);
                        }}
                        block
                        icon={
                          <SkipExport>
                            <PlusOutlined />
                          </SkipExport>
                        }
                      >
                        增加
                      </Button>
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'model_args_config',
                label: '自定义参数',
                ...panlProp,
                children: (
                  <div>
                    <Form.Item>
                      <Flex>
                        <Button.Group>
                          <Button
                            onClick={() => {
                              if (copy(Buffer.from(JSON.stringify(modelArgs)).toString('base64'))) {
                                messageApi.success('已复制');
                              }
                            }}
                          >
                            {'复制'}
                          </Button>
                          <Button
                            onClick={() => {
                              try {
                                navigator?.clipboard.readText().then((text) => {
                                  if (!text) return;
                                  text = Buffer.from(text, 'base64').toString();
                                  let res: typeof modelArgs = JSON.parse(text);
                                  if (typeof res == 'string') res = JSON.parse(res);
                                  setModelArgs(res);
                                });
                              } catch (error) {
                                messageApi.warning('读取剪切板失败');
                              }
                            }}
                          >
                            {'粘贴'}
                          </Button>
                        </Button.Group>
                      </Flex>
                    </Form.Item>
                    <Form.Item label={'自定义调用参数'}>
                      {modelArgs?.map((s, i) => {
                        return (
                          <div key={i} style={{ flex: 1 }}>
                            <Divider orientation={'left'}>
                              <Checkbox
                                checked={s.enable}
                                onChange={(e) => {
                                  s.enable = e.target.checked;
                                  setModelArgs((v) => [...v!]);
                                }}
                              ></Checkbox>
                              <span style={{ marginLeft: 30 }}></span>第{i + 1}组{' '}
                            </Divider>
                            <Form.Item label={'生效的AI服务'}>
                              <Select
                                style={{ width: '100%' }}
                                value={s.serverUrl}
                                onChange={(value, o) => {
                                  s.serverUrl = value;
                                  setModelArgs((v) => [...v!]);
                                }}
                              >
                                {userAiServer
                                  .filter((f) => f && f != '|')
                                  .map((v) => ({ name: v.split('|')[0], key: v.split('|')[1], hasToken: true }))
                                  .map((v) => (
                                    <Select.Option key={'ai_type' + v.key} value={v.key}>
                                      {v.name}
                                    </Select.Option>
                                  ))}
                              </Select>
                            </Form.Item>
                            <Form.Item
                              label={'参数，需要是json格式'}
                              validateStatus={s.value ? (isJson(s.value) ? 'success' : 'error') : 'success'}
                              help="需要是json格式"
                            >
                              <Input.TextArea
                                autoComplete="off"
                                value={s.value}
                                onChange={(v) => {
                                  s.value = v.target.value;
                                  setModelArgs((v) => [...v!]);
                                }}
                              />
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => {
                            setModelArgs((v) => {
                              return [...(v || []), { enable: true, modelName: '', serverUrl: '', value: '{}' }];
                            });
                          }}
                          block
                          icon={
                            <SkipExport>
                              <PlusOutlined />
                            </SkipExport>
                          }
                        >
                          增加参数
                        </Button>
                      </Form.Item>
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'Slack',
                label: 'Slack配置',
                ...panlProp,
                children: (
                  <div>
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
                      <Input.Password autoComplete="off" type="text" />
                    </Form.Item>
                    <Form.Item
                      name="setting_slack_proxy_url"
                      label="Slack配置： 接口访问地址 (全局生效)"
                      extra="api代理地址 (反向代理了 https://slack.com 的地址)"
                    >
                      <Input type="text" placeholder="https://xxxx.xx.xx" autoComplete="off" />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'Glabal',
                label: '全局设置',
                ...panlProp,
                children: (
                  <div>
                    <Form.Item label={'全局背景图片'}>
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          gap: '10px',
                        }}
                      >
                        <ImageUpload
                          onSave={setBackground}
                          width={screenSize.screenWidth}
                          height={screenSize.screenHeight}
                          trigger={
                            <Button block style={{ width: 'min(220px, 40vw)' }}>
                              设置
                            </Button>
                          }
                        ></ImageUpload>
                        <Button
                          style={{ flex: '1' }}
                          onClick={() => {
                            setBackground('');
                          }}
                        >
                          清除
                        </Button>
                      </div>
                    </Form.Item>
                  </div>
                ),
              },
            ]}
          ></Collapse>
        </div>
        {messageContextHolder}
        {contextHolder}
      </Form>
    </>
  );
};
