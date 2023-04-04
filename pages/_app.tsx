import "@/styles/globals.css";
import "../styles/atom-one-dark.css";
import "antd/dist/reset.css";
import type { AppProps } from "next/app";
import React, { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";

export default function App({ Component, pageProps }: AppProps) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const isDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(isDark);
  }, []);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00b96b",
          colorInfoBg: isDark ? "#444a" : "#ddda",
          colorTextBase: isDark ? "#ddd" : "#333",
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.compactAlgorithm,
      }}
    >
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
