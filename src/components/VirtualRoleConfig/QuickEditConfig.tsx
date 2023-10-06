import { ChatContext } from "@/core/ChatManagement";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { Form, Tabs } from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { VirtualRoleConfigList } from "./VirtualRoleConfigList";

export const QuickEditConfig = () => {
  const { activityTopic, chatMgt } = useContext(ChatContext);
  const [virtualRole, setVirtualRole] = useState(
    activityTopic?.virtualRole?.map((v, i) => ({
      ...v,
      ctx: v.ctx.map((c) => ({ ...c })),
      edit: false,
    })) || []
  );
  const saveAsTopicConfig = useCallback(
    (setting: VirtualRoleSetting[]) => {
      if (!activityTopic) return;
      activityTopic.virtualRole = setting
        .filter(
          (f) => f && (f.ctx.filter((_f) => _f.content).length || f.title)
        )
        .map((v) => ({
          ...v,
          ctx: v.ctx.map((c) => ({
            ...c,
            edit: undefined,
          })),
          edit: undefined,
        }));
      chatMgt.saveTopic(activityTopic.id, activityTopic.name);
    },
    [activityTopic, chatMgt]
  );
  useEffect(() => {
    if (!activityTopic) return;
    setVirtualRole(
      activityTopic?.virtualRole?.map((v, i) => ({
        ...v,
        ctx: v.ctx.map((c) => ({ ...c })),
        edit: false,
      })) || []
    );
  }, [activityTopic, chatMgt]);
  return (
    <>
      <Tabs
        type="card"
        defaultActiveKey="topic"
        items={[
          ...(activityTopic
            ? [
                {
                  key: "topic",
                  label: "话题设定",
                  children: (
                    <>
                      <p>
                        {"当前话题："}
                        {activityTopic.name.substring(0, 10)}
                      </p>
                      <Form
                        style={{
                          height: "calc(100vh - 233px)",
                          overflow: "auto",
                        }}
                      >
                        <VirtualRoleConfigList
                          autoSave={false}
                          inputSettings={virtualRole}
                          onChange={saveAsTopicConfig}
                        />
                      </Form>
                    </>
                  ),
                },
              ]
            : []),
          {
            key: "group",
            label: "会话设定",
            children: (
              <>
                <Form
                  style={{ height: "calc(100vh - 233px)", overflow: "auto" }}
                >
                  <VirtualRoleConfigList autoSave={true} />
                </Form>
              </>
            ),
          },
        ]}
      ></Tabs>
    </>
  );
};
