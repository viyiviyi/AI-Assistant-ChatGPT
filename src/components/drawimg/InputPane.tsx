import { ApiInstance, cacheStore, Img2ImgParams } from '@/core/drawApi/storage';
import { CaretRightOutlined, LoadingOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Checkbox, Collapse, Flex, Form, Input, InputNumber, Select } from 'antd';
import { useState } from 'react';
import { SkipExport } from '../common/SkipExport';
const panlProp = {
  forceRender: true,
  style: { padding: '0 8px' },
};

export const InputPane = ({ params }: { params: Img2ImgParams }) => {
  const [activityKey, setActivityKey] = useState<string[]>(['draw_params']);
  const [_, reload] = useState([]);
  const [syncModelIng, setSyncModelIng] = useState(false);
  const [syncVaeIng, setSyncVaeIng] = useState(false);
  return (
    <Form labelCol={{ xl: 6 }}>
      <Form.Item label={'正面提示词'} labelCol={{ xl: 3 }}>
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          value={params.prompt}
          onChange={(e) => ((params.prompt = e.target.value), reload([]))}
        />
      </Form.Item>
      <Form.Item label="负面提示词" labelCol={{ xl: 3 }}>
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          value={params.negativePrompt}
          onChange={(e) => ((params.negativePrompt = e.target.value), reload([]))}
        />
      </Form.Item>
      <Collapse
        // ghost
        bordered={false}
        activeKey={activityKey}
        onChange={(keys) => setActivityKey(keys as string[])}
        expandIcon={({ isActive }) => (
          <SkipExport>
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          </SkipExport>
        )}
        items={[
          {
            key: 'append_prompt',
            label: '附加prompt',
            ...panlProp,
            children: (
              <>
                <Form.Item
                  label="Styles"
                  labelCol={{ xl: 3 }}
                  extra={
                    <>
                      <p>prompt: {params.styles?.map((v) => cacheStore.styles?.find((f) => f.name == v)?.prompt).join(' ,')}</p>
                      <p>
                        negativePrompt: {params.styles?.map((v) => cacheStore.styles?.find((f) => f.name == v)?.negativePrompt).join(' ,')}
                      </p>
                    </>
                  }
                >
                  <Select
                    mode="tags"
                    showSearch
                    value={params.styles}
                    onChange={(e) => {
                      params.styles = e;
                      reload([]);
                    }}
                    allowClear
                  >
                    {cacheStore.styles?.map((v) => (
                      <Select.Option key={v.name} value={v.name}>
                        {v.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label={'前置正面'} labelCol={{ xl: 3 }}>
                  <Input.TextArea
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    value={params.prePrompt}
                    onChange={(e) => ((params.prePrompt = e.target.value), reload([]))}
                  />
                </Form.Item>
                <Form.Item label={'后置正面'} labelCol={{ xl: 3 }}>
                  <Input.TextArea
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    value={params.extraPrompt}
                    onChange={(e) => ((params.extraPrompt = e.target.value), reload([]))}
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'draw_params',
            label: '参数',
            ...panlProp,
            children: (
              <>
                <Flex gap={10}>
                  <Form.Item label="采样器(Sampler)" style={{ width: '50%' }}>
                    <Select value={params.samplerIndex} onChange={(e) => ((params.samplerIndex = e), reload([]))} allowClear>
                      {cacheStore.samplerList?.map((v) => (
                        <Select.Option key={v.name} value={v.name}>
                          {v.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="调度器类型" style={{ width: '50%' }}>
                    <Select value={params.scheduler} onChange={(e) => ((params.scheduler = e), reload([]))} allowClear>
                      {cacheStore.scheduleTypeList?.map((v) => (
                        <Select.Option key={v.name} value={v.name}>
                          {v.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Flex>
                <Flex gap={10}>
                  <Form.Item label="迭代步数" style={{ width: '50%' }}>
                    <InputNumber
                      value={params.steps}
                      defaultValue={20}
                      step={1}
                      onChange={(e) => ((params.steps = Math.max(1, e ?? 1)), reload([]))}
                    />
                  </Form.Item>
                  <Form.Item label="提示词相关性" style={{ width: '50%' }}>
                    <InputNumber
                      value={params.cfgScale}
                      step={0.1}
                      defaultValue={7}
                      onChange={(e) => ((params.cfgScale = Math.max(1, e ?? 1)), reload([]))}
                    />
                  </Form.Item>
                </Flex>
                <Flex gap={10}>
                  <Form.Item label="图像宽度" style={{ width: '50%' }}>
                    <InputNumber value={params.width} step={64} onChange={(e) => ((params.width = e ?? undefined), reload([]))} />
                  </Form.Item>
                  <Form.Item label="图像高度" style={{ width: '50%' }}>
                    <InputNumber value={params.height} step={64} onChange={(e) => ((params.height = e ?? undefined), reload([]))} />
                  </Form.Item>
                </Flex>
                <Flex gap={10}>
                  <Form.Item label="随机种子" style={{ width: '50%' }}>
                    <InputNumber value={params.seed} step={1} onChange={(e) => ((params.seed = Math.max(-1, e ?? -1)), reload([]))} />
                  </Form.Item>
                  <Form.Item label="生成数量" style={{ width: '50%' }}>
                    <InputNumber
                      value={params.batchSize}
                      step={1}
                      onChange={(e) => ((params.batchSize = Math.max(1, e ?? 1)), reload([]))}
                    />
                  </Form.Item>
                </Flex>
              </>
            ),
          },
          {
            key: 'models',
            label: '模型',
            ...panlProp,
            children: (
              <>
                <Form.Item label="大模型" labelCol={{ xl: 3 }}>
                  <Flex>
                    <Select
                      value={params.overrideSettings['sd_model_checkpoint']}
                      onChange={(e) => ((params.overrideSettings['sd_model_checkpoint'] = e), reload([]))}
                      allowClear
                    >
                      {cacheStore.modelList?.map((v) => (
                        <Select.Option key={v.modelName} value={v.modelName}>
                          {v.modelName}
                        </Select.Option>
                      ))}
                    </Select>
                    <Button
                      onClick={() => {
                        if (syncModelIng) return;
                        setSyncModelIng(true);
                        ApiInstance.current.refreshCheckpointsSdapiV1RefreshCheckpointsPost().then(() => {
                          ApiInstance.current.getSdModelsSdapiV1SdModelsGet().then((res) => {
                            cacheStore.modelList = res;
                            setSyncModelIng(false);
                          });
                        });
                      }}
                      icon={syncModelIng ? <LoadingOutlined /> : <SyncOutlined />}
                    ></Button>
                  </Flex>
                </Form.Item>
                <Form.Item label="VAE" labelCol={{ xl: 3 }}>
                  <Flex>
                    <Select
                      value={params.overrideSettings['sd_vae']}
                      onChange={(e) => ((params.overrideSettings['sd_vae'] = e), reload([]))}
                      allowClear
                    >
                      {cacheStore.vaeList?.map((v) => (
                        <Select.Option key={v.modelName} value={v.modelName}>
                          {v.modelName}
                        </Select.Option>
                      ))}
                    </Select>
                    <Button
                      onClick={() => {
                        if (syncVaeIng) return;
                        setSyncVaeIng(true);
                        ApiInstance.current.refreshVaeSdapiV1RefreshVaePost().then(() => {
                          ApiInstance.current.getSdVaesSdapiV1SdVaeGet().then((res) => {
                            cacheStore.vaeList = res;
                            setSyncVaeIng(false);
                          });
                        });
                      }}
                      icon={syncVaeIng ? <LoadingOutlined /> : <SyncOutlined />}
                    ></Button>
                  </Flex>
                </Form.Item>
              </>
            ),
          },
          {
            key: 'hyper_resolution',
            label: (
              <Checkbox checked={params.enableHr} onChange={(e) => ((params.enableHr = e.target.checked), reload([]))}>
                {'超分辨率'}
              </Checkbox>
            ),
            ...panlProp,
            children: (
              <>
                <Form.Item label="超分算法" labelCol={{ xl: 3 }}>
                  <Select value={params.hrUpscaler} onChange={(e) => ((params.hrUpscaler = e), reload([]))} allowClear>
                    {cacheStore.upscalers?.map((v) => (
                      <Select.Option key={v.name} value={v.name}>
                        {v.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Flex gap={10}>
                  <Form.Item label="重绘幅度" labelCol={{ xl: 6 }} style={{ width: '50%' }}>
                    <InputNumber
                      value={params.denoisingStrength}
                      step={0.01}
                      onChange={(e) => ((params.denoisingStrength = Math.max(0.57, e ?? 1)), reload([]))}
                    />
                  </Form.Item>
                  <Form.Item label="放大倍率" labelCol={{ xl: 6 }} style={{ width: '50%' }}>
                    <InputNumber
                      value={params.hrScale}
                      step={0.01}
                      onChange={(e) => ((params.hrScale = Math.max(1.5, e ?? 1)), reload([]))}
                    />
                  </Form.Item>
                </Flex>
                <Form.Item label="迭代步数" labelCol={{ xl: 3 }}>
                  <InputNumber
                    value={params.hrSecondPassSteps}
                    step={1}
                    onChange={(e) => ((params.hrSecondPassSteps = Math.max(0, e ?? 1)), reload([]))}
                  />
                </Form.Item>
              </>
            ),
          },
          {
            key: 'other_params',
            label: '其他参数',
            ...panlProp,
            children: (
              <>
                <Form.Item label="CLIP 跳过层" labelCol={{ xl: 3 }}>
                  <InputNumber
                    min={1}
                    step={1}
                    max={12}
                    value={params.overrideSettings['CLIP_stop_at_last_layers'] as number}
                    onChange={(e) => ((params.overrideSettings['CLIP_stop_at_last_layers'] = e || 1), reload([]))}
                  />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </Form>
  );
};
