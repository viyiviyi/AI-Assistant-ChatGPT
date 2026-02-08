import React, { useState } from 'react';
import { ExecutorManager } from './ExecutorManager';
import { Executor } from '@/Models/Executor';
import { CodeOutlined, SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Modal } from '../common/Modal';
import { useScreenSize } from '@/core/hooks/hooks';

interface ExecutorManagerIconProps {
  onExecutorChange?: (executor: Executor | null, tools: any[]) => void;
}

export const ExecutorManagerIcon: React.FC<ExecutorManagerIconProps> = ({ onExecutorChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const screenSize = useScreenSize();

  return (
    <>
      <CodeOutlined style={{ padding: '5px 10px' }} onClick={() => setIsModalOpen(!isModalOpen)} />

      <Modal
        title="执行器管理"
        open={isModalOpen}
        maskClosable={screenSize.width <= 500}
        onCancel={() => setIsModalOpen(false)}
        items={(cbs) => {
          return <ExecutorManager cbs={cbs}  />;
        }}
      ></Modal>
    </>
  );
};
