import EXIF from "exifr";

export const pnginfo = async (image: Blob): Promise<any> => {
  let reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = function (e) {
      const arrayBuffer = e.target?.result as any;
      if (!arrayBuffer) return;
      EXIF.parse(arrayBuffer, {
        userComment: true,
      }).then((res) => {
        resolve(Buffer.from(res.chara, "base64").toString());
      });
    };
    reader.readAsArrayBuffer(image);
  });
};
