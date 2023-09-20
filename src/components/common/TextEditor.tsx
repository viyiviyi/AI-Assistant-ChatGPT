import { Input } from "antd";
import { TextAreaProps } from "antd/lib/input";
import { TextAreaRef } from "antd/lib/input/TextArea";
import React, { Ref, useEffect, useState } from "react";

export const TextEditor = React.forwardRef(
  (
    props: TextAreaProps & { input: { text: string } },
    ref: Ref<TextAreaRef> | undefined
  ) => {
    const [text, setText] = useState(props.input.text);
    useEffect(() => {
      setText(props.input.text);
    }, [props.input]);
    return (
      <Input.TextArea
        {...props}
        value={text}
        onChange={(e) => {
          props.input.text = e.target.value;
          setText(props.input.text);
        }}
        ref={ref}
      />
    );
  }
);
TextEditor.displayName = "TextEditor";
