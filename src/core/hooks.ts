import { useCallback, useEffect, useRef, useState } from "react";
import { scrollStatus, stopScroll } from "./utils";

export function useScreenSize() {
  const [obj, setObj] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const timeout = useRef<any>();
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", () => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setObj({ width: window.innerWidth, height: window.innerHeight });
      }, 1000);
    });
  }, []);
  return obj;
}
export function useDark() {
  const [obj, setObj] = useState(false);
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj(
      window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").onchange = function () {
        setObj(window.matchMedia("(prefers-color-scheme: dark)").matches);
      };
    }
  }, []);

  return obj;
}

export function useEnv() {
  const [obj, setObj] = useState<"dev" | "prod">("prod");
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj("prod");
  }, []);
  return obj;
}

export function useLockScroll() {
  let [lockEnd, setLockEnd] = useState(false);
  const reloadLockEnd = useCallback(
    (isLock: boolean) => {
      if (!isLock) stopScroll();
      else scrollStatus.enable = true;
      setLockEnd(isLock);
    },
    [setLockEnd]
  );
  return {
    lockEnd,
    setLockEnd: reloadLockEnd,
  };
}
