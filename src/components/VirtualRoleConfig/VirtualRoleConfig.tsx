import { ChatContext, ChatManagement } from '@/core/ChatManagement';
import { KeyValueData } from '@/core/db/KeyValueData';
import { useScreenSize } from '@/core/hooks/hooks';
import { jsonToSetting, readLorebook } from '@/core/utils/chub';
import { pnginfo } from '@/core/utils/pnginfo';
import { downloadJson, getUuid } from '@/core/utils/utils';
import { NameMacrosPrompt } from '@/middleware/scripts/NameMacrosPrompt.middleware';
import { VirtualRole } from '@/Models/DataBase';
import { VirtualRoleSetting } from '@/Models/VirtualRoleSetting';
import { Button, Dropdown, Flex, Form, Input, message, Popconfirm, Switch, Tabs, Tag, theme, Upload } from 'antd';
import copy from 'copy-to-clipboard';
import { CSSProperties, useCallback, useContext, useMemo, useState } from 'react';
import ImageUpload from '../common/ImageUpload';
import { Modal, ModalCallback } from '../common/Modal';
import { MiddlewareConfig } from './MiddlewareConfig';
import { VirtualRoleConfigInfo } from './VirtualRoleConfigInfo';
import { VirtualRoleConfigList } from './VirtualRoleConfigList';

let copyRoleVal: VirtualRole | undefined = undefined;

export const VirtualRoleConfig = ({ chatMgt, cbs }: { chatMgt?: ChatManagement; cbs: ModalCallback }) => {
  const [virtualRole_Avatar, setVirtualRole_Avatar] = useState(chatMgt?.virtualRole.avatar);
  const [user_Avatar, setUser_Avatar] = useState(chatMgt?.user.avatar);
  const { token } = theme.useToken();
  const { setChat, activityTopic, setBgConfig } = useContext(ChatContext);
  const [showInfo, setShowInfo] = useState(false);
  const screenSize = useScreenSize();
  const [virtualRoleTags, setVirtualRoleTags] = useState<string[]>(chatMgt?.virtualRole.tags || []);
  const [loadImageAwait, setLoadImageAwait] = useState<Promise<string>>();
  const [bgImg, setBgImg] = useState<string>();
  const [form] = Form.useForm<{
    virtualRole_name: string;
    virtualRole_bio: string;
    virtualRole_enable: boolean;
    virtualRole_en_name: string;
    user_name: string;
    user_en_name: string;
    user_en_bio: string;
  }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [virtualRole_settings, setVirtualRole_settings] = useState(
    chatMgt?.virtualRole.settings?.map((v, i) => ({
      ...v,
      ctx: v.ctx.map((c) => ({ ...c })),
      edit: false,
    })) || []
  );
  const currentSettings = useMemo(() => ({ current: virtualRole_settings }), [virtualRole_settings]);
  const [middlewares, setMiddlewares] = useState<string[]>(chatMgt?.config.middleware ?? []);
  const loadChubBook = useCallback((bookSettings: VirtualRoleSetting[]) => {
    setVirtualRole_settings((settings) => {
      bookSettings.forEach((v) => {
        let worldOtherIdx = settings.findIndex((f) => f.extensionId == 'chub.worldOther');
        let thisBookIdx = settings.findIndex((f) => v.extensionId && f.extensionId == v.extensionId);
        if (thisBookIdx != -1) {
          settings[thisBookIdx] = { ...v, edit: false };
        } else if (worldOtherIdx != -1) {
          settings.splice(worldOtherIdx, 0, { ...v, edit: false });
        } else {
          settings.unshift({ ...v, edit: false });
        }
      });
      return [...settings];
    });
  }, []);
  const loadChubData = useCallback(
    (
      charData: {
        setting: VirtualRoleSetting[];
        avatar: string;
        name: string;
      },
      replace = false
    ) => {
      if (charData) {
        form.setFieldValue('virtualRole_name', charData.name);
        if (chatMgt?.config.middleware && !chatMgt?.config.middleware?.includes(NameMacrosPrompt.key))
          chatMgt.config.middleware.push(NameMacrosPrompt.key);
        let previousPosition: {
          [topId: string]: VirtualRoleSetting[];
        } = {};
        let userVariableSetting: {
          [extensionId: string]: VirtualRoleSetting;
        } = {};
        let oldChubSetting: {
          [extensionId: string]: VirtualRoleSetting;
        } = {};
        let lastChubId = 'None';
        (currentSettings.current || virtualRole_settings).forEach((v) => {
          if (v.extensionId?.startsWith('chub.')) {
            lastChubId = v.extensionId;
            if (
              [
                'chub.TagsPrompt',
                'chub.mainPrompt',
                'chub.enhanceDefinitions',
                'chub.userInfo',
                'chub.NSFWPrompt',
                'chub.Start',
                'chub.Continue',
                'chub.jailbreak',
                'chub.RequiresChinese',
                'chub.ContentTone',
              ].includes(v.extensionId)
            ) {
              userVariableSetting[v.extensionId] = v;
            } else {
              oldChubSetting[v.extensionId] = v;
            }
          } else if (lastChubId) {
            if (previousPosition[lastChubId]) previousPosition[lastChubId].push(v);
            else previousPosition[lastChubId] = [v];
          }
        });
        let nextSetting: VirtualRoleSetting[] = [...(previousPosition['None'] || [])];
        // 传入的新setting
        charData.setting.forEach((v) => {
          if (v.extensionId) {
            if (v.extensionId == 'chub.HistoricalScene') {
              if (oldChubSetting[v.extensionId] && oldChubSetting[v.extensionId].ctx.length > 2) {
                v.ctx = [oldChubSetting[v.extensionId].ctx[0], ...v.ctx.slice(1, -1), oldChubSetting[v.extensionId].ctx.slice(-1)[0]];
              }
            }
            if (oldChubSetting[v.extensionId] && ['chub.HistoricalScene', 'chub.FirstMes'].includes(v.extensionId)) {
              v.checked = oldChubSetting[v.extensionId].checked;
              v.dynamic = oldChubSetting[v.extensionId].dynamic;
              v.autoCtx = oldChubSetting[v.extensionId].autoCtx;
            }
            if (userVariableSetting[v.extensionId] && !replace) {
              v.checked = userVariableSetting[v.extensionId].checked;
              v.dynamic = userVariableSetting[v.extensionId].dynamic;
              v.autoCtx = userVariableSetting[v.extensionId].autoCtx;
              let newCtx = v.ctx.filter(
                (c) =>
                  userVariableSetting[v.extensionId!].ctx.findIndex(
                    (f) => f.content.toLowerCase().trim().replaceAll(' ', '') == c.content.toLowerCase().trim().replaceAll(' ', '')
                  ) == -1
              );
              v.ctx = userVariableSetting[v.extensionId].ctx;
              newCtx.forEach((v) => (v.checked = false));
              v.ctx.push(...newCtx);
            }
            if (previousPosition[v.extensionId]) {
              nextSetting.push(...[v, ...previousPosition[v.extensionId]]);
            } else {
              nextSetting.push(v);
            }
          } else {
            nextSetting.push(v);
          }
        });
        setVirtualRole_settings(
          nextSetting.map((v) => ({
            ...v,
            edit: false,
          }))
        );
      }
    },
    [chatMgt, currentSettings, form, virtualRole_settings]
  );
  async function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.virtualRole.name = values.virtualRole_name;
    chatMgt.virtualRole.bio = values.virtualRole_bio;
    (currentSettings.current || virtualRole_settings).forEach((v) => v.ctx.forEach((c) => (c.content = c.content)));
    chatMgt.virtualRole.settings = (currentSettings.current || virtualRole_settings)
      .filter((f) => f && (f.ctx.filter((_f) => _f.content).length || f.title))
      .map((v) => ({ ...v, edit: undefined }));
    chatMgt.virtualRole.avatar = virtualRole_Avatar || '';
    chatMgt.virtualRole.enName = values.virtualRole_en_name;
    chatMgt.virtualRole.tags = virtualRoleTags;
    if (loadImageAwait) chatMgt.virtualRole.avatar = await loadImageAwait;
    chatMgt.saveVirtualRoleBio();

    if (bgImg && chatMgt?.config.useVirtualRoleImgToBack) {
      // BgImageStore.getInstance().setBgImage(bgImg || '');
      chatMgt.group.background = bgImg;
      chatMgt.saveGroup();
      setBgConfig(bgImg || '');
    }

    chatMgt.config.enableVirtualRole = values.virtualRole_enable;
    chatMgt.config.middleware = middlewares;
    chatMgt.saveConfig();

    chatMgt.user.name = values.user_name;
    chatMgt.user.enName = values.user_en_name;
    chatMgt.user.avatar = user_Avatar || '';
    chatMgt.user.bio = values.user_en_bio;
    chatMgt.saveUser();
    setChat(chatMgt.getChat());
  }
  cbs.current.okCallback = onSave;

  const tabItemStyle: CSSProperties = {
    maxHeight: screenSize.height - 300,
    overflow: 'auto',
  };
  const VirtualRoleInfo = (
    <div style={{ ...tabItemStyle }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: '10px',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Form.Item>
            <ImageUpload avatar={virtualRole_Avatar || undefined} onSave={setVirtualRole_Avatar} />
          </Form.Item>
          <Form.Item style={{ flex: 1 }} name="virtualRole_name" label="助理名称">
            <Input />
          </Form.Item>
          <Form.Item
            style={{ flex: 1 }}
            name="virtualRole_en_name"
            label="英文名称;用于区分角色"
            rules={[
              {
                type: 'string',
                pattern: /^[a-zA-Z0-9]+$/,
                message: '只能使用大小写字母和数字',
              },
            ]}
          >
            <Input />
          </Form.Item>
        </div>
        <div>
          <Form.Item>
            <ImageUpload avatar={user_Avatar || undefined} onSave={setUser_Avatar} />
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
                type: 'string',
                pattern: /^[a-zA-Z0-9]+$/,
                message: '只能使用大小写字母和数字',
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
        extra={
          <>
            <div>
              {virtualRoleTags.map((v) => (
                <Tag style={{ marginTop: 5 }} key={'role_tag_' + v} color="green">
                  {v}
                </Tag>
              ))}
            </div>
            <p>{'当助理模式开启时，所有发送的内容都将以此内容开头'}</p>
          </>
        }
      >
        <Input.TextArea autoSize />
      </Form.Item>
      <Form.Item name="user_en_bio" label="用户设定" extra="当导入角色卡片时，这个内容将作为用户设定导入，其他时候此内容无效。">
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
          user_en_bio: chatMgt?.user.bio,
        }}
      >
        {contextHolder}
        <div>
          <div
            style={{
              width: '100%',
              height: 54,
              position: 'fixed',
              left: '0',
              top: '0',
            }}
            onClick={cbs.current.cancel}
          ></div>
          <Flex gap={32}>
            <Form.Item name="virtualRole_enable" label="启用" valuePropName="checked">
              <Switch></Switch>
            </Form.Item>
            <Form.Item name="virtualRole_copy" label="操作">
              <Button.Group>
                <Button
                  onClick={() => {
                    copyRoleVal = JSON.parse(JSON.stringify(chatMgt?.virtualRole));
                  }}
                >
                  {'复制'}
                </Button>
                <Button
                  disabled={!copyRoleVal}
                  onClick={() => {
                    form.setFieldValue('virtualRole_name', copyRoleVal?.name);
                    form.setFieldValue('virtualRole_bio', copyRoleVal?.bio);
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
                  {'粘贴'}
                </Button>
                <Button
                  onClick={() => {
                    setShowInfo(true);
                  }}
                >
                  {'预览'}
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: '1',
                        label: (
                          <a
                            onClick={() => {
                              if (copy(JSON.stringify(chatMgt?.virtualRole))) {
                                messageApi.success('已复制');
                              }
                            }}
                          >
                            {'复制到剪切板'}
                          </a>
                        ),
                      },
                      {
                        key: '2',
                        label: (
                          <a
                            onClick={() => {
                              navigator?.clipboard.readText().then((text) => {
                                try {
                                  if (!text) return;
                                  let res: VirtualRole = JSON.parse(text);
                                  if (typeof res == 'string') res = JSON.parse(res);
                                  if (!res.name) return messageApi.error('数据不正确');
                                  form.setFieldValue('virtualRole_name', res?.name);
                                  form.setFieldValue('virtualRole_bio', res?.bio);
                                  setVirtualRole_Avatar(res?.avatar);
                                  setVirtualRole_settings(
                                    res?.settings?.map((v, i) => ({
                                      ...v,
                                      key: getUuid(),
                                      edit: false,
                                    })) || []
                                  );
                                } catch (err) {
                                  console.error(err);
                                  messageApi.error('内容格式错误');
                                }
                              });
                            }}
                          >
                            {'从剪切板读取'}
                          </a>
                        ),
                      },
                      {
                        key: '3',
                        label: (
                          <Upload
                            accept=".json,.png"
                            {...{
                              beforeUpload(file, FileList) {
                                function push(res: string) {
                                  if (!res) return;
                                  try {
                                    let jsonData = JSON.parse(res);
                                    if (typeof jsonData == 'string') jsonData = JSON.parse(jsonData);
                                    let charData = jsonToSetting(jsonData);
                                    if (!charData.name) return messageApi.error('数据不正确');
                                    setVirtualRoleTags(charData.tags ?? []);
                                    loadChubData(charData);
                                  } catch (error) {
                                    console.error(error);
                                    messageApi.error('文件格式错误');
                                  }
                                }
                                if (file.type == 'image/png') {
                                  pnginfo(file).then((res) => {
                                    push(res);
                                  });
                                  setLoadImageAwait(
                                    new Promise((res, rej) => {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const img = new Image();
                                        img.onload = () => {
                                          const canvas = document.createElement('canvas');
                                          canvas.width = 128;
                                          canvas.height = 128;
                                          const ctx = canvas.getContext('2d');
                                          if (!ctx) return;
                                          let minWidth = Math.min(img.width, img.height);
                                          ctx.drawImage(
                                            img,
                                            minWidth == img.width ? 0 : (img.width - minWidth) / 2,
                                            0,
                                            minWidth,
                                            minWidth,
                                            0,
                                            0,
                                            128,
                                            128
                                          );
                                          // 转换为 Blob 或 base64
                                          let imgBase64 = canvas.toDataURL('image/jpeg', 1);
                                          // setVirtualRole_Avatar(imgBase64);
                                          res(imgBase64);
                                        };
                                        img.src = event.target?.result?.toString() || '';
                                        setBgImg(event.target?.result?.toString() || '');
                                      };
                                      reader.readAsDataURL(file);
                                    })
                                  );
                                  return false;
                                } else {
                                  setLoadImageAwait(undefined);
                                }
                                const fr = new FileReader();
                                fr.onloadend = (e) => {
                                  if (e.target?.result) {
                                    push(e.target.result.toString());
                                  }
                                };
                                fr.readAsText(file);
                                return false;
                              },
                              defaultFileList: [],
                              showUploadList: false,
                            }}
                          >
                            {'导入酒馆角色卡'}
                          </Upload>
                        ),
                      },
                      {
                        key: '5',
                        label: (
                          <Upload
                            accept=".json,.png"
                            {...{
                              beforeUpload(file, FileList) {
                                function push(res: string) {
                                  if (!res) return;
                                  try {
                                    let jsonData = JSON.parse(res);
                                    if (typeof jsonData == 'string') jsonData = JSON.parse(jsonData);
                                    let charData = readLorebook(jsonData);
                                    loadChubBook(charData);
                                  } catch (error) {
                                    console.error(error);
                                    messageApi.error('文件格式错误');
                                  }
                                }
                                if (file.type == 'image/png') {
                                  pnginfo(file).then((res) => {
                                    push(res);
                                  });
                                  return false;
                                }
                                const fr = new FileReader();
                                fr.onloadend = (e) => {
                                  if (e.target?.result) {
                                    push(e.target.result.toString());
                                  }
                                };
                                fr.readAsText(file);
                                return false;
                              },
                              defaultFileList: [],
                              showUploadList: false,
                            }}
                          >
                            {'导入世界书'}
                          </Upload>
                        ),
                      },
                      {
                        key: '6',
                        label: (
                          <Upload
                            accept=".json"
                            {...{
                              beforeUpload(file, FileList) {
                                const fr = new FileReader();
                                fr.onloadend = (e) => {
                                  if (e.target?.result) {
                                    try {
                                      let jsonData: VirtualRole = JSON.parse(e.target.result.toString());
                                      if (typeof jsonData == 'string') jsonData = JSON.parse(jsonData);
                                      if (!jsonData.name) return messageApi.error('数据不正确');
                                      form.setFieldValue('virtualRole_name', jsonData?.name);
                                      form.setFieldValue('virtualRole_bio', jsonData?.bio);
                                      setVirtualRole_Avatar(jsonData?.avatar);
                                      setVirtualRole_settings(
                                        jsonData?.settings?.map((v, i) => ({
                                          ...v,
                                          key: getUuid(),
                                          edit: false,
                                        })) || []
                                      );
                                    } catch (error) {
                                      messageApi.error('文件格式错误');
                                    }
                                  }
                                };
                                fr.readAsText(file);
                                return false;
                              },
                              defaultFileList: [],
                              showUploadList: false,
                            }}
                          >
                            {'导入设定json文件'}
                          </Upload>
                        ),
                      },
                      {
                        key: '7',
                        label: (
                          <a
                            onClick={() => {
                              downloadJson(JSON.stringify(chatMgt?.virtualRole), chatMgt?.group.name + 'setting_eaias.com.json');
                            }}
                          >
                            {'导出设定到json文件'}
                          </a>
                        ),
                      },
                      {
                        key: '8',
                        label: (
                          <Popconfirm
                            overlayInnerStyle={{ whiteSpace: 'nowrap' }}
                            title="确定清空？"
                            placement="topRight"
                            onConfirm={() => {
                              setVirtualRole_settings([]);
                            }}
                          >
                            {'清空全部设定'}
                          </Popconfirm>
                        ),
                      },
                      {
                        key: '9',
                        label: (
                          <a
                            onClick={() => {
                              loadChubData(jsonToSetting({}), true);
                            }}
                          >
                            {'默认角色扮演提示词'}
                          </a>
                        ),
                      },
                    ],
                  }}
                  placement="bottomRight"
                >
                  <Button>{'更多'}</Button>
                </Dropdown>
              </Button.Group>
            </Form.Item>
          </Flex>
          <Tabs
            type="card"
            defaultActiveKey="settings"
            style={{ minHeight: 'calc(70dvh - 118px)' }}
            items={[
              {
                label: `助理设定`,
                key: 'virtualRole',
                forceRender: true,
                children: VirtualRoleInfo,
              },
              {
                label: `设定列表`,
                key: 'settings',
                forceRender: true,
                children: (
                  <div style={{ ...tabItemStyle }}>
                    <VirtualRoleConfigList currentSettings={currentSettings} inputSettings={virtualRole_settings} />
                  </div>
                ),
              },
              {
                label: `扩展功能`,
                key: 'middleware',
                forceRender: false,
                children: (
                  <div style={{ ...tabItemStyle }}>
                    <MiddlewareConfig
                      middlewares={middlewares}
                      setMiddlewares={setMiddlewares}
                      inputSettings={virtualRole_settings}
                      changeSetting={(val) => {
                        setVirtualRole_settings(
                          val.map((v, i) => ({
                            ...v,
                            ctx: v.ctx.map((c) => ({ ...c })),
                            edit: false,
                          }))
                        );
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Form>
      <Modal
        open={showInfo}
        onCancel={() => {
          setShowInfo(false);
        }}
        okText={null}
        bodyStyle={{
          maxHeight: 'calc(100dvh - 200px)',
          minHeight: '50dvh',
          overflow: 'auto',
          padding: 0,
        }}
        items={() => {
          return <VirtualRoleConfigInfo bio={form.getFieldValue('virtualRole_bio')} settings={virtualRole_settings} />;
        }}
      ></Modal>
    </>
  );
};
