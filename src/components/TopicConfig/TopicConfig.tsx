import { ChatContext } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks/hooks";
import { TopicMessage } from "@/Models/Topic";
import { SettingOutlined } from "@ant-design/icons";
import { Button, Form, InputNumber, Segmented, Switch, Tabs } from "antd";
import {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { reloadTopic } from "../Chat/Message/MessageList";
import { Modal, ModalCallback } from "../common/Modal";
import { SkipExport } from "../common/SkipExport";
import { VirtualRoleConfigInfo } from "../VirtualRoleConfig/VirtualRoleConfigInfo";
import { VirtualRoleConfigList } from "../VirtualRoleConfig/VirtualRoleConfigList";

export const TopicConfigModal = ({ topic }: { topic: TopicMessage }) => {
  const screenSize = useScreenSize();
  const [isShow, setIsShow] = useState(false);
  return (
    <>
      <SkipExport>
        <SettingOutlined
          onClick={() => setIsShow(!isShow)}
          style={{ padding: "5px 10px" }}
        />
      </SkipExport>
      <Modal
        open={isShow}
        onCancel={() => {
          setIsShow(false);
        }}
        maskClosable={screenSize.width <= 500}
        onOk={() => {
          setIsShow(false);
        }}
        items={(cbs) => {
          return <TopicConfig modalCb={cbs} topic={topic}></TopicConfig>;
        }}
      ></Modal>
    </>
  );
};

export const TopicConfig = ({
  topic,
  modalCb,
}: {
  topic: TopicMessage;
  modalCb: ModalCallback;
}) => {
  const screenSize = useScreenSize();
  const { chatMgt } = useContext(ChatContext);
  const [countCtx, setCountCtx] = useState(topic.overrideSettings?.msgCount);
  const [renderType, setRenderType] = useState(
    topic.overrideSettings?.renderType
  );
  const [useConfig, setUseConfig] = useState(topic.overrideSettings?.useConfig);
  // 覆盖会话的设定的开关
  const [overrideVirtualRole, setOverrideVirtualRole] = useState(
    topic.overrideVirtualRole?.map((v) => ({
      ...v,
      edit: false,
    }))
  );
  // 会话的设定
  const [virtualRoleSetting, setVirtualRoleSetting] = useState(
    chatMgt.virtualRole.settings?.map((v, i) => ({
      ...v,
      ctx: v.ctx.map((c) => ({ ...c })),
      edit: false,
    })) || []
  );
  const currentvirtualRoleSettings = useMemo(
    () => ({ current: virtualRoleSetting }),
    [virtualRoleSetting]
  );
  useEffect(() => {
    setVirtualRoleSetting((settings) => {
      if (!overrideVirtualRole) {
        return (
          chatMgt.virtualRole.settings?.map((v, i) => ({
            ...v,
            ctx: v.ctx.map((c) => ({ ...c })),
            edit: false,
          })) || []
        );
      }
      settings.forEach((v, idx) => {
        if (overrideVirtualRole) {
          let override = overrideVirtualRole.find((f) => f.key == v.key);
          if (override) {
            v.checked = true;
            v.ctx.forEach((c, i) => {
              c.checked == override!.ctx.findIndex((f) => f.key == c.key) > -1;
            });
          } else {
            v.checked = false;
          }
        }
      });
      return [...settings];
    });
  }, [chatMgt, overrideVirtualRole]);
  // 话题内设定
  const [virtualRole] = useState(
    topic.virtualRole?.map((v, i) => ({
      ...v,
      ctx: v.ctx.map((c) => ({ ...c })),
      edit: false,
    })) || []
  );
  const currentSettings = useMemo(
    () => ({ current: virtualRole }),
    [virtualRole]
  );
  const tabItemStyle: CSSProperties = {
    maxHeight: screenSize.height - 300,
    overflow: "auto",
  };
  const saveas = useCallback(() => {
    topic.overrideSettings = {
      msgCount: countCtx,
      renderType: renderType,
      useConfig: useConfig,
    };
    let settingHasChange = false;
    if (currentvirtualRoleSettings.current) {
      for (let i = 0; i < currentvirtualRoleSettings.current.length; i++) {
        let v = currentvirtualRoleSettings.current[i];
        let s = chatMgt.virtualRole.settings[i];
        if (s.checked != v.checked) {
          settingHasChange = true;
          break;
        }
        for (let j = 0; j < v.ctx.length; j++) {
          let c = v.ctx[j];
          let c1 = s.ctx[j];
          if (c.checked != c1.checked) {
            settingHasChange = true;
            break;
          }
        }
        if (settingHasChange) break;
      }
    }
    if (settingHasChange) {
      topic.overrideVirtualRole = currentvirtualRoleSettings.current
        .filter((f) => f.checked)
        .map((v) => ({
          key: v.key,
          ctx: v.ctx.filter((f) => f.checked).map((c) => ({ key: c.key })),
        }));
    } else {
      topic.overrideVirtualRole = undefined;
    }
    topic.virtualRole = currentSettings.current;
    chatMgt.saveTopic(topic.id, topic.name);
    reloadTopic(topic.id);
  }, [
    chatMgt,
    countCtx,
    currentSettings,
    currentvirtualRoleSettings,
    renderType,
    topic,
    useConfig,
  ]);

  if (modalCb.current) {
    modalCb.current.okCallback = () => {
      saveas();
    };
  }
  return (
    <div>
      <Tabs
        type="card"
        defaultActiveKey="virtualRole"
        style={{ minHeight: "calc(70vh - 118px)" }}
        items={[
          {
            label: "话题设置",
            key: "overrideSettings",
            children: (
              <div style={{ ...tabItemStyle }}>
                <Form.Item label={"这些设置会覆盖会话的设置"}>
                  <Form.Item label="上下文数量">
                    <InputNumber
                      value={
                        countCtx === undefined
                          ? chatMgt.gptConfig.msgCount
                          : countCtx
                      }
                      onChange={(e) => {
                        setCountCtx(e || undefined);
                      }}
                      step="1"
                      min={0}
                      autoComplete="off"
                    />
                    <Button
                      style={{ marginLeft: 14 }}
                      onClick={() => setCountCtx(undefined)}
                    >
                      {"恢复默认"}
                    </Button>
                  </Form.Item>
                  <Form.Item label="渲染方式">
                    <Segmented
                      value={
                        renderType === undefined
                          ? chatMgt.config.renderType
                          : renderType
                      }
                      onChange={(e) => {
                        setRenderType(e as "default" | "document" | undefined);
                      }}
                      options={[
                        { label: "对话", value: "default" },
                        { label: "文档", value: "document" },
                      ]}
                    />
                    <Button
                      style={{ marginLeft: 14 }}
                      onClick={() => setRenderType(undefined)}
                    >
                      {"恢复默认"}
                    </Button>
                  </Form.Item>
                  <Form.Item label="是否启用设定">
                    <Switch
                      checked={
                        useConfig === undefined
                          ? chatMgt.config.enableVirtualRole
                          : useConfig
                      }
                      onChange={(e) => {
                        setUseConfig(e);
                      }}
                    />
                    <Button
                      style={{ marginLeft: 14 }}
                      onClick={() => setUseConfig(undefined)}
                    >
                      {"恢复默认"}
                    </Button>
                  </Form.Item>
                </Form.Item>
              </div>
            ),
          },
          {
            label: "话题内设定",
            key: "virtualRole",
            children: (
              <div style={{ ...tabItemStyle }}>
                <VirtualRoleConfigList
                  currentSettings={currentSettings}
                  autoSave={false}
                  inputSettings={virtualRole}
                />
              </div>
            ),
          },
          {
            label: "会话设定",
            key: "overrideVirtualRole",
            children: (
              <div style={{ ...tabItemStyle }}>
                <Button
                  style={{ marginBottom: 14 }}
                  onClick={() => {
                    setOverrideVirtualRole(undefined);
                  }}
                >
                  {"恢复默认"}
                </Button>
                <VirtualRoleConfigList
                  currentSettings={currentvirtualRoleSettings}
                  disabledEdit={true}
                  autoSave={false}
                  inputSettings={virtualRoleSetting}
                />
              </div>
            ),
          },
          {
            label: "设定预览",
            key: "virtualRolePreview",
            children: (
              <div style={{ ...tabItemStyle }}>
                <VirtualRoleConfigInfo
                  bio={chatMgt.virtualRole.bio}
                  settings={virtualRoleSetting}
                  topicVirtualRole={virtualRole}
                />
              </div>
            ),
          },
        ]}
      ></Tabs>
    </div>
  );
};
