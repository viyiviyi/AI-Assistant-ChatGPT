export function getUuid() {
  if (typeof crypto === "object") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (
      typeof crypto.getRandomValues === "function" &&
      typeof Uint8Array === "function"
    ) {
      const callback = (c: string) => {
        const num = Number(c);
        return (
          num ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))
        ).toString(16);
      };
      return ([1e7].join("") + -1e3 + -4e3 + -8e3 + -1e11).replace(
        /[018]/g,
        callback
      );
    }
  }
  let timestamp = new Date().getTime();
  let perforNow =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let random = Math.random() * 16;
    if (timestamp > 0) {
      random = (timestamp + random) % 16 | 0;
      timestamp = Math.floor(timestamp / 16);
    } else {
      random = (perforNow + random) % 16 | 0;
      perforNow = Math.floor(perforNow / 16);
    }
    return (c === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function pagesUtil<T>(
  arr: T[],
  pageNumber: number,
  pageSize = 20,
  repect = 10
): { range: T[]; totalPages: number; pageIndex: number } {
  if (arr.length <= 0) return { range: [], totalPages: 0, pageIndex: 1 };
  if (arr.length < pageSize + repect)
    return { range: [...arr], totalPages: 1, pageIndex: 1 };
  if (pageSize <= 0) pageSize = 20;
  const total = Math.ceil(arr.length / pageSize) || 1;
  if (pageNumber > total) pageNumber = total;
  if (pageNumber < 1) pageNumber = 1;
  let end = Math.min(arr.length, pageNumber * pageSize);
  let start = Math.max(0, end - (pageSize + repect));
  if (pageNumber == 1) end = Math.min(end + repect, arr.length);
  return {
    range: arr.slice(start, end),
    totalPages: total,
    pageIndex: pageNumber,
  };
}

export function downloadJson(jsonData: string, filename: string) {
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let toEndCache = { id: "", await: false, animation: 0 as any, to_top_id: "" };
export function scrollToBotton(id?: string) {
  toEndCache.id = id || "";
  if (toEndCache.await) return;
  toEndCache.await = true;
  setTimeout(() => {
    toEndCache.await = false;
    if (window) {
      const target = document.getElementById(toEndCache.id);
      const wrap = document.getElementById("content");
      if (!wrap) return;
      const offsetTop = target?.offsetTop || wrap.scrollHeight;
      const offsetHeight = target?.offsetHeight || 56;
      smoothScroll(
        wrap,
        wrap.scrollTop,
        offsetTop + offsetHeight - wrap.offsetHeight - 56,
        700
      );
    }
  }, 500);
}
export function scrollToTop(id?: string) {
  toEndCache.to_top_id = id || "";
  if (!scrollStatus.enableTop) return;
  setTimeout(() => {
    if (window) {
      const target = document.getElementById(toEndCache.to_top_id);
      const wrap = document.getElementById("content");
      if (!wrap) return;
      const offsetTop = target?.offsetTop || 56;
      smoothScroll(wrap, wrap.scrollTop, offsetTop - 56, 700);
    }
  }, 500);
}
export const scrollStatus = { enable: true, enableTop: true };
export function stopScroll() {
  scrollStatus.enable = false;
  scrollStatus.enableTop = false;
  clearInterval(toEndCache.animation);
}

const smoothScroll = (
  target: HTMLElement,
  startPosition: number,
  targetPosition: number,
  duration: number
) => {
  clearInterval(toEndCache.animation);
  if (!scrollStatus.enable && !scrollStatus.enableTop) return;
  const distance = targetPosition - startPosition;
  const pixelsPerSecond = distance / (duration / 1000);
  let currentTime = 0;
  toEndCache.animation = setInterval(() => {
    currentTime += 20;
    const newPosition = startPosition + pixelsPerSecond * (currentTime / 1000);
    target.scrollTop = newPosition;
    if (currentTime >= duration) clearInterval(toEndCache.animation);
  }, 20);
};
