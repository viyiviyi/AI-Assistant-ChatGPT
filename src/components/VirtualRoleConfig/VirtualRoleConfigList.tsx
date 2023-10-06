import { ChatContext } from "@/core/ChatManagement";
import { getUuid } from "@/core/utils";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  Popconfirm,
  Space,
  Tag,
  theme,
  Typography
} from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { DragItem, DragList } from "../common/DragList";
import { Hidden } from "../common/Hidden";
import { SkipExport } from "../common/SkipExport";
import { EditVirtualRoleSetting } from "./EditVirtualRoleSetting";

type SettingItem = Array<VirtualRoleSetting & { key: string; edit: boolean }>;

export const VirtualRoleConfigList = ({
  autoSave = false,
  save,
  inputSettings,
  disabledEdit,
}: {
  autoSave?: boolean;
  save?: (settings: SettingItem) => void;
  inputSettings?: SettingItem;
  disabledEdit?: boolean;
}) => {
  const { chatMgt } = useContext(ChatContext);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [settingFilterText, setSettingFilterText] = useState("");
  const { token } = theme.useToken();

  const [virtualRole_settings, setVirtualRole_settings] = useState(
    inputSettings || []
  );
  useEffect(() => {
    // 从两个地方获取数据更新 设定列表，以inputSettings的优先
    if (inputSettings) setVirtualRole_settings(inputSettings);
    else {
      setVirtualRole_settings(
        chatMgt.virtualRole.settings.map((v) => ({
          ...v,
          key: v.key,
          edit: false,
        }))
      );
    }
  }, [inputSettings, chatMgt]);

  useEffect(() => {
    let tags: string[] = [];
    let tagsmap = new Map<string, number>();
    virtualRole_settings.forEach((v) => {
      v.tags.forEach((tag) => {
        if (tagsmap.has(tag)) tagsmap.set(tag, tagsmap.get(tag)! + 1);
        else tagsmap.set(tag, 1);
      });
    });
    tags = Array.from(tagsmap.keys()).sort(
      (l, n) => tagsmap.get(n)! - tagsmap.get(l)!
    );
    setTags(tags);
  }, [virtualRole_settings]);
  const handleChange = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    setSelectedTags(nextSelectedTags);
  };
  const isShow = useCallback(
    (
      item: VirtualRoleSetting & {
        key: string;
        edit: boolean;
      }
    ): boolean => {
      let show = true;
      if (settingFilterText) {
        show =
          item.title?.includes(settingFilterText) ||
          item.tags.filter((f) => f.includes(settingFilterText)).length > 0;
      }
      if (selectedTags.length > 0) {
        show =
          show && item.tags.filter((f) => selectedTags.includes(f)).length > 0;
      }
      return show;
    },
    [selectedTags, settingFilterText]
  );
  const saveFunc = useCallback(
    (setting: SettingItem) => {
      chatMgt.virtualRole.settings = setting
        .filter(
          (f) => f && (f.ctx.filter((_f) => _f.content).length || f.title)
        )
        .map((v) => ({ ...v, edit: undefined }));
      chatMgt.saveVirtualRoleBio();
    },
    [chatMgt]
  );
  const saveSettings = useCallback(
    (setting: ((setting: SettingItem) => SettingItem) | SettingItem) => {
      setVirtualRole_settings((last_settings) => {
        let next_setting = last_settings;
        if (typeof setting === "function") {
          next_setting = setting(last_settings);
        } else {
          next_setting = setting;
        }
        if (autoSave) saveFunc(next_setting);
        if (save) save(next_setting);
        return next_setting;
      });
    },
    [autoSave, save, saveFunc]
  );
  const dragItem = useCallback(
    (item: VirtualRoleSetting & DragItem & { edit: boolean }) => {
      return isShow(item) ? (
        <div
          style={{
            flex: 1,
            marginLeft: 10,
            display: "flex",
            width: 0,
            cursor: "pointer",
          }}
        >
          <EditVirtualRoleSetting
            item={item}
            allTags={tags}
            visible={item.edit}
            disabledEdit={disabledEdit}
            onCancel={() => {
              item.edit = false;
              setVirtualRole_settings((v) => [...v]);
            }}
            onSave={(_item) => {
              _item.edit = false;
              setVirtualRole_settings((v) =>
                v.map((a) => (a.key == _item.key ? _item : a))
              );
            }}
          />
          <div
            style={{ flex: 1, width: 0 }}
            onClick={() => {
              item.edit = true;
              setVirtualRole_settings((v) => [...v]);
            }}
          >
            {item.title || item.tags.length ? (
              <div
                style={{
                  borderBottom: "1px solid #ccc2",
                  paddingBottom: 2,
                }}
              >
                <Typography.Text ellipsis style={{ width: "100%" }}>
                  {item.tags
                    .slice(0, Math.min(item.tags.length, 3))
                    .map((v) => (
                      <Tag key={"setting_tag_" + v} color="green">
                        {v}
                      </Tag>
                    ))}{" "}
                  {item.title}
                </Typography.Text>
              </div>
            ) : (
              <></>
            )}
            <Typography.Text
              style={{ width: "100%" }}
              type="secondary"
              ellipsis={true}
            >
              {item.ctx.length
                ? item.ctx
                    .filter((v) => v.checked)
                    .map((v) => v.content)
                    .join(" ")
                : "无内容 点击编辑"}
            </Typography.Text>
          </div>
          <div
            style={{
              width: 30,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Space direction="vertical">
              <Checkbox
                checked={item.checked}
                onChange={(e) => {
                  item.checked = e.target.checked;
                  saveSettings((v) => [...v]);
                }}
              ></Checkbox>
              <Hidden hidden={disabledEdit}>
                <SkipExport>
                  <Popconfirm
                    placement="topRight"
                    overlayInnerStyle={{ whiteSpace: "nowrap" }}
                    title="确定删除？"
                    onConfirm={() => {
                      saveSettings((v) => v.filter((f) => f != item));
                    }}
                  >
                    <DeleteOutlined
                      style={{ color: "#ff8d8f" }}
                    ></DeleteOutlined>
                  </Popconfirm>
                </SkipExport>
              </Hidden>
            </Space>
          </div>
        </div>
      ) : undefined;
    },
    [isShow, tags, disabledEdit, saveSettings]
  );
  return (
    <>
      <Form.Item label="搜索配置" noStyle style={{ marginBottom: 10 }}>
        <Input.Search
          placeholder={"搜索关键字"}
          value={settingFilterText}
          onChange={(e) => setSettingFilterText(e.target.value)}
          onSearch={(val) => {
            setSettingFilterText(val);
          }}
        />
      </Form.Item>
      <Form.Item>
        {tags.length > 0 ? (
          <Space size={[0, 8]} wrap style={{ overflow: "auto" }}>
            {tags.slice(0, Math.min(50, tags.length)).map((tag) => (
              <Tag.CheckableTag
                key={tag}
                checked={selectedTags.includes(tag)}
                onChange={(checked) => handleChange(tag, checked)}
              >
                {tag}
              </Tag.CheckableTag>
            ))}
          </Space>
        ) : (
          <span style={{ opacity: 0.8 }}>{"没有tag"}</span>
        )}
      </Form.Item>
      <Form.Item>
        <DragList
          style={{
            borderRadius: 8,
            border: "1px solid " + token.colorBorder,
            padding: 5,
            marginBottom: 8,
          }}
          readonly={disabledEdit}
          centenDrag={true}
          data={virtualRole_settings.filter((f) => !f.postposition)}
          onChange={(data) => {
            saveSettings([
              ...data,
              ...virtualRole_settings.filter((f) => f.postposition),
            ]);
          }}
          itemDom={dragItem}
        />
        <Form.Item extra="当助理模式开启时，这些内容将追加在设定后面">
          <Button
            ghost
            type="dashed"
            onClick={() => {
              setVirtualRole_settings((v) => [
                ...v,
                {
                  checked: true,
                  tags: [],
                  ctx: [],
                  key: getUuid(),
                  edit: false,
                },
              ]);
            }}
            block
          >
            <Typography.Text>
              <SkipExport>
                <PlusOutlined />
              </SkipExport>
              {"增加设定"}
            </Typography.Text>
          </Button>
        </Form.Item>
      </Form.Item>
      <Divider orientation="left">后置内容</Divider>
      <Form.Item extra="当助理模式开启时，这些内容将追加在上下文后面">
        <DragList
          readonly={disabledEdit}
          style={{
            borderRadius: 8,
            border: "1px solid " + token.colorBorder,
            padding: 5,
            marginBottom: 8,
          }}
          data={virtualRole_settings.filter((f) => f.postposition)}
          onChange={(data) => {
            saveSettings([
              ...virtualRole_settings.filter((f) => !f.postposition),
              ...data,
            ]);
          }}
          itemDom={dragItem}
        />
        <Form.Item>
          <Button
            ghost
            type="dashed"
            onClick={() => {
              setVirtualRole_settings((v) => [
                ...v,
                {
                  postposition: true,
                  checked: true,
                  tags: [],
                  ctx: [],
                  key: getUuid(),
                  edit: false,
                },
              ]);
            }}
            block
          >
            <Typography.Text>
              <SkipExport>
                <PlusOutlined />
              </SkipExport>
              {"增加设定"}
            </Typography.Text>
          </Button>
        </Form.Item>
      </Form.Item>
    </>
  );
};
