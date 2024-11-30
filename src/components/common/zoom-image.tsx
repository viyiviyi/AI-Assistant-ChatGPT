import React, { useEffect, useMemo } from 'react';

export const ZoomImage = ({ src, alt, img }: { src?: string; alt?: string; img?: React.ReactNode }) => {
  const imgRef = useMemo(() => React.createRef<HTMLDivElement>(), []);
  useEffect(() => {
    const imageContainer = imgRef.current;
    if (!imageContainer) return;
    imageContainer.style.width = '100%';
    imageContainer.style.height = '100%';
    imageContainer.style.overflow = 'hidden';
    function disableClose(e: MouseEvent) {
      e.stopPropagation();
    }
    let img = imageContainer.querySelector('img');
    if (img == null) return;
    img.style.width = 'auto';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.maxHeight = '100%';
    let scale = 1;
    let lastX = 0;
    let lastY = 0;
    let lastLen = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let touchStore: { [key: string]: number | boolean | string } = {};
    let moveFunTimer = setTimeout(() => {}, 0);
    let moveFunLastExecTime = Date.now();
    let event = {
      wheel: function (event: WheelEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (img == null) return;
        img.style.transition = 'transform 0.3s ease';
        let delta = -Math.max(-1, Math.min(1, event.deltaY || -event.detail));
        let zoomStep = 0.1;
        let zoom = 1 + delta * zoomStep;
        let lastScale = scale;
        scale *= zoom;
        scale = Math.max(0.1, scale);
        //   图片中心坐标
        let centerX = imageContainer.offsetWidth / 2;
        let centerY = imageContainer.offsetHeight / 2;
        //   图片中心坐标
        let imgCenterX = offsetX + centerX;
        let imgCenterY = offsetY + centerY;
        //   缩放后坐标偏移 = 缩放后图片中心坐标 - 页面中心坐标
        //   缩放后图片中心坐标 = 缩放中心坐标 - 缩放后距离
        //   缩放后距离 = (缩放前距离 / 之前的缩放比) *之后的缩放比
        //   缩放前距离 = 缩放中心坐标 - 之前的图片中心坐标
        //   之前的图片中心坐标 = 页面中心坐标 + 坐标偏移
        offsetX = event.clientX - ((event.clientX - imgCenterX) / lastScale) * scale - centerX;
        offsetY = event.clientY - ((event.clientY - imgCenterY) / lastScale) * scale - centerY;
        img.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
      },
      mousedown: function (event: MouseEvent) {
        event.stopPropagation();
        isDragging = true;
        lastX = event.clientX - offsetX;
        lastY = event.clientY - offsetY;
        if (img == null) return;
        img.style.cursor = 'grabbing';
      },
      mousemove: function (event: MouseEvent) {
        if (isDragging) {
          if (img == null) return;
          img.style.transition = '';
          event.stopPropagation();
          event.preventDefault();
          img.onclick = disableClose;
          let deltaX = event.clientX - lastX;
          let deltaY = event.clientY - lastY;
          offsetX = deltaX;
          offsetY = deltaY;
          img.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' + scale + ')';
        }
      },
      mouseup: function (event: MouseEvent) {
        event.stopPropagation();
        isDragging = false;
        if (img == null) return;
        img.style.cursor = 'grab';
      },
      mouseleave: function (event: MouseEvent) {
        event.stopPropagation();
        isDragging = false;
        if (img == null) return;
        img.style.cursor = 'grab';
      },
      reset() {
        scale = 1;
        lastX = 0;
        lastY = 0;
        offsetX = 0;
        offsetY = 0;
        touchStore = {};
        if (img == null) return;
        img.style.transform = 'none';
        img.onclick = () => {};
      },
      touchcancel: function (event: TouchEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (img == null) return;
        img.onclick = () => {};
        img.style.transition = '';
        // 设置img标签的样式，实现缩放效果
        img.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
      },
      touchend: function (event: TouchEvent) {
        // 更新缩放比例
        event.stopPropagation();
        if (img == null) return;
        img.onclick = () => {};
        if (!event.targetTouches.length) {
          touchStore.tpuchScale = false;
        }
      },
      touchstart: function (event: TouchEvent) {
        event.stopPropagation();
        if (!touchStore.tpuchScale) {
          lastX = event.targetTouches[0].clientX - offsetX;
          lastY = event.targetTouches[0].clientY - offsetY;
        }
        if (event.targetTouches[1]) {
          touchStore.tpuchScale = true;
          touchStore.last1X = event.targetTouches[0].clientX;
          touchStore.last1Y = event.targetTouches[0].clientY;
          touchStore.last2X = event.targetTouches[1].clientX;
          touchStore.last2Y = event.targetTouches[1].clientY;
          touchStore.scale = scale;
          lastLen = Math.sqrt(Math.pow(touchStore.last2X - touchStore.last1X, 2) + Math.pow(touchStore.last2Y - touchStore.last1Y, 2));
        }
      },
      touchmove: function (event: TouchEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (img == null) return;
        img.onclick = disableClose;
        if (event.targetTouches[1]) {
          touchStore.delta1X = event.targetTouches[0].clientX;
          touchStore.delta1Y = event.targetTouches[0].clientY;
          touchStore.delta2X = event.targetTouches[1].clientX;
          touchStore.delta2Y = event.targetTouches[1].clientY;
          let centerX = imageContainer.offsetWidth / 2;
          let centerY = imageContainer.offsetHeight / 2;
          let deltaLen = Math.sqrt(
            Math.pow(touchStore.delta2X - touchStore.delta1X, 2) + Math.pow(touchStore.delta2Y - touchStore.delta1Y, 2)
          );
          let zoom = deltaLen / lastLen;
          let lastScale = scale;
          scale = Number(touchStore.scale) * zoom;
          scale = Math.max(0.1, scale);
          // 当前缩放中心坐标
          let deltaCenterX = touchStore.delta1X + (touchStore.delta2X - touchStore.delta1X) / 2;
          let deltaCenterY = touchStore.delta1Y + (touchStore.delta2Y - touchStore.delta1Y) / 2;
          // 图片中心坐标
          let imgCenterX = offsetX + centerX;
          let imgCenterY = offsetY + centerY;
          // 计算缩放后的图片中心偏移
          offsetX = deltaCenterX - ((deltaCenterX - imgCenterX) / lastScale) * scale - centerX;
          offsetY = deltaCenterY - ((deltaCenterY - imgCenterY) / lastScale) * scale - centerY;
          const moveFun = () => {
            if (Date.now() - moveFunLastExecTime < 5) return;
            if (!img) return;
            img.style.transition = 'transform 0.3s ease';
            img.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
          };
          if (Date.now() - moveFunLastExecTime >= 50) {
            moveFun();
            moveFunLastExecTime = Date.now();
          } else {
            clearTimeout(moveFunTimer);
            moveFunTimer = setTimeout(() => {
              moveFun();
            }, 50);
          }
        } else if (!touchStore.tpuchScale) {
          img.style.transition = '';
          offsetX = event.targetTouches[0].clientX - lastX;
          offsetY = event.targetTouches[0].clientY - lastY;
          img.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
        }
      },
    };

    imageContainer.removeEventListener('click', event.reset);
    imageContainer.removeEventListener('wheel', event.wheel);
    img.removeEventListener('mousedown', event.mousedown);
    img.removeEventListener('mousemove', event.mousemove);
    img.removeEventListener('mouseup', event.mouseup);
    img.removeEventListener('mouseleave', event.mouseleave);
    // 移动端
    imageContainer.removeEventListener('touchend', event.touchend);
    imageContainer.removeEventListener('touchstart', event.touchstart);
    imageContainer.removeEventListener('touchmove', event.touchmove);

    imageContainer.addEventListener('click', event.reset);
    imageContainer.addEventListener('wheel', event.wheel);
    img.addEventListener('mousedown', event.mousedown);
    img.addEventListener('mousemove', event.mousemove);
    img.addEventListener('mouseup', event.mouseup);
    img.addEventListener('mouseleave', event.mouseleave);
    img.ondrag =
      img.ondragend =
      img.ondragstart =
        function (e) {
          e.stopPropagation();
          e.preventDefault();
        };
    // 移动端
    imageContainer.addEventListener('touchend', event.touchend);
    imageContainer.addEventListener('touchstart', event.touchstart);
    imageContainer.addEventListener('touchmove', event.touchmove);
  }, [imgRef]);

  if (!src) return <></>;
  return (
    <div className="zoom-image" ref={imgRef}>
      {img ? img : <img src={src} alt={alt} />}
    </div>
  );
};
