import { ChatContext } from '@/core/ChatManagement';
import { Configuration, DefaultApi } from '@/core/drawApi';
import { init } from '@/core/drawApi/init';
import {
  ApiInstance,
  cacheStore,
  getSdApiBaseUrl,
  getTxt2ImgParmas,
  Img2ImgParams,
  saveSdApiBaseUrl,
  saveTxt2ImgParmas
} from '@/core/drawApi/storage';
import { useScreenSize } from '@/core/hooks/hooks';
import { useTxt2Img } from '@/core/hooks/txt2imgMsg';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { Button, Drawer, Flex, Form, Input, Spin } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { InputPane } from './InputPane';

export const DraePopup = ({
  text,
  open,
  topic,
  msg,
  onClose,
}: {
  text: string;
  open: boolean;
  topic: TopicMessage;
  msg: Message;
  onClose: () => void;
}) => {
  const { screenWidth } = useScreenSize();
  const [params, setParams] = useState<Img2ImgParams>({
    prompt: text,
    overrideSettings: {},
  });
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [extraUrl, setExtraUrl] = useState('');
  const [url, setUrl] = useState('');
  const { chatMgt } = useContext(ChatContext);
  const { txt2img } = useTxt2Img(chatMgt);
  useEffect(() => {
    let url = getSdApiBaseUrl();
    init(url).then(() => {
      let param = getTxt2ImgParmas() || {};
      param.overrideSettings = param?.overrideSettings || {};
      setParams(param);
      setBaseUrl(url);
      setLoading(false);
    });
  }, [url]);
  useEffect(() => {
    params.prompt = text;
  }, [params, text]);

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
                saveTxt2ImgParmas(params);
                saveSdApiBaseUrl(baseUrl);
                if (baseUrl != url) {
                  cacheStore.isInit = false;
                  setUrl(baseUrl);
                }
                if (extraUrl) {
                  ApiInstance.extra = new DefaultApi(new Configuration({ basePath: extraUrl.replace(/\/+$/, '') }));
                } else {
                  ApiInstance.extra = undefined;
                }
              }}
            >
              保存配置
            </Button>
            <Button
              type="primary"
              onClick={() => {
                saveTxt2ImgParmas(params);
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
