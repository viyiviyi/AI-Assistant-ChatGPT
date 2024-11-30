import { DefaultApi } from './apis';
import { Configuration } from './runtime';
import { ApiInstance, cacheStore, getTxt2ImgParmas } from './storage';

export async function init(serverUrl: string) {
  if (cacheStore.isInit) return;
  ApiInstance.current = new DefaultApi(new Configuration({ basePath: serverUrl.replace(/\/+$/, '') }));
  const Api = ApiInstance.current;
  cacheStore.isInit = true;
  try {
    await Promise.all([
      Api.getSamplersSdapiV1SamplersGet().then((res) => (cacheStore.samplerList = res)),
      Api.getSchedulersSdapiV1SchedulersGet().then((res) => (cacheStore.scheduleTypeList = res)),
      Api.getPromptStylesSdapiV1PromptStylesGet().then((res) => (cacheStore.styles = res)),
      Api.getUpscalersSdapiV1UpscalersGet().then((res) => (cacheStore.upscalers = res)),
      Api.getSdModelsSdapiV1SdModelsGet().then((res) => (cacheStore.modelList = res)),
      Api.getSdVaesSdapiV1SdVaeGet().then((res) => (cacheStore.vaeList = res)),
    ]).then(() => {
      let params = getTxt2ImgParmas();
      params.width = params.width || 512;
      params.height = params.height || 768;
      params.steps = params.steps || 20;
      params.cfgScale = params.cfgScale || 7;
      params.batchSize = params.batchSize || 1;
      params.seed = params.seed || -1;
      params.scheduler = params.scheduler || (cacheStore.upscalers || [{}])[0]?.modelName;
      params.samplerIndex = params.samplerIndex || (cacheStore.samplerList || [{}])[0]?.name;
      params.overrideSettings = params.overrideSettings || {};
      params.overrideSettings['sd_model_checkpoint'] =
        params.overrideSettings['sd_model_checkpoint'] || (cacheStore.modelList || [{}])[0]?.modelName || '';
      params.overrideSettings.CLIP_stop_at_last_layers = params.overrideSettings.CLIP_stop_at_last_layers || 1;
    });
  } catch (error) {
    cacheStore.isInit = false;
  }
}
