import { getUuid } from "@/core/utils";
import { CtxRole, VirtualRoleSetting } from "@/Models/DataBase";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  theme
} from "antd";
import { useState } from "react";
import { DragList } from "./DragList";

export function EditVirtualRoleSetting({
  item,
  onSave,
  visible,
  onCancel,
  allTags,
}: {
  item: VirtualRoleSetting & { key: string; edit: boolean };
  visible: boolean;
  onSave: (item: VirtualRoleSetting & { key: string; edit: boolean }) => void;
  onCancel: () => void;
  allTags: string[];
}) {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>(item.tags);
  const { token } = theme.useToken();
  const [ctx, setCtx] = useState(
    item.ctx.filter((f) => f.content).map((v) => ({ ...v, key: getUuid() }))
  );
  const [title, setTitle] = useState(item.title);
  return (
    <Modal
      open={visible}
      onOk={() => {
        onSave({
          ...item,
          tags,
          ctx: ctx.filter((f) => f.content),
          title: title,
        });
      }}
      onCancel={onCancel}
      centered={true}
      title={"编辑设定"}
      bodyStyle={{
        maxHeight: "calc(100vh - 200px)",
        minHeight: "50vh",
        overflow: "auto",
      }}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={item}
      >
        <Form.Item validateTrigger={["onChange", "onBlur"]}>
          <Input.TextArea
            placeholder="标题，不影响上下文，可不填"
            autoSize
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            style={{
              paddingRight: "1em",
              paddingLeft: "1em",
            }}
          />
        </Form.Item>
        <Form.Item>
          <Select
            placeholder={"tag 按下Enter新增新tag"}
            mode="tags"
            style={{ width: "100%" }}
            value={tags}
            onChange={(vals) => {
              setTags(vals);
            }}
            tokenSeparators={[","]}
            options={allTags.map((v) => ({ label: v, value: v }))}
          />
        </Form.Item>
        <div style={{ overflow: "auto" }}>
          <DragList
            data={ctx}
            onChange={(data) => {
              data.forEach((item, idx) => {
                if (idx == 0 && !item.role) item.role = "system";
              });
              setCtx(data);
            }}
            style={{
              borderRadius: 8,
              border: "1px solid " + token.colorBorder,
              padding: 5,
              marginBottom: 8,
              backgroundColor: token.colorFillContent,
            }}
            itemDom={(item, idx) => {
              return (
                <div
                  style={{
                    position: "relative",
                    marginBottom: 0,
                    marginLeft: 10,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Form.Item noStyle>
                      <Segmented
                        size="small"
                        value={item.role ? item.role : "null"}
                        onChange={(val) => {
                          item.role =
                            val != "null" ? (val as CtxRole) : undefined;
                          setCtx((v) => [...v]);
                        }}
                        options={[
                          { label: "助理", value: "assistant" },
                          { label: "系统", value: "system" },
                          { label: "用户", value: "user" },
                          ...(idx > 0
                            ? [{ label: "向上合并", value: "null" }]
                            : []),
                        ]}
                      />
                    </Form.Item>
                    <span>
                      <Popconfirm
                        title="确定删除？"
                        placement="topRight"
                        onConfirm={() => {
                          setCtx((v) => v.filter((f) => f.key != item.key));
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <DeleteOutlined></DeleteOutlined>
                      </Popconfirm>
                      <span style={{ marginLeft: "15px" }}></span>
                      <Form.Item noStyle>
                        <Checkbox
                          checked={item.checked}
                          onChange={(e) => {
                            item.checked = e.target.checked;
                            setCtx((v) => [...v]);
                          }}
                        ></Checkbox>
                      </Form.Item>
                    </span>
                  </div>
                  <Form.Item
                    valuePropName="content"
                    validateTrigger={["onChange", "onBlur"]}
                    noStyle
                  >
                    <Input.TextArea
                      placeholder="追加内容"
                      autoSize={{ maxRows: 10 }}
                      value={item.content}
                      style={{
                        paddingRight: "1em",
                        paddingLeft: "1em",
                      }}
                      onChange={(e) => {
                        item.content = e.target.value;
                        setCtx((v) => [...v]);
                      }}
                    />
                  </Form.Item>
                </div>
              );
            }}
          ></DragList>
          <Form.Item extra="当助理模式开启时，这些内容将追加在设定后面">
            <Button
              type="dashed"
              onClick={() => {
                setCtx((v) => [
                  ...v,
                  {
                    content: "",
                    role: v.length == 0 ? "system" : undefined,
                    key: getUuid(),
                    checked: true,
                  },
                ]);
              }}
              block
              icon={<PlusOutlined />}
            >
              增加设定
            </Button>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
