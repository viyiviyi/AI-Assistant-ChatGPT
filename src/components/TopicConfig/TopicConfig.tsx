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
  const [overrideVirtualRole, setOverrideVirtualRole] = useState(
    topic.overrideVirtualRole?.map((v) => ({ ...v, edit: false }))
  );
  const [virtualRoleSetting, setVirtualRoleSetting] = useState(
    chatMgt.virtualRole.settings?.map((v, i) => ({
      ...v,
      edit: false,
    })) || []
  );
  useEffect(() => {
    setVirtualRoleSetting((settings) => {
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
        } else {
          v.checked == chatMgt.virtualRole.settings[idx].checked;
          v.ctx = v.ctx.map((c, i) => ({
            ...c,
            checked: chatMgt.virtualRole.settings[idx].ctx[i].checked,
          }));
        }
      });
      return [...settings];
    });
  }, [chatMgt, overrideVirtualRole]);
  const [virtualRole, setVirtualRole] = useState(
    topic.virtualRole?.map((v, i) => ({
      ...v,
      edit: false,
    })) || []
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
    topic.overrideVirtualRole = overrideVirtualRole;
    topic.virtualRole = virtualRole;
    chatMgt.saveTopic(topic.id, topic.name);
    reloadTopic(topic.id);
  }, [
    chatMgt,
    countCtx,
    overrideVirtualRole,
    renderType,
    topic,
    useConfig,
    virtualRole,
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
                  save={setVirtualRole}
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
                <VirtualRoleConfigList
                  save={(setting) => {
                    setOverrideVirtualRole(
                      setting
                        .filter((f) => f.checked)
                        .map((v) => ({
                          key: v.key,
                          edit: false,
                          ctx: v.ctx.map((c) => ({ key: c.key })),
                        }))
                    );
                  }}
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
