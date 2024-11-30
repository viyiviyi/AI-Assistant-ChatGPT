import { reloadTopic } from '@/components/Chat/Message/MessageList';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { useCallback, useEffect } from 'react';
import { ChatManagement } from '../ChatManagement';
import { init } from '../drawApi/init';
import { ApiInstance, getSdApiBaseUrl, Img2ImgParams } from '../drawApi/storage';
import { getUuid } from '../utils/utils';

export function useTxt2Img(chat: ChatManagement) {
  useEffect(() => {
    let url = getSdApiBaseUrl();
    init(url).then(() => {});
  }, []);
  const txt2img = useCallback(async function (topic: TopicMessage, msg: Message, param: Img2ImgParams) {
    let idx = topic.messages.indexOf(msg);
    let imgMsg: Message = {
      id: getUuid(),
      groupId: msg.groupId,
      topicId: topic.id,
      ctxRole: 'system',
      createTime: Date.now(),
      timestamp: msg.timestamp + 1,
      text: '正在生成图片...',
      skipCtx: true,
    };
    topic.messages.splice(idx, 1, ...[msg, imgMsg]);
    reloadTopic(topic.id);
    ApiInstance.current
      .text2imgapiSdapiV1Txt2imgPost({ stableDiffusionProcessingTxt2Img: param })
      .then((res) => {
        imgMsg.text = '';
        res.images?.forEach((base64) => {
          imgMsg.text += `![${res.info}](data:image/png;base64,${base64})\n`;
        });
        reloadTopic(topic.id, imgMsg.id);
      })
      .catch((a) => {
        imgMsg.text = '生成图片失败';
        reloadTopic(topic.id, imgMsg.id);
      });
  }, []);
  return { txt2img };
}
