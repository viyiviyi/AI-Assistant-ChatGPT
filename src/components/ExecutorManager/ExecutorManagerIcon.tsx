import React, { useContext, useEffect, useState } from 'react';
import { ExecutorManager } from './ExecutorManager';
import { Executor } from '@/Models/Executor';
import { CodeOutlined, SettingOutlined } from '@ant-design/icons';
import { Modal } from '../common/Modal';
import { useScreenSize } from '@/core/hooks/hooks';
import { ChatContext } from '@/core/ChatManagement';
import { executorService, useExecutor } from '@/core/executor/ExecutorService';

interface ExecutorManagerIconProps {
  onExecutorChange?: (executor: Executor | null, tools: any[]) => void;
}

export const ExecutorManagerIcon: React.FC<ExecutorManagerIconProps> = ({ onExecutorChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const screenSize = useScreenSize();
  const [iconColor, setIconColor] = useState<string>();
  const { chatMgt } = useContext(ChatContext);
  const { curtExecutor } = useExecutor();
  useEffect(() => {
    if (curtExecutor.current) {
      executorService.fetchHealth(curtExecutor.current).then((health) => {
        if (health) {
          setIconColor('#87d068');
        } else {
          setIconColor('#f50');
        }
      });
    } else {
      setIconColor(undefined);
    }
  }, [chatMgt.config.executorConfig, curtExecutor]);
  useEffect(() => {
    let t = setTimeout(() => {
      if (curtExecutor.current) {
        executorService.fetchHealth(curtExecutor.current).then((health) => {
          if (health) {
            setIconColor('#87d068');
          } else {
            setIconColor('#f50');
          }
        });
      } else {
        setIconColor(undefined);
      }
    }, 5 * 1000);
    return () => {
      clearInterval(t);
    };
  }, [curtExecutor]);
  return (
    <>
      <CodeOutlined style={{ padding: '5px 10px' }} color={iconColor} onClick={() => setIsModalOpen(!isModalOpen)} />

      <Modal
        title="执行器管理"
        open={isModalOpen}
        maskClosable={screenSize.width <= 500}
        onCancel={() => setIsModalOpen(false)}
        items={(cbs) => {
          return <ExecutorManager cbs={cbs} />;
        }}
      ></Modal>
    </>
  );
};
