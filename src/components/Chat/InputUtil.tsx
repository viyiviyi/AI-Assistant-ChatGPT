import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { usePushMessage, useScreenSize } from "@/core/hooks/hooks";
import {
  activityScroll,
  onTextareaTab,
  scrollToBotton,
  scrollToTop
} from "@/core/utils/utils";
import { CtxRole } from "@/Models/CtxRole";
import styleCss from "@/styles/index.module.css";
import {
  AlignLeftOutlined,
  CaretLeftOutlined,
  CommentOutlined,
  MessageOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined
} from "@ant-design/icons";
import { Button, Drawer, theme, Typography } from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { MemoBackgroundImage } from "../common/BackgroundImage";
import { SkipExport } from "../common/SkipExport";
import { TextEditor } from "../common/TextEditor";
import { MemoNavigation } from "../Nav/Navigation";
import { MessageContext } from "./Chat";
import { CtxRoleButton } from "./CtxRoleButton";

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
  const [inputText, setInputText] = useState({ text: "" });
  const [loading, setLoading] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const {
    chatMgt: chat,
    activityTopic,
    setActivityTopic,
    reloadNav,
  } = useContext(ChatContext);
  const {
    onlyOne,
    setOnlyOne,
    closeAll,
    setCloseAll: setCloasAll,
  } = useContext(MessageContext);
  const screenSize = useScreenSize();
  const { token } = theme.useToken();
  const [role, setRole] = useState<[CtxRole, boolean]>(["user", true]);
  const { pushMessage } = usePushMessage(chat);
  const [showCtxRoleButton, setShowCtxRoleButton] = useState(false);
  objs.setInput = (input: string | ((s: string) => string)) => {
    let next_input = inputText.text;
    if (typeof input == "function") {
      next_input = input(next_input);
    } else {
      next_input = input;
    }
    setInputText({ text: ChatManagement.parseText(next_input) });
    setRole([ChatManagement.parseTextToRole(next_input), role[1]]);
  };
  useEffect(() => {
    if (inputText.text) {
      setShowCtxRoleButton(true);
    } else {
      setShowCtxRoleButton(false);
    }
  }, [inputText]);
  /**
   * 提交内容
   * @param isNewTopic 是否开启新话题
   * @returns
   */
  const onSubmit = useCallback(
    async function (isNewTopic: boolean) {
      let text = inputText.text.trim();
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
      activityScroll({ botton: true });
      setLoading((v) => ++v);
      setInputText({ text: "" });
      pushMessage(text, topic.messages.length || 0, topic, role, () => {
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
          backgroundColor: token.colorFillContent,
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
          {showCtxRoleButton && (
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
                className={styleCss.roll_button_item}
                icon={<VerticalAlignTopOutlined />}
                onClick={() => {
                  activityScroll({ top: true });
                  if (!activityTopic) return;
                  if (onlyOne) {
                    scrollToTop();
                  } else scrollToTop(activityTopic.id);
                }}
              />
              <span style={{ marginTop: 10 }}></span>
              <Button
                shape={"circle"}
                size="large"
                className={styleCss.roll_button_item}
                icon={<VerticalAlignBottomOutlined />}
                onClick={() => {
                  activityScroll({ botton: true });
                  if (!activityTopic) return;
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
            styles={{ body: { padding: "1em 0" } }}
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
              flex: 1,
              width: 0,
            }}
            ellipsis={true}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (onlyOne) {
                setShowNav(true);
              } else {
                setOnlyOne(true);
              }
            }}
          >
            {activityTopic?.name}
          </Typography.Text>
          <span style={{ flex: 1 }}></span>
          {/* <Button
            shape="round"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {}}
          >
            <SkipExport>
              <PlusOutlined />
            </SkipExport>
          </Button> */}
          <span style={{ marginLeft: 10 }}></span>
          <Button
            shape="round"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              setOnlyOne(false);
              setCloasAll(!closeAll);
            }}
          >
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
          <TextEditor
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
            onChange={(e) => {
              if (e.target.value) {
                setShowCtxRoleButton(true);
              } else {
                setShowCtxRoleButton(false);
              }
            }}
            input={inputText}
            autoFocus={false}
            onKeyUp={(e) =>
              (e.key === "s" && e.altKey && onSubmit(false)) ||
              (e.key === "Enter" && e.ctrlKey && onSubmit(true))
            }
            onKeyDown={(e) =>
              e.key === "Tab" &&
              (e.preventDefault(),
              setInputText((v) => ({
                text: onTextareaTab(
                  v.text,
                  e.currentTarget?.selectionStart,
                  e.currentTarget?.selectionEnd,
                  e.currentTarget,
                  e.shiftKey
                ),
              })))
            }
          />
        </div>
      </div>
    </>
  );
}
export const MemoInputUtil = React.memo(InputUtil);
