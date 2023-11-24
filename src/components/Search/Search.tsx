import { ChatContext } from "@/core/ChatManagement";
import { activityScroll, scrollToBotton } from "@/core/utils/utils";
import { TitleTree, TopicMessage } from "@/Models/Topic";
import style from "@/styles/index.module.css";
import { Input, theme, Typography } from "antd";
import React, { useContext, useState } from "react";
import { reloadTopic } from "../Chat/Message/MessageList";
const SearchWrap = () => {
  const { setActivityTopic, chatMgt: chat } = useContext(ChatContext);
  const [searchText, setSearchText] = useState("");
  const [result, setResult] = useState<TopicMessage[]>([]);
  const [checkedId, setCheckedId] = useState("");
  const onSearch = (fileText: string) => {
    const res: TopicMessage[] = [];
    setSearchText(fileText);
    if (!fileText) return setResult(res);
    chat.topics.forEach((t) => {
      let t_s_idx = t.name.indexOf(fileText);
      let t_text = "";
      if (t_s_idx != -1) {
        // 往查询结果前移动5个字符开始
        t_text = t.name.substring(
          Math.max(0, t_s_idx - 10),
          Math.min(t.name.length, t_s_idx + 50)
        );
      }
      let ms: TitleTree[] = [];
      t.messages.forEach((m, idx) => {
        let m_s_idx = m.text.indexOf(fileText);
        if (m_s_idx != -1) {
          ms.push({
            lv: 1,
            msgId: m.id,
            index: idx,
            title: m.text.substring(
              Math.max(0, m_s_idx - 10),
              Math.min(m.text.length, m_s_idx + 50)
            ),
          });
        }
      });
      if (t_s_idx != -1 || ms.length > 0) {
        res.push({
          id: t.id,
          name: t_text || t.name,
          groupId: t.groupId,
          createdAt: t.createdAt,
          messages: t.messages,
          messageMap: t.messageMap,
          titleTree: ms,
        });
      }
      setResult(res);
    });
  };
  const { token } = theme.useToken();
  function getChild(text: string, highlight: string) {
    let texts = text.split(highlight);
    return texts.map((v, idx) => {
      return (
        <>
          <>{v}</>
          {idx < texts.length - 1 && (
            <span style={{ color: token.colorPrimary }}>{highlight}</span>
          )}
        </>
      );
    });
  }
  return (
    <div style={{ padding: "0 1em 1em", maxWidth: "100%" }} key={"search_nav"}>
      <Input.Search
        placeholder="可从话题名称和消息内容中查找"
        allowClear
        onSearch={onSearch}
      ></Input.Search>
      {result.map((t) => {
        return (
          <div key={"search_nav_wrap_" + t.id}>
            <p
              key={"search_nav_t_" + t.id}
              className={style.search_nav_item}
              style={{
                cursor: "pointer",
                fontWeight: 600,
                marginBottom: 5,
                paddingTop: ".5em",
              }}
              onClick={() => {
                setCheckedId(t.id);
                setActivityTopic(t);
                reloadTopic(t.id, t.messages.length - 1);
                activityScroll({ botton: true });
                scrollToBotton(t.messages.slice(-1)[0]?.id || t.id);
              }}
            >
              <Typography.Text
                style={{
                  color:
                    t.id == checkedId ? token.colorPrimaryHover : undefined,
                }}
                ellipsis={true}
              >
                {getChild(t.name, searchText)}
              </Typography.Text>
            </p>
            {...t.titleTree.map((m) => (
              <p
                key={"search_nav_m_" + m.msgId}
                className={style.search_nav_item}
                style={{
                  cursor: "pointer",
                  marginLeft: 14 * m.lv,
                  marginBottom: 0,
                  lineHeight: 1.5,
                }}
                onClick={() => {
                  setCheckedId(m.msgId);
                  setActivityTopic(t);
                  reloadTopic(t.id, m.index);
                  activityScroll({ botton: true });
                  setTimeout(() => {
                    scrollToBotton(m.msgId);
                  }, 500);
                }}
              >
                <Typography.Text
                  style={{
                    color:
                      m.msgId == checkedId
                        ? token.colorPrimaryHover
                        : undefined,
                  }}
                  ellipsis={true}
                >
                  {getChild(m.title, searchText)}
                </Typography.Text>
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};
export const MemoSearchWrap = React.memo(SearchWrap);
