import { useScreenSize } from "@/core/hooks";
import { Avatar, Modal, Space, Upload } from "antd";
import React, { useEffect, useState } from "react";
import AvatarEditor from "react-avatar-editor";

const ImageUpload = ({
  onSave,
  avatar = "",
  width = 96,
  height = 96,
  trigger,
}: {
  avatar?: string;
  onSave: (img: string) => void;
  width?: number;
  height?: number;
  trigger?: React.ReactNode | undefined;
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editor, setEditor] = useState<AvatarEditor | null>();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const screenSize = useScreenSize();
  const [renderSize, setRenderSize] = useState({
    width: screenSize.width,
    height: screenSize.width / (width / height),
  });
  useEffect(() => {
    setRenderSize({
      width: screenSize.width,
      height: screenSize.width / (width / height),
    });
  }, [width, height, screenSize]);
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
        {trigger ? (
          trigger
        ) : (
          <Avatar size={"large"} src={avatar || undefined}></Avatar>
        )}
      </Upload>
      <Modal
        open={showModal}
        onOk={handleSave}
        centered={true}
        onCancel={() => setShowModal(false)}
        width={
          (screenSize.width / renderSize.height) * (renderSize.height - 90) + 40
        }
      >
        <div style={{ marginTop: "30px", width: "100%" }}>
          <input
            style={{ width: "100%" }}
            type="range"
            id="scale"
            name="scale"
            min="1"
            max="3"
            step="0.01"
            value={scale}
            onChange={(e) => {
              const scale = parseFloat(e.target.value);
              setScale(scale);
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "10px auto",
            }}
          >
            <AvatarEditor
              style={{
                // 这是一个意外写错的计算，结果意外的很好，不知道为什么
                maxWidth:
                  (renderSize.width / renderSize.height) *
                  (renderSize.height * 0.75),
                height: "auto",
              }}
              ref={(editor) => setEditor(editor)}
              image={image!}
              width={width}
              height={height}
              disableHiDPIScaling={true}
              border={90}
              borderRadius={5}
              scale={scale}
              position={position}
              onPositionChange={handlePositionChange}
            />
          </div>
        </div>
      </Modal>
    </Space>
  );
};

export default ImageUpload;
