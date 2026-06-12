import { MultimodalInput, PendingFile } from '../common/MultimodalInput';
import { theme } from 'antd';
import { CSSProperties } from 'react';

export function AttachmentPanel({
  style,
  files,
  onFilesChange,
  maxCount = 10,
  accept = "image/*,.pdf,.doc,.docx,.txt,.md,.csv",
}: {
  style?: CSSProperties;
  files?: PendingFile[];
  onFilesChange: (files: PendingFile[]) => void;
  maxCount?: number;
  accept?: string;
}) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: token.borderRadius,
        backgroundColor: token.colorFillContent,
        boxShadow: token.boxShadowSecondary,
        ...style,
      }}
    >
      <MultimodalInput
        files={files}
        onFilesChange={onFilesChange}
        maxCount={maxCount}
        accept={accept}
      />
    </div>
  );
}
