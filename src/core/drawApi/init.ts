import { DefaultApi } from './apis';
import { Configuration } from './runtime';
import { ApiInstance, cacheStore } from './storage';

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
    ]);
  } catch (error) {
    cacheStore.isInit = false;
  }
}
