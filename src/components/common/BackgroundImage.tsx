import { ChatContext } from '@/core/ChatManagement';
import React, { useContext } from 'react';

function BackgroundImage({ style, src }: { style?: React.CSSProperties; src?: string }) {
  const { bgConfig, chatMgt } = useContext(ChatContext);
  if (chatMgt.config.hiddenMask) bgConfig.opacity = 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        ...(src ? { ...bgConfig, backgroundImage: src } : bgConfig),
        ...style,
      }}
    ></div>
  );
}

export const MemoBackgroundImage = React.memo(BackgroundImage);
