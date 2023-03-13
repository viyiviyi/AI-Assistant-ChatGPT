import "@/styles/globals.css";
import "../styles/atom-one-dark.css";
import "antd/dist/reset.css";
import type { AppProps } from "next/app";
import React from "react";
import { ConfigProvider, theme } from "antd";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#4A4A4A",
        },
        algorithm: theme.darkAlgorithm,
      }}
    >
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
