import { ChatContext } from "@/core/ChatManagement";
import { scrollToBotton } from "@/core/utils";
import style from "@/styles/index.module.css";
import { theme, Typography } from "antd";
import React, { useContext } from "react";
const Navigation = () => {
  const { chat, activityTopic, setActivityTopic } = useContext(ChatContext);
  const { token } = theme.useToken();
  return (
    <div style={{ padding: "0 1em 1em", maxWidth: "100%" }} key={"nav"}>
      {chat.topics.map((t) => {
        return (
          <div key={"nav_wrap_" + t.id}>
            <p
              key={"nav_" + t.id}
              className={style.nav_item}
              style={{
                cursor: "pointer",
                fontWeight: 600,
                marginBottom: 5,
                paddingTop: ".5em",
              }}
              onClick={() => {
                setActivityTopic(t);
                scrollToBotton(t.id, true);
              }}
            >
              <Typography.Text
                style={{
                  color:
                    t.id == activityTopic.id ? token.colorPrimary : undefined,
                }}
                ellipsis={true}
              >
                {t.name}
              </Typography.Text>
            </p>
            {...t.titleTree.map((m) => (
              <p
                key={"nav_" + m.msgId}
                className={style.nav_item}
                style={{
                  cursor: "pointer",
                  marginLeft: 14 * m.lv,
                  marginBottom: 0,
                  lineHeight: 1.5,
                }}
                onClick={() => scrollToBotton(m.msgId, true)}
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
