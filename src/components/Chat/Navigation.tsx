import { ChatContext } from "@/core/ChatManagement";
import { scrollStatus, scrollToBotton } from "@/core/utils";
import style from "@/styles/index.module.css";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Switch, theme, Tooltip, Typography } from "antd";
import React, { useContext, useState } from "react";
import { reloadTopic } from "./MessageList";
const Navigation = () => {
  const { chat, activityTopic, setActivityTopic } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [showCheckeds, setShowCheckeds] = useState(false);
  return (
    <div style={{ padding: "0 1em 1em", maxWidth: "100%" }} key={"nav"}>
      <div style={{ display: "flex", padding: '10px 0', justifyContent: "flex-end" }}>
        <Tooltip title={"显示已勾选的上下文"}>
          <Switch
            onChange={setShowCheckeds}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
          ></Switch>
        </Tooltip>
      </div>
      {chat.topics.map((t) => {
        return (
          <div key={"nav_wrap_" + t.id}>
            <p
              key={"nav_t_" + t.id}
              className={style.nav_item}
              style={{
                cursor: "pointer",
                fontWeight: 600,
                marginBottom: 5,
                paddingTop: ".5em",
              }}
              onClick={() => {
                setActivityTopic(t);
                reloadTopic(t.id, t.messages.length - 1);
                scrollStatus.enable = true;
                scrollToBotton(t.messages.slice(-1)[0]?.id || t.id);
              }}
            >
              <Typography.Text
                style={{
                  color:
                    t.id == activityTopic?.id ? token.colorPrimary : undefined,
                }}
                ellipsis={true}
              >
                {t.name}
              </Typography.Text>
            </p>
            {...showCheckeds
              ? t.messages.map((m, idx) =>
                  m.checked ? (
                    <p
                      key={"nav_m_" + m.id}
                      className={style.nav_item}
                      style={{
                        cursor: "pointer",
                        marginLeft: 14,
                        marginBottom: 0,
                        lineHeight: 1.5,
                      }}
                      onClick={() => {
                        setActivityTopic(t);
                        reloadTopic(t.id, idx);
                        scrollStatus.enable = true;
                        setTimeout(() => {
                          scrollToBotton(m.id);
                        }, 200);
                      }}
                    >
                      <Typography.Text ellipsis={true}>
                        {m.text || origin}
                      </Typography.Text>
                    </p>
                  ) : (
                    <></>
                  )
                )
              : []}
            {...t.titleTree.map((m) => (
              <p
                key={"nav_m_" + m.msgId}
                className={style.nav_item}
                style={{
                  cursor: "pointer",
                  marginLeft: 14 * m.lv,
                  marginBottom: 0,
                  lineHeight: 1.5,
                }}
                onClick={() => {
                  setActivityTopic(t);
                  reloadTopic(t.id, m.index);
                  scrollStatus.enable = true;
                  setTimeout(() => {
                    scrollToBotton(m.msgId);
                  }, 200);
                }}
              >
                <Typography.Text ellipsis={true}>{m.title}</Typography.Text>
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};
export const MemoNavigation = React.memo(Navigation);
