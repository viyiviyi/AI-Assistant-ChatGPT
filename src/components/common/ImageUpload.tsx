import { useScreenSize } from '@/core/hooks/hooks';
import { Avatar, Modal, Upload } from 'antd';
import React, { useEffect, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';

const ImageUpload = ({
  onSave,
  avatar = '',
  width = 96,
  height = 96,
  trigger,
  style,
}: {
  avatar?: string;
  onSave: (img: string) => void;
  width?: number;
  height?: number;
  trigger?: React.ReactNode | undefined;
  style?: React.CSSProperties | undefined;
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
      const croppedImage = canvas.toDataURL('image/png');
      // 将croppedImage保存到服务器或本地存储中
      onSave(croppedImage);
      setShowModal(false);
    }
  };

  return (
    <div style={style}>
      <Upload
        accept=".cccc"
        {...{
          beforeUpload(file, FileList) {
            if (!/\.(bmp|jpg|png|tif|gif|pcx|tga|exif|fpx|svg|psd|cdr|pcd|dxf|ufo|eps|ai|raw|WMF|webp|avif|apng)$/.test(file.name.toLocaleLowerCase())) return;
            setImage(file);
            setShowModal(true);
            return false;
          },
          defaultFileList: [],
          showUploadList: false,
        }}
      >
        {trigger ? trigger : <Avatar size={'large'} src={avatar || undefined}></Avatar>}
      </Upload>
      <Modal
        open={showModal}
        onOk={handleSave}
        centered={true}
        onCancel={() => setShowModal(false)}
        width={
          (renderSize.width / renderSize.height) * (Math.min(renderSize.height, screenSize.height) - 210 / screenSize.devicePixelRatio) + 40
        }
      >
        <div style={{ marginTop: '30px', width: '100%' }}>
          <input
            style={{ width: '100%' }}
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
              display: 'flex',
              justifyContent: 'center',
              margin: '10px auto',
            }}
          >
            {width > screenSize.width ? (
              <AvatarEditor
                style={{
                  maxWidth:
                    (renderSize.width / renderSize.height) *
                      (Math.min(renderSize.height, screenSize.height) - 210 / screenSize.devicePixelRatio) -
                    40,
                  height: 'auto',
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
            ) : (
              <AvatarEditor
                style={{
                  maxWidth:
                    (renderSize.width / renderSize.height) *
                    (Math.min(renderSize.height, screenSize.height) - 210 / screenSize.devicePixelRatio),
                  height: 'auto',
                }}
                ref={(editor) => setEditor(editor)}
                image={image!}
                width={width}
                height={height}
                border={90}
                borderRadius={5}
                scale={scale}
                position={position}
                onPositionChange={handlePositionChange}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ImageUpload;
