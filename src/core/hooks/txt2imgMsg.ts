import { reloadTopic } from '@/components/Chat/Message/MessageList';
import { Message } from '@/Models/DataBase';
import { TopicMessage } from '@/Models/Topic';
import { useCallback, useEffect } from 'react';
import { ChatManagement } from '../ChatManagement';
import { ImageStore } from '../db/ImageDb';
import { init } from '../drawApi/init';
import { ApiInstance, getSdApiBaseUrl, Img2ImgParams } from '../drawApi/storage';
import { TaskQueue } from '../utils/TaskQueue';

let quequ = new TaskQueue();
let extraQuequ = new TaskQueue();
let currentQuequ = quequ;
export function useTxt2Img(chat: ChatManagement) {
  useEffect(() => {
    let url = getSdApiBaseUrl();
    init(url).then(() => {});
  }, []);
  const txt2img = useCallback(
    async function (topic: TopicMessage, msg: Message, param: Img2ImgParams) {
      if (msg.imageIds) msg.imageIds.push('loading');
      else msg.imageIds = ['loading'];
      msg.imageIds = [...msg.imageIds];
      reloadTopic(topic.id, msg.id);
      currentQuequ = currentQuequ == extraQuequ ? quequ : ApiInstance.extra ? extraQuequ : quequ;
      currentQuequ
        .enqueue(async () => {
          if (!topic.messageMap[msg.id]) return { images: undefined };
          if (!msg.imageIds?.includes('loading')) return { images: undefined };
          return await (currentQuequ == extraQuequ && ApiInstance.extra
            ? ApiInstance.extra
            : ApiInstance.current
          ).text2imgapiSdapiV1Txt2imgPost({
            stableDiffusionProcessingTxt2Img: {
              ...param,
              prompt: (param.prePrompt ? param.prePrompt + ' ,' : '') + param.prompt + (param.extraPrompt ? ' ,' + param.extraPrompt : ''),
            },
          });
        })
        .then((res) => {
          if (!topic.messageMap[msg.id]) return;
          if (!res.images) return;
          res.images?.forEach((base64) => {
            // base64 = 'data:image/png;base64,' + base64;
            const imageBuffer = Buffer.from(base64, 'base64');
            const imageView = new Uint8Array(imageBuffer);
            let image = new Blob([imageView], { type: 'image/png' });
            let imgId = ImageStore.getInstance().saveImage(image);
            msg.imageIds!.push(imgId);
            msg.imagesAlts = {
              ...msg.imagesAlts,
              [imgId]: JSON.stringify({ ...res.parameters, infotexts: JSON.parse(res.info).infotexts }),
            };
          });
          let firstLoadingIdx = msg.imageIds!.indexOf('loading');
          if (firstLoadingIdx != -1) msg.imageIds!.splice(firstLoadingIdx, 1);
          msg.imageIds = [...(msg.imageIds || [])];
          chat.pushMessage(msg).then((msg) => {
            reloadTopic(topic.id, msg.id);
          });
        })
        .catch((err) => {
          console.error(err);
          if (!topic.messageMap[msg.id]) return;
          let firstLoadingIdx = msg.imageIds!.indexOf('loading');
          if (firstLoadingIdx != -1) msg.imageIds!.splice(firstLoadingIdx, 1, 'error');
          msg.imageIds = [...(msg.imageIds || [])];
          chat.pushMessage(msg).then((msg) => {
            reloadTopic(topic.id, msg.id);
          });
        });
    },
    [chat]
  );
  return { txt2img };
}
