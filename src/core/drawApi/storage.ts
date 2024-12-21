import { DefaultApi } from './apis';
import {
  PromptStyleItem,
  SamplerItem,
  SchedulerItem,
  SdModelItem,
  SdVaeItem,
  StableDiffusionProcessingTxt2Img,
  UpscalerItem
} from './models';
import { Configuration } from './runtime';

export type Img2ImgParams = StableDiffusionProcessingTxt2Img & {
  overrideSettings: { [key: string]: string | number | boolean };
  extraPrompt?: string;
  prePrompt?: string;
};

export const cacheStore: {
  samplerList?: SamplerItem[];
  scheduleTypeList?: SchedulerItem[];
  upscalers?: UpscalerItem[];
  styles?: PromptStyleItem[];
  modelList?: SdModelItem[];
  vaeList?: SdVaeItem[];
  isInit: boolean;
} = { isInit: false };

export let ApiInstance: { current: DefaultApi; extra?: DefaultApi } = { current: new DefaultApi(new Configuration({})), extra: undefined };

let baseUrl = '';
export const saveSdApiBaseUrl = (url: string) => {
  baseUrl = url;
  if (window) localStorage.setItem('sdApiBaseUrl', url);
};
export const getSdApiBaseUrl = () => {
  if (baseUrl) return baseUrl;
  if (window) baseUrl = localStorage.getItem('sdApiBaseUrl') || '';
  return baseUrl;
};

let txt2ImgParams: Img2ImgParams;
export const getTxt2ImgParmas = () => {
  if (txt2ImgParams) return txt2ImgParams;
  if (window) txt2ImgParams = JSON.parse(localStorage.getItem('txt2ImgParams') || '{}');
  return txt2ImgParams;
};

export const saveTxt2ImgParmas = (params: Img2ImgParams) => {
  txt2ImgParams = params;
  if (window) localStorage.setItem('txt2ImgParams', JSON.stringify(params));
};
