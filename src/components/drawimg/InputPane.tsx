import { cacheStore, Img2ImgParams } from '@/core/drawApi/storage';
import { CaretRightOutlined } from '@ant-design/icons';
import { Collapse, Flex, Form, Input, InputNumber, Select } from 'antd';
import { useState } from 'react';
import { SkipExport } from '../common/SkipExport';
const panlProp = {
  forceRender: true,
  style: { padding: '0 8px' },
};

export const InputPane = ({ params }: { params: Img2ImgParams }) => {
  const [activityKey, setActivityKey] = useState<string[]>(['append_prompt','draw_params','models','other_params']);
  const [_, reload] = useState([]);
  return (
    <Form>
      <Form.Item label={'正面提示词'}>
        <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} value={params.prompt} onChange={(e) => (params.prompt = e.target.value)} />
      </Form.Item>
      <Form.Item label="负面提示词">
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          value={params.negativePrompt}
          onChange={(e) => (params.negativePrompt = e.target.value)}
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
                <Form.Item label="Styles">
                  <Select
                    mode="tags"
                    showSearch
                    value={params.styles}
                    onChange={(e) => {
                      params.styles = e;
                      reload([]);
                    }}
                  >
                    {cacheStore.styles?.map((v) => (
                      <Select.Option key={v.name} value={v.name}>
                        {v.name}
                      </Select.Option>
                    ))}
                  </Select>
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
                    <Select value={params.samplerIndex} onChange={(e) => (params.samplerIndex = e)}>
                      {cacheStore.samplerList?.map((v) => (
                        <Select.Option key={v.name} value={v.name}>
                          {v.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="调度器(Schedule type)" style={{ width: '50%' }}>
                    <Select value={params.scheduler} onChange={(e) => (params.scheduler = e)}>
                      {cacheStore.scheduleTypeList?.map((v) => (
                        <Select.Option key={v.name} value={v.name}>
                          {v.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Flex>
                <Flex gap={10}>
                  <Form.Item label="迭代步数(Steps)" style={{ width: '50%' }}>
                    <InputNumber value={params.steps} min={1} defaultValue={20} step={1} onChange={(e) => (params.steps = e ?? 1)} />
                  </Form.Item>
                  <Form.Item label="提示词相关性(CFG Scale)" style={{ width: '50%' }}>
                    <InputNumber value={params.cfgScale} min={1} step={0.1} defaultValue={7} onChange={(e) => (params.cfgScale = e ?? 1)} />
                  </Form.Item>
                </Flex>
                <Flex gap={10}>
                  <Form.Item label="图像宽度" style={{ width: '50%' }}>
                    <InputNumber value={params.width} min={64} step={64} onChange={(e) => (params.width = e ?? 64)} />
                  </Form.Item>
                  <Form.Item label="图像高度" style={{ width: '50%' }}>
                    <InputNumber value={params.height} min={64} step={64} onChange={(e) => (params.height = e ?? 64)} />
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
                <Form.Item label="大模型">
                  <Select
                    value={params.overrideSettings['sd_model_checkpoint']}
                    onChange={(e) => (params.overrideSettings['sd_model_checkpoint'] = e)}
                  >
                    {cacheStore.modelList?.map((v) => (
                      <Select.Option key={v.modelName} value={v.modelName}>
                        {v.modelName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="VAE">
                  <Select value={params.overrideSettings['sd_vae']} onChange={(e) => (params.overrideSettings['sd_vae'] = e)}>
                    {cacheStore.vaeList?.map((v) => (
                      <Select.Option key={v.modelName} value={v.modelName}>
                        {v.modelName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </>
            ),
          },
          // {
          //   key: 'hyper_resolution',
          //   label: <Checkbox>{'超分辨率'}</Checkbox>,
          //   ...panlProp,
          //   children: <></>,
          // },
          {
            key: 'other_params',
            label: '其他参数',
            ...panlProp,
            children: (
              <>
                <Form.Item label="CLIP 跳过层">
                  <InputNumber
                    min={1}
                    step={1}
                    max={12}
                    value={params.overrideSettings['CLIP_stop_at_last_layers'] as number}
                    onChange={(e) => (params.overrideSettings['CLIP_stop_at_last_layers'] = e || 1)}
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
