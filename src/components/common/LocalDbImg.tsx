import { ImageStore } from '@/core/db/ImageDb';
import { Image } from 'antd';
import { useEffect, useState } from 'react';

export const LocalDbImg = ({ id, alt = 'image' }: { id: string; alt?: string }) => {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    ImageStore.getInstance()
      .getImage(id)
      .then((res) => {
        if (typeof res == 'string') setSrc(res || 'miss');
        else if (res instanceof Blob) {
          setSrc(URL.createObjectURL(res));
        }
      });
  }, [id]);
  if (!src) return <Image height={100} style={{ padding: 25 }} src={'/images/loading.gif'} alt={alt} />;
  if (src == 'miss') {
    return <Image height={100} src={'/images/error.png'} alt={alt} />;
  }
  return <Image height={100} src={src} alt={alt} />;
};
