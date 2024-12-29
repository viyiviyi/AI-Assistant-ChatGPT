import { ChatContext } from '@/core/ChatManagement';
import { StableDiffusionProcessingTxt2Img } from '@/core/drawApi';
import { init } from '@/core/drawApi/init';
import { cacheStore, getSdApiBaseUrl, Img2ImgParams, saveSdApiBaseUrl } from '@/core/drawApi/storage';
import { useScreenSize } from '@/core/hooks/hooks';
import { useTxt2Img } from '@/core/hooks/txt2imgMsg';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { Button, Drawer, Flex, Form, Input, Spin } from 'antd';
import { useContext, useEffect, useMemo, useState } from 'react';
import { InputPane } from './InputPane';

export const TempDraePopup = ({
  info,
  open,
  topic,
  msg,
  onClose,
}: {
  info: StableDiffusionProcessingTxt2Img;
  open: boolean;
  topic: TopicMessage;
  msg: Message;
  onClose: () => void;
}) => {
  const { screenWidth } = useScreenSize();
  const params = useMemo<Img2ImgParams>(() => ({ ...info, overrideSettings: {} }), [info]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [extraUrl, setExtraUrl] = useState('');
  const [url, setUrl] = useState('');
  const { chatMgt } = useContext(ChatContext);
  const { txt2img } = useTxt2Img(chatMgt);
  useEffect(() => {
    let url = getSdApiBaseUrl();
    init(url).then(() => {
      setBaseUrl(url);
      setLoading(false);
    });
  }, [url]);
  return (
    <Drawer
      forceRender={false}
      open={open}
      size={'large'}
      onClose={() => onClose()}
      placement={screenWidth > 600 ? 'right' : 'bottom'}
      height={'70%'}
      footer={
        <>
          <Flex gap={10} style={{ padding: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => onClose()}>取消</Button>
            <Button
              type="primary"
              onClick={() => {
                saveSdApiBaseUrl(baseUrl);
                if (baseUrl != url) {
                  cacheStore.isInit = false;
                  init(baseUrl).then(() => {
                    setUrl(baseUrl);
                    txt2img(topic, msg, { ...params });
                  });
                } else {
                  txt2img(topic, msg, { ...params });
                }
              }}
            >
              生成图片
            </Button>
          </Flex>
        </>
      }
    >
      <Spin spinning={loading}>
        <InputPane params={params!} />
      </Spin>
      <Form style={{ padding: 8 }}>
        <Form.Item label="服务地址">
          <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </Form.Item>
        <Form.Item label="临时地址">
          <Input value={extraUrl} onChange={(e) => setExtraUrl(e.target.value)} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
