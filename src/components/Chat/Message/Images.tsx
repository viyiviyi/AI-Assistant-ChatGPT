import { LocalDbImg } from '@/components/common/LocalDbImg';
import { TempDraePopup } from '@/components/drawimg/TempDrawPopup';
import { ChatContext } from '@/core/ChatManagement';
import { ImageStore } from '@/core/db/ImageDb';
import { StableDiffusionProcessingTxt2Img, StableDiffusionProcessingTxt2ImgFromJSONTyped } from '@/core/drawApi';
import { downloadBase64Image, downloadBlob } from '@/core/utils/utils';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { DeleteOutlined, DownloadOutlined, InfoCircleOutlined, PlusOutlined, RotateRightOutlined, SwapOutlined } from '@ant-design/icons';
import { Flex, Image as AntdImage, message, Space } from 'antd';
import copy from 'copy-to-clipboard';
import { useRouter } from 'next/router';
import { useContext, useEffect, useMemo, useState } from 'react';

export const Images = ({ msg, topic }: { msg: Message; topic: TopicMessage }) => {
  const [currentIdx, setCurrentIdx] = useState<number | undefined>(undefined);
  const { chatMgt: chat } = useContext(ChatContext);
  const [imageIds, setImageIds] = useState(msg.imageIds || []);
  const [popup, setPopup] = useState(false);
  const [info, setInfo] = useState<StableDiffusionProcessingTxt2Img>({});
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  useEffect(() => {
    setImageIds([...(msg.imageIds || [])]);
  }, [msg.imageIds]);
  const handleBackButton = useMemo(() => {
    return (ev: PopStateEvent | string) => {
      setPopup((p) => {
        if (p) {
          return false;
        }
        setCurrentIdx(undefined);
        return p;
      });
    };
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handleBackButton);
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [handleBackButton]);
  return (
    <Flex gap={5} wrap={'wrap'}>
      {contextHolder}
      <TempDraePopup
        open={popup}
        info={info}
        msg={msg}
        topic={topic}
        onClose={() => {
          router.back();
        }}
      />
      <AntdImage.PreviewGroup
        preview={{
          visible: !popup && currentIdx !== undefined,
          current: currentIdx,
          onVisibleChange(value, prevValue, current) {
            if (!prevValue && value) {
              router.push(location.href.split('#')[0] + '#image');
            } else if (!value && prevValue) {
              router.back();
              return;
            }
            setCurrentIdx(value ? current : undefined);
          },
          onChange(current) {
            setCurrentIdx(current);
          },
          toolbarRender: (
            _,
            { transform: { scale }, current, actions: { onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn } }
          ) => (
            <Space size={18} className="toolbar-wrapper" style={{ fontSize: 25 }}>
              {(msg.imagesAlts || {})[imageIds[current || 0]] && (
                <PlusOutlined
                  onClick={() => {
                    let info = (msg.imagesAlts || {})[imageIds[current || 0]];
                    if (!info) return;
                    let json = info ? JSON.parse(info) : {};
                    let param = StableDiffusionProcessingTxt2ImgFromJSONTyped(json, false);
                    setInfo(param);
                    router.push(location.href.split('#')[0] + '#imageAdd');
                    setPopup(true);
                  }}
                />
              )}
              {(msg.imagesAlts || {})[imageIds[current || 0]] && (
                <InfoCircleOutlined
                  disabled={scale === 50}
                  onClick={() => {
                    let info = (msg.imagesAlts || {})[imageIds[current || 0]];
                    if (!info) return;
                    let json = info ? JSON.parse(info) : {};
                    if (!json.infotexts) return messageApi.error('无可复制数据');
                    if (copy(json.infotexts)) {
                      messageApi.success('已复制参数');
                    }
                  }}
                />
              )}
              <SwapOutlined rotate={90} onClick={onFlipY} />
              <SwapOutlined onClick={onFlipX} />
              {/* <RotateLeftOutlined onClick={onRotateLeft} /> */}
              <RotateRightOutlined onClick={onRotateRight} />
              <DownloadOutlined
                onClick={() => {
                  let info = (msg.imagesAlts || {})[imageIds[current || 0]];
                  let json = info ? JSON.parse(info || '{}') : {};
                  let param = StableDiffusionProcessingTxt2ImgFromJSONTyped(json, false);
                  let id = msg.imageIds && msg.imageIds[current];
                  if (id == 'error' || id == 'loading' || !id) return;
                  ImageStore.getInstance()
                    .getImage(id)
                    .then((res) => {
                      let fileName = `${new Date().getFullYear()}${(new Date().getMonth() + 1).toFixed(0).padStart(2, '0')}${new Date()
                        .getDate()
                        .toFixed(0)
                        .padStart(2, '0')}.${(Date.now() / 1000).toFixed(0).substring(3)}.${param.width}.${param.height} + .png`;
                      if (typeof res == 'string') {
                        downloadBase64Image(res, fileName);
                      } else if (typeof res == 'object') {
                        downloadBlob(res, fileName);
                      }
                    });
                }}
              />
              {/* <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
              <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} /> */}
              <DeleteOutlined
                style={{ marginLeft: 20 }}
                onClick={() => {
                  let id = imageIds![current];
                  if (id != 'error' && id != 'loading') {
                    ImageStore.getInstance().deleteImage([id]);
                  }
                  msg.imageIds?.splice(current, 1);
                  setCurrentIdx(current == msg.imageIds?.length ? current - 1 : current);
                  chat.pushMessage(msg).then((msg) => {
                    setImageIds([...(msg.imageIds || [])]);
                  });
                }}
              />
            </Space>
          ),
        }}
      >
        {imageIds.map((id, i) => {
          if (id == 'error') {
            return (
              <AntdImage
                key={id + i}
                style={{ paddingTop: 25, paddingBottom: 25, paddingLeft: 5, paddingRight: 5 }}
                height={100}
                src={'/images/error.png'}
              />
            );
          }
          if (id == 'loading') {
            return (
              <AntdImage
                key={id + i}
                style={{ paddingTop: 25, paddingBottom: 25, paddingLeft: 5, paddingRight: 5 }}
                height={100}
                src={'/images/loading.gif'}
              />
            );
          }
          return <LocalDbImg key={id + i} id={id} alt={(msg.imagesAlts || {})[id]} />;
        })}
      </AntdImage.PreviewGroup>
    </Flex>
  );
};
