import { Avatar, Space, Upload } from "antd";
import React, { useState } from "react";
import AvatarEditor from "react-avatar-editor";

const AvatarUpload = ({
  onSave,
  avatar = "",
}: {
  avatar?: string;
  onSave: (img: string) => void;
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editor, setEditor] = useState<AvatarEditor | null>();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });

  const handlePositionChange = (
    position: React.SetStateAction<{
      x: number;
      y: number;
    }>
  ) => {
    setPosition(position);
  };

  const handleSave = () => {
    if (editor) {
      const canvas = editor.getImageScaledToCanvas();
      const croppedImage = canvas.toDataURL("image/png");
      // 将croppedImage保存到服务器或本地存储中
      onSave(croppedImage);
      setShowModal(false);
    }
  };

  return (
    <Space>
      <Upload
        accept=".png,.jpg,.gif"
        {...{
          beforeUpload(file, FileList) {
            setImage(file);
            setShowModal(true);
            return false;
          },
          defaultFileList: [],
          showUploadList: false,
        }}
      >
        <Avatar size={"large"} src={avatar}></Avatar>
      </Upload>

      {showModal && image && (
        <Space direction="horizontal">
          <AvatarEditor
            ref={(editor) => setEditor(editor)}
            image={image}
            width={40}
            height={40}
            border={20}
            borderRadius={0}
            scale={scale}
            position={position}
            onPositionChange={handlePositionChange}
          />
          <Space direction="vertical">
            <input
              type="range"
              id="scale"
              name="scale"
              min="1"
              max="2"
              step="0.01"
              value={scale}
              onChange={(e) => {
                const scale = parseFloat(e.target.value);
                setScale(scale);
              }}
            />
            <button onClick={handleSave}>保存</button>
          </Space>
        </Space>
      )}
    </Space>
  );
};

export default AvatarUpload;
