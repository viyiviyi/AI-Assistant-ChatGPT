import { useScreenSize } from '@/core/hooks/hooks';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, theme, Typography } from 'antd';
import { useRouter } from 'next/router';
import React, { CSSProperties, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Hidden } from './Hidden';

export type ModalCallback = MutableRefObject<{
  okCallback: () => void;
  cancelCallback: () => void;
  cancel: () => void;
}>;
let zIndex = 100;
let urlHistory: string[] = [];

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
  onCancel?: () => false | void;
  onOk?: () => void | false;
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
  const router = useRouter();
  // const [thisHash, setUrlHash] = useState('');
  const thisHash = useRef('');
  const [show, setShow] = useState(open);

  const screenSize = useScreenSize();
  useEffect(() => {
    setShow(open);
  }, [open]);

  const callback = useRef({
    okCallback: () => {},
    cancelCallback: () => {},
    cancel: () => {},
  });

  const okClose = useCallback(() => {
    setShow((v) => {
      if (onOk() === false) {
        return v;
      }
      callback.current.okCallback();
      if (location.hash.includes(thisHash.current)) router.back();
      zIndex--;
      thisHash.current = '';
      return false;
    });
  }, [onOk, router]);

  const cancelClose = useCallback(() => {
    setShow((v) => {
      if (onCancel() === false) {
        return v;
      }
      callback.current.cancelCallback();
      if (location.hash.includes(thisHash.current)) router.back();
      zIndex--;
      thisHash.current = '';
      return false;
    });
  }, [onCancel, router]);

  useEffect(() => {
    callback.current.cancel = async () => cancelClose();
  }, [cancelClose]);

  useEffect(() => {
    if (!show) return;
    if (thisHash.current) return;
    if (urlHistory.includes(thisHash.current)) return;
    let _hash = '#' + zIndex;
    router.push(location.href.split('#')[0] + _hash);
    urlHistory.push(_hash);
    zIndex++;
    thisHash.current = _hash;
  }, [router, show]);

  const handleBackButton = useMemo(() => {
    return (ev: PopStateEvent | string) => {
      if (!thisHash.current) return;
      if (!urlHistory.length) return;
      if (!urlHistory.join(',').endsWith(thisHash.current)) return;
      // zIndex--;
      setTimeout(() => {
        // 延迟删除历史记录 防止异常关闭全部弹窗
        urlHistory.pop();
        cancelClose();
      }, 100);
      // thisHash.current = '';
    };
  }, [cancelClose]);

  useEffect(() => {
    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [handleBackButton]);

  if (!show) return <></>;
  if (screenSize.width <= 500)
    return (
      <Drawer
        title={title}
        placement={'bottom'}
        destroyOnClose={true}
        closable={false}
        maskClosable={maskClosable}
        onClose={() => cancelClose()}
        height={maxHight ? maxHight : 'auto'}
        style={{
          padding: 0,
          borderRadius: '10px 10px 0 0 ',
          ...style,
        }}
        width={width}
        styles={{ body: { padding: 0 } }}
        open={show}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            paddingLeft: token.paddingSM,
            paddingRight: token.paddingSM,
            paddingTop: token.paddingSM * 3,
            paddingBottom: token.paddingSM * 2,
            backgroundColor: token.colorBgElevated,
            maxHeight: maxHight ? maxHight : 'calc(100% - 40px)',
            overflow: 'auto',
            width: 'min(100%, 500px)',
            position: 'relative',
          }}
        >
          <Hidden hidden={closable === false}>
            <Button
              onClick={() => {
                cancelClose();
              }}
              type="text"
              icon={<CloseOutlined />}
              style={{
                position: 'absolute',
                zIndex: 999,
                top: 8,
                right: 8,
                opacity: 0.5,
              }}
            ></Button>
          </Hidden>
          <Hidden hidden={!title}>
            <Typography.Title level={4}>{title}</Typography.Title>
          </Hidden>
          <div style={{ ...bodyStyle }}>{children || items(callback)}</div>
          <Button.Group style={{ width: '100%', marginTop: 12 }}>
            <Hidden hidden={cancelText === null}>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  cancelClose();
                }}
              >
                {cancelText || '关闭'}
              </Button>
            </Hidden>
            <Hidden hidden={okText === null}>
              <Button
                block
                onClick={(e) => {
                  e.stopPropagation();
                  okClose();
                }}
              >
                {okText ?? '保存'}
              </Button>
            </Hidden>
          </Button.Group>
        </div>
      </Drawer>
    );
  const wrap = (
    <div
      onClick={
        maskClosable !== false
          ? () => {
              cancelClose();
            }
          : undefined
      }
      style={{
        position: 'fixed',
        width: '100vw',
        minHeight: '100%',
        maxHeight: '100%',
        height: '100%',
        left: 0,
        top: 0,
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: token.colorBgMask,
        alignItems: screenSize.width < 500 ? 'end' : 'center',
        zIndex: zIndex,
        ...style,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingLeft: token.paddingLG,
          paddingRight: token.paddingLG,
          paddingTop: token.paddingSM * 3,
          paddingBottom: token.paddingSM * 2,
          backgroundColor: token.colorBgElevated,
          borderRadius: token.borderRadiusLG,
          width: width || 'min(100%, 500px)',
          position: 'relative',
        }}
      >
        <Hidden hidden={closable === false}>
          <Button
            onClick={() => {
              cancelClose();
            }}
            type="text"
            icon={<CloseOutlined />}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0.5,
              zIndex: 999,
            }}
          ></Button>
        </Hidden>
        <Hidden hidden={!title}>
          <Typography.Text>{title}</Typography.Text>
        </Hidden>
        <div style={{ ...bodyStyle }}>{children || items(callback)}</div>
        <Button.Group
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 12,
          }}
        >
          <Hidden hidden={cancelText === null}>
            <Button
              block
              style={{ maxWidth: 200 }}
              onClick={(e) => {
                e.stopPropagation();
                cancelClose();
              }}
            >
              {cancelText || '关闭'}
            </Button>
          </Hidden>
          <Hidden hidden={okText === null}>
            <Button
              block
              style={{ maxWidth: 200 }}
              onClick={(e) => {
                e.stopPropagation();
                okClose();
              }}
            >
              {okText ?? '保存'}
            </Button>
          </Hidden>
        </Button.Group>
      </div>
    </div>
  );
  return createPortal(wrap as any, document.body);
};
