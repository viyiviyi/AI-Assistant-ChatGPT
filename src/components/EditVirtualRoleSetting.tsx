import { getUuid } from "@/core/utils";
import { CtxRole, VirtualRoleSetting } from "@/Models/DataBase";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select
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
  const [ctx, setCtx] = useState(
    item.ctx.filter((f) => f.content).map((v) => ({ ...v, key: getUuid() }))
  );
  const [title, setTitle] = useState(item.title);
  return (
    <Modal
      open={visible}
      onOk={() => {
        onSave({ ...item,tags, ctx: ctx.filter((f) => f.content), title: title });
      }}
      onCancel={onCancel}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={item}
        style={{ marginTop: 25 }}
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
        <Form.Item validateTrigger={["onChange", "onBlur"]}>
          <Select
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
              setCtx(data);
            }}
            style={{ marginBottom: 8 }}
            itemDom={(item) => {
              return (
                <Form.Item
                  required={false}
                  style={{
                    position: "relative",
                    marginBottom: 0,
                    marginLeft: 10,
                    width: "100%",
                  }}
                  label={
                    <Segmented
                      size="small"
                      value={item.role}
                      onChange={(val) => {
                        item.role = val as CtxRole;
                        setCtx((v) => [...v]);
                      }}
                      options={[
                        { label: "助理", value: "assistant" },
                        { label: "系统", value: "system" },
                        { label: "用户", value: "user" },
                      ]}
                    />
                  }
                >
                  <Form.Item
                    valuePropName="content"
                    validateTrigger={["onChange", "onBlur"]}
                    noStyle
                  >
                    <Input.TextArea
                      placeholder="追加内容"
                      autoSize
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
                  <Popconfirm
                    title="确定删除？"
                    placement="topRight"
                    onConfirm={() => {
                      setCtx((v) => v.filter((f) => f.key != item.key));
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <MinusCircleOutlined
                      className="dynamic-delete-button"
                      style={{
                        padding: ".5em",
                        position: "absolute",
                        right: "0",
                        top: "2px",
                      }}
                    />
                  </Popconfirm>
                </Form.Item>
              );
            }}
          ></DragList>
          <Form.Item extra="当助理模式开启时，这些内容将追加在设定后面">
            <Button
              type="dashed"
              onClick={() => {
                setCtx((v) => [
                  ...v,
                  { content: "", role: "system", key: getUuid() },
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
