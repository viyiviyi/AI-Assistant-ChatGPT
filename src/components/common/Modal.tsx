import { useScreenSize } from "@/core/hooks";
import { CloseOutlined } from "@ant-design/icons";
import { Button, Drawer, theme, Typography } from "antd";
import React, {
  CSSProperties,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Hidden } from "./Hidden";

export type ModalCallback = MutableRefObject<{
  okCallback: () => void;
  cancelCallback: () => void;
  cancel: () => void;
}>;

export const useModalContext = () => {};

export const Modal = ({
  open = false,
  onCancel = () => {},
  items = () => undefined,
  onOk = () => {},
  maskClosable,
  maxHight,
  style,
  bodyStyle,
  okText,
  cancelText,
  closable,
  children,
  title,
  width,
}: {
  open: boolean;
  items?: (cbs: ModalCallback) => React.ReactNode;
  onCancel?: () => void;
  onOk?: () => void;
  maxHight?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children?: React.ReactNode;
  closable?: boolean;
  title?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  maskClosable?: boolean;
  width?: string | number | undefined;
}) => {
  const { token } = theme.useToken();
  const screenSize = useScreenSize();
  const cancel = useCallback(() => {
    callback.current.cancelCallback();
    onCancel();
  }, [onCancel]);
  const ok = useCallback(() => {
    callback.current.okCallback();
    onOk();
  }, [onOk]);
  const callback = useRef({
    okCallback: () => {},
    cancelCallback: () => {},
    cancel: cancel,
  });
  useEffect(() => {
    callback.current.cancel = cancel;
  }, [cancel]);
  if (screenSize.width <= 500)
    return (
      <Drawer
        title={title}
        placement={"bottom"}
        destroyOnClose={true}
        closable={false}
        maskClosable={maskClosable}
        onClose={cancel}
        height={maxHight ? maxHight : "auto"}
        style={{
          padding: 0,
          borderRadius: "10px 10px 0 0 ",
          ...style,
        }}
        width={width}
        bodyStyle={{ padding: 0 }}
        open={open}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            paddingLeft: token.paddingSM,
            paddingRight: token.paddingSM,
            paddingTop: token.paddingSM * 3,
            paddingBottom: token.paddingSM * 2,
            backgroundColor: token.colorBgElevated,
            maxHeight: maxHight ? maxHight : "calc(100% - 40px)",
            overflow: "auto",
            width: "min(100%, 500px)",
            position: "relative",
          }}
        >
          <Hidden hidden={closable === false}>
            <Button
              onClick={() => {
                cancel();
              }}
              type="text"
              icon={<CloseOutlined />}
              style={{ position: "absolute", top: 8, right: 8, opacity: 0.5 }}
            ></Button>
          </Hidden>
          <Hidden hidden={!title}>
            <Typography.Title level={4}>{title}</Typography.Title>
          </Hidden>
          <div style={{ ...bodyStyle }}>{children || items(callback)}</div>
          <Button.Group style={{ width: "100%" }}>
            <Hidden hidden={cancelText === null}>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  cancel();
                }}
              >
                {cancelText || "关闭"}
              </Button>
            </Hidden>
            <Hidden hidden={okText === null}>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  ok();
                }}
              >
                {okText ?? "保存"}
              </Button>
            </Hidden>
          </Button.Group>
        </div>
      </Drawer>
    );

  return (
    <Hidden hidden={!open}>
      <div
        onClick={
          maskClosable !== false
            ? () => {
                cancel();
              }
            : undefined
        }
        style={{
          position: "fixed",
          width: "100vw",
          minHeight: "100%",
          maxHeight: "100%",
          height: "100%",
          left: 0,
          top: 0,
          display: "flex",
          justifyContent: "center",
          backgroundColor: token.colorBgMask,
          alignItems: screenSize.width < 500 ? "end" : "center",
          zIndex: 999,
          ...style,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            paddingLeft: token.paddingLG,
            paddingRight: token.paddingLG,
            paddingTop: token.paddingSM * 2,
            paddingBottom: token.paddingSM * 2,
            backgroundColor: token.colorBgElevated,
            borderRadius: token.borderRadiusLG,
            // maxHeight: maxHight ? maxHight : "calc(100% - 40px)",
            // overflow: "auto",
            width: width || "min(100%, 500px)",
            position: "relative",
          }}
        >
          <Hidden hidden={closable === false}>
            <Button
              onClick={() => {
                cancel();
              }}
              type="text"
              icon={<CloseOutlined />}
              style={{ position: "absolute", top: 8, right: 8, opacity: 0.5 }}
            ></Button>
          </Hidden>
          <Hidden hidden={!title}>
            <Typography.Text>{title}</Typography.Text>
          </Hidden>
          <div style={{ ...bodyStyle }}>{children || items(callback)}</div>
          <Button.Group style={{ width: "100%" }}>
            <Hidden hidden={cancelText === null}>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  cancel();
                }}
              >
                {cancelText || "关闭"}
              </Button>
            </Hidden>
            <Hidden hidden={okText === null}>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  ok();
                }}
              >
                {okText ?? "保存"}
              </Button>
            </Hidden>
          </Button.Group>
        </div>
      </div>
    </Hidden>
  );
};
