import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { usePushMessage, useScreenSize } from "@/core/hooks";
import {
  onTextareaTab,
  scrollStatus,
  scrollToBotton,
  scrollToTop,
  stopScroll,
} from "@/core/utils";
import { CtxRole } from "@/Models/DataBase";
import styleCss from "@/styles/index.module.css";
import {
  AlignLeftOutlined,
  CaretLeftOutlined,
  CommentOutlined,
  MessageOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, theme, Typography } from "antd";
import React, { useCallback, useContext, useState } from "react";
import { MemoBackgroundImage } from "../BackgroundImage";
import { SkipExport } from "../SkipExport";
import { MessageContext } from "./Chat";
import { CtxRoleButton } from "./CtxRoleButton";
import { MemoNavigation } from "./Navigation";

const inputRef = React.createRef<HTMLInputElement>();
const objs = { setInput: (s: string | ((s: string) => string)) => {} };
export function useInput() {
  return {
    inputRef,
    setInput: (s: string | ((s: string) => string)) => {
      return objs.setInput(s);
    },
  };
}
export function InputUtil() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const { chat, activityTopic, setActivityTopic, reloadNav } =
    useContext(ChatContext);
  const { onlyOne, setOnlyOne, closeAll, setCloasAll } =
    useContext(MessageContext);
  const { token } = theme.useToken();
  const [role, setRole] = useState<[CtxRole, boolean]>(["user", true]);
  const screenSize = useScreenSize();
  const { pushMessage } = usePushMessage(chat);
  objs.setInput = (input: string | ((s: string) => string)) => {
    let next_input = inputText;
    if (typeof input == "function") {
      next_input = input(next_input);
    } else {
      next_input = input;
    }
    setInputText(ChatManagement.parseText(next_input));
    setRole([ChatManagement.parseTextToRole(next_input), role[1]]);
  };
  /**
   * 提交内容
   * @param isNewTopic 是否开启新话题
   * @returns
   */
  const onSubmit = useCallback(
    async function (isNewTopic: boolean) {
      let text = inputText.trim();
      text = ChatManagement.parseText(text);
      let topic = chat.getActivityTopic();
      if (!chat.config.activityTopicId) isNewTopic = true;
      if (!chat.topics.find((t) => t.id == chat.config.activityTopicId))
        isNewTopic = true;
      if (isNewTopic) {
        await chat.newTopic(text).then((_topic) => {
          topic = _topic;
          setActivityTopic(_topic);
        });
      }
      if (!topic) return;
      scrollStatus.enable = true;
      setLoading((v) => ++v);
      pushMessage(text, topic.messages.length || 0, topic, role, () => {
        setInputText("");
        setRole(["user", true]);
        if (/^#{1,5}\s/.test(text)) reloadNav(topic!);
        setTimeout(() => {
          setLoading((v) => --v);
        }, 500);
      });
      return;
    },
    [chat, inputText, role, reloadNav, setActivityTopic, pushMessage]
  );

  return (
    <>
      <div className={styleCss.loading}>
        {loading ? (
          <div className={styleCss.loading}>
            {[0, 1, 2, 3, 4].map((v) => (
              <div
                key={v}
                style={{ backgroundColor: token.colorPrimary }}
                className={styleCss.loadingBar}
              ></div>
            ))}
          </div>
        ) : (
          <div className={styleCss.loading}></div>
        )}
      </div>
      <div
        style={{
          width: "100%",
          padding: "0px 10px 10px",
          borderRadius: token.borderRadius,
          backgroundColor:
            chat.config.renderType == "document"
              ? token.colorInfoBg
              : token.colorFillContent,
        }}
      >
        <div
          style={{
            flexWrap: "nowrap",
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
            alignItems: "center",
            marginBottom: "3px",
            position: "relative",
          }}
        >
          {inputText && (
            <CtxRoleButton
              value={role}
              onChange={setRole}
              inputRef={inputRef}
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillContent,
              }}
            />
          )}
          <SkipExport>
            <div className={styleCss.roll_button}>
              <Button
                shape={"circle"}
                size="large"
                icon={<VerticalAlignTopOutlined />}
                onClick={() => {
                  stopScroll();
                  if (!activityTopic) return;
                  scrollStatus.enableTop = true;
                  if (onlyOne) {
                    scrollToTop();
                  } else scrollToTop(activityTopic.id);
                }}
              />
              <span style={{ marginTop: 10 }}></span>
              <Button
                shape={"circle"}
                size="large"
                icon={<VerticalAlignBottomOutlined />}
                onClick={() => {
                  stopScroll();
                  if (!activityTopic) return;
                  scrollStatus.enable = true;
                  if (onlyOne) {
                    scrollToBotton();
                  }
                  scrollToBotton(activityTopic.id);
                }}
              />
              <SkipExport>
                <CaretLeftOutlined
                  style={{ position: "absolute", right: "0", top: "37px" }}
                />
              </SkipExport>
            </div>
          </SkipExport>
          {screenSize.width < 1200 && (
            <SkipExport>
              <AlignLeftOutlined
                style={{ padding: "8px 12px 8px 0" }}
                onClick={(e) => {
                  setShowNav(true);
                }}
              />
            </SkipExport>
          )}
          <Drawer
            placement={"left"}
            closable={false}
            width={Math.min(screenSize.width - 40, 400)}
            key={"nav_drawer"}
            bodyStyle={{ padding: "1em 0" }}
            open={showNav}
            onClose={() => {
              setShowNav(false);
            }}
          >
            <MemoBackgroundImage />
            <div
              style={{
                position: "relative",
                height: "100%",
                zIndex: 99,
              }}
            >
              <MemoNavigation />
            </div>
          </Drawer>
          <Typography.Text
            style={{
              cursor: "pointer",
              color: onlyOne ? token.colorPrimary : undefined,
            }}
            ellipsis={true}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOnlyOne(!onlyOne);
            }}
          >
            {activityTopic?.name}
          </Typography.Text>
          <span style={{ flex: 1 }}></span>
          <Button
            shape="round"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              setOnlyOne(false);
              setCloasAll(!closeAll);
            }}
          >
            <SkipExport>
              <CommentOutlined />
            </SkipExport>
            <SkipExport>
              <VerticalAlignMiddleOutlined />
            </SkipExport>
          </Button>
          <span style={{ marginLeft: 10 }}></span>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={
              <SkipExport>
                <CommentOutlined />
              </SkipExport>
            }
            onClick={() => {
              onSubmit(true);
            }}
          ></Button>
          <span style={{ marginLeft: 10 }}></span>
          <Button
            shape="circle"
            size="large"
            onMouseDown={(e) => e.preventDefault()}
            icon={
              <SkipExport>
                <MessageOutlined />
              </SkipExport>
            }
            onClick={() => {
              onSubmit(false);
            }}
          ></Button>
        </div>
        <div style={{ width: "100%" }}>
          <Input.TextArea
            placeholder="Ctrl + S 发送    Ctrl + Enter 创建话题"
            autoSize={{ maxRows: 10 }}
            allowClear
            ref={inputRef}
            onFocus={(e) =>
              e.target.scrollIntoView({
                behavior: "smooth",
                block: "end",
              })
            }
            autoFocus={false}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyUp={(e) =>
              (e.key === "s" && e.altKey && onSubmit(false)) ||
              (e.key === "Enter" && e.ctrlKey && onSubmit(true))
            }
            onKeyDown={(e) =>
              e.key === "Tab" &&
              (e.preventDefault(),
              setInputText((v) =>
                onTextareaTab(
                  v,
                  e.currentTarget?.selectionStart,
                  e.currentTarget?.selectionEnd,
                  e.currentTarget,
                  e.shiftKey
                )
              ))
            }
          />
        </div>
      </div>
    </>
  );
}
export const MemoInputUtil = React.memo(InputUtil);
