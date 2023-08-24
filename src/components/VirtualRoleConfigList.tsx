import { ChatContext } from "@/core/ChatManagement";
import { getUuid } from "@/core/utils";
import { VirtualRoleSetting } from "@/Models/DataBase";
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
import { useContext, useEffect, useState } from "react";
import { DragList } from "./DragList";
import { EditVirtualRoleSetting } from "./EditVirtualRoleSetting";
import { SkipExport } from "./SkipExport";

export const VirtualRoleConfigList = () => {
  const { chatMgt } = useContext(ChatContext);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [settingFilterText, setSettingFilterText] = useState("");
  const { token } = theme.useToken();
  const [virtualRole_settings, setVirtualRole_settings] = useState(
    chatMgt?.virtualRole.settings?.map((v, i) => ({
      ...v,
      key: getUuid(),
      edit: false,
    })) || []
  );
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
  }, [chatMgt, virtualRole_settings]);
  const handleChange = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    setSelectedTags(nextSelectedTags);
  };
  function isShow(
    item: VirtualRoleSetting & {
      key: string;
      edit: boolean;
    },
    postposition: boolean = false
  ): boolean {
    let show = true;
    if (postposition != !!item.postposition) show = false;
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
  }
  const save = () => {
    chatMgt.virtualRole.settings = virtualRole_settings
      .filter((f) => f && (f.ctx.filter((_f) => _f.content).length || f.title))
      .map((v) => ({ ...v, key: undefined, edit: undefined }));
  };
  useEffect(() => {
    save();
    chatMgt.saveVirtualRoleBio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualRole_settings]);
  return (
    <Form style={{height:'100%',overflow:'auto'}}>
      <Form.Item label="搜索配置" noStyle style={{ marginBottom: 10 }}>
        <Input.Search
          placeholder={"搜索关键字"}
          onSearch={(val) => {
            setSettingFilterText(val);
            // setVirtualRole_settings((v) => [...v]);
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
          centenDrag={true}
          data={virtualRole_settings}
          onChange={(data) => {
            setVirtualRole_settings(data);
          }}
          itemDom={(item) => {
            return isShow(item) ? (
              <div
                style={{
                  flex: 1,
                  width: 0,
                  marginLeft: 10,
                  display: "flex",
                  cursor: "pointer",
                }}
              >
                <EditVirtualRoleSetting
                  item={item}
                  allTags={tags}
                  visible={item.edit}
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
                  <Typography.Text style={{ width: "100%" }} ellipsis={true}>
                    {item.ctx.length
                      ? item.ctx
                          .filter((v) => v.checked)
                          .map((v) => v.content)
                          .join("")
                      : "无内容 点击编辑"}
                  </Typography.Text>
                </div>
                <div
                  style={{
                    // width: 30,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Space direction="vertical">
                    <Checkbox
                      checked={item.checked}
                      onChange={(e) => {
                        item.checked = e.target.checked;
                        setVirtualRole_settings((v) => [...v]);
                      }}
                    ></Checkbox>
                    <SkipExport>
                      <Popconfirm
                        title="确定删除？"
                        onConfirm={() => {
                          setVirtualRole_settings((v) =>
                            v.filter((f) => f != item)
                          );
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <DeleteOutlined
                          style={{ color: "#ff8d8f" }}
                        ></DeleteOutlined>
                      </Popconfirm>
                    </SkipExport>
                  </Space>
                </div>
              </div>
            ) : undefined;
          }}
        />
        <Form.Item>
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
            icon={
              <SkipExport>
                <PlusOutlined />
              </SkipExport>
            }
          >
            增加设定
          </Button>
        </Form.Item>
      </Form.Item>
      <Divider orientation="left">后置内容</Divider>
      <Form.Item>
        <DragList
          style={{
            borderRadius: 8,
            border: "1px solid " + token.colorBorder,
            padding: 5,
            marginBottom: 8,
          }}
          data={virtualRole_settings}
          onChange={(data) => {
            setVirtualRole_settings(data);
          }}
          itemDom={(item) => {
            return isShow(item, true) ? (
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
                        setVirtualRole_settings((v) => [...v]);
                      }}
                    ></Checkbox>
                    <SkipExport>
                      <Popconfirm
                        title="确定删除？"
                        onConfirm={() => {
                          setVirtualRole_settings((v) =>
                            v.filter((f) => f != item)
                          );
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <DeleteOutlined
                          style={{ color: "#ff8d8f" }}
                        ></DeleteOutlined>
                      </Popconfirm>
                    </SkipExport>
                  </Space>
                </div>
              </div>
            ) : undefined;
          }}
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
            icon={
              <SkipExport>
                <PlusOutlined />
              </SkipExport>
            }
          >
            增加设定
          </Button>
        </Form.Item>
      </Form.Item>
    </Form>
  );
};
