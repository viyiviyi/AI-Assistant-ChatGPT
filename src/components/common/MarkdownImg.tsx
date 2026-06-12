import { Image } from 'antd';
import { useEffect, useState } from 'react';
import { ImageStore } from '@/core/db/ImageDb';
import { useRouter } from 'next/router';

const uuidReg = /[a-z0-9A-Z]{8}-[a-z0-9A-Z]{4}-[a-z0-9A-Z]{4}-[a-z0-9A-Z]{4}-[a-z0-9A-Z]{12}/;

export const MarkdownImg = ({ src, alt }: { src?: string; alt?: string }) => {
  const router = useRouter();
  const [localSrc, setLocalSrc] = useState<string>(src || '');
  const [previewVisible, setPreviewVisible] = useState(false);

  // 处理 UUID 类型的图片加载（本地数据库图片）
  useEffect(() => {
    if (src && uuidReg.test(src)) {
      ImageStore.getInstance().getImage(src).then((res) => {
        if (typeof res === 'string') setLocalSrc(res || '');
        else if (res instanceof Blob) setLocalSrc(URL.createObjectURL(res));
      });
    } else {
      setLocalSrc(src || '');
    }
  }, [src]);

  // 监听 hash 变化关闭预览（支持浏览器返回键）
  useEffect(() => {
    const handleHashChange = () => {
      if (!location.hash.includes('markdown-img')) {
        setPreviewVisible(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!localSrc) return null;

  return (
    <Image
      src={localSrc}
      height={100}
      alt={alt}
      style={{ cursor: 'pointer', maxWidth: '100%' }}
      preview={{
        visible: previewVisible,
        onVisibleChange: (visible) => {
          setPreviewVisible(visible);
          if (visible) {
            // 打开预览时添加 hash
            router.push(location.href.split('#')[0] + '#markdown-img');
          } else {
            // 关闭预览时如果 hash 还在，则回退
            if (location.hash.includes('markdown-img')) {
              window.history.back();
            }
          }
        },
      }}
    />
  );
};
