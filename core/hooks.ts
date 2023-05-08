import { useEffect, useRef, useState } from "react";

export function useScreenSize() {
  const [obj, setObj] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", () => {
      setObj({ width: window.innerWidth, height: window.innerHeight });
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

