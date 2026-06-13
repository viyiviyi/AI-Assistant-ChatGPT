import { onTextareaTab } from '@/core/utils/utils';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/lib/input';
import { TextAreaRef } from 'antd/lib/input/TextArea';
import React, { Ref, useEffect, useState } from 'react';

export interface TextEditorProps extends TextAreaProps {
  input: { text: string };
  autoFullSize?: boolean;
  /** 粘贴图片回调，返回粘贴的图片文件列表 */
  onPasteImage?: (files: File[]) => void;
}

export const TextEditor = React.forwardRef(
  (props: TextEditorProps, ref: Ref<TextAreaRef> | undefined) => {
    const [text, setText] = useState(props.input.text);
    const [autoSize, setAutoSize] = useState(true);
    let _props = { ...props };
    const autoFullSize = _props.autoFullSize;
    const onPasteImage = _props.onPasteImage;
    if ('autoFullSize' in _props) delete _props.autoFullSize;
    if ('onPasteImage' in _props) delete _props.onPasteImage;
    
    useEffect(() => {
      setText(props.input.text);
    }, [props.input]);
    
    return (
      <Input.TextArea
        {..._props}
        value={text}
        autoSize={{ maxRows: autoSize ? 10 : 9999 }}
        onFocus={(e) => {
          if (autoFullSize) setAutoSize(false);
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          if (autoFullSize) setAutoSize(true);
          if (props.onBlur) props.onBlur(e);
        }}
        onChange={(e) => {
          props.input.text = e.target.value;
          setText(props.input.text);
          if (props.onChange) props.onChange(e);
          props.onChange && props.onChange(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            setText((v) => onTextareaTab(v, e.currentTarget?.selectionStart, e.currentTarget?.selectionEnd, e.currentTarget, e.shiftKey));
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
        onPaste={(e) => {
          // 如果配置了 onPasteImage，处理粘贴的图片
          if (onPasteImage) {
            const items = e.clipboardData?.items;
            if (items) {
              const imageFiles: File[] = [];
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) {
                    imageFiles.push(file);
                  }
                }
              }
              
              if (imageFiles.length > 0) {
                e.preventDefault(); // 阻止默认粘贴行为
                onPasteImage(imageFiles); // 回调给外部处理
              }
            }
          }
          
          // 调用原有的 onPaste（如果有）
          if (props.onPaste) {
            props.onPaste(e);
          }
        }}
        ref={ref}
      />
    );
  }
);
TextEditor.displayName = 'TextEditor';
