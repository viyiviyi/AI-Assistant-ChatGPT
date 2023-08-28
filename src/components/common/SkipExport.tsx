import { useEffect, useState } from "react";

export const SkipExport = ({ children }: { children?: React.ReactNode }) => {
  const [render, setRender] = useState(false);
  useEffect(() => {
    setRender(true);
  }, []);
  if (!render) return <></>;
  return <>{children}</>;
};
