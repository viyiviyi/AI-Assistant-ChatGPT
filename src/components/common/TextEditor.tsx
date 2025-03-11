import { onTextareaTab } from '@/core/utils/utils';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/lib/input';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React, { Ref, useEffect, useState } from 'react';

export const TextEditor = React.forwardRef((props: TextAreaProps & { input: { text: string } }, ref: Ref<TextAreaRef> | undefined) => {
  const [text, setText] = useState(props.input.text);
  const [autoSize, setAutoSize] = useState(true);
  useEffect(() => {
    setText(props.input.text);
  }, [props.input]);
  return (
    <Input.TextArea
      {...props}
      value={text}
      autoSize={{ maxRows: autoSize ? 10 : 9999 }}
      onFocus={() => {
        setAutoSize(false);
      }}
      onBlur={() => {
        setAutoSize(true);
      }}
      onChange={(e) => {
        props.input.text = e.target.value;
        setText(props.input.text);
        if (props.onChange) props.onChange(e);
      }}
      onKeyDown={(e) =>
        e.key === 'Tab' &&
        (e.preventDefault(),
        setText((v) => onTextareaTab(v, e.currentTarget?.selectionStart, e.currentTarget?.selectionEnd, e.currentTarget, e.shiftKey)))
      }
      ref={ref}
    />
  );
});
TextEditor.displayName = 'TextEditor';
