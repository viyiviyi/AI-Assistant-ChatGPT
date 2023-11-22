import { useDark } from "@/core/hooks/hooks";
import {
  legacyLogicalPropertiesTransformer,
  StyleProvider
} from "@ant-design/cssinjs";

import "@/styles/globals.css";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import zhCN from "antd/locale/zh_CN";
import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/atom-one-dark.css";
import { useEffect } from "react";
import { registerMiddleware } from "@/middleware/execMiddleware";

export default function App({ Component, pageProps }: AppProps) {
  const isDark = useDark();
  useEffect(() => {
    registerMiddleware()
  })
  return (
    <StyleProvider
      hashPriority="high"
      transformers={[legacyLogicalPropertiesTransformer]}
    >
      <ConfigProvider
        locale={zhCN}
        theme={{
          hashed: false,
          token: {
            colorPrimary: "#00b96b",
            colorInfoBg: isDark ? "#3338" : "#eee8",
            colorTextBase: isDark ? "#cecece" : "#111",
            colorBgElevated: isDark ? "#222" : "#eee",
            colorLink: "#59ccccd5",
            colorLinkActive: "#41CECED5",
            fontSize: isDark ? 14 : 16,
            colorLinkHover: "#66E6E6D5",
            padding: isDark ? 12 : 10,
            paddingSM: isDark ? 8 : 10,
            paddingMD: isDark ? 10 : 12,
            paddingLG: isDark ? 12 : 14,
            paddingXL: isDark ? 14 : 16,
            paddingXS: isDark ? 16 : 18,
            paddingXXS: isDark ? 18 : 20,
            paddingContentHorizontal: isDark ? 10 : 12,
            paddingContentHorizontalLG: isDark ? 10 : 12,
            paddingContentHorizontalSM: isDark ? 10 : 12,
            paddingContentVertical: isDark ? 12 : 14,
            paddingContentVerticalLG: isDark ? 12 : 14,
            paddingContentVerticalSM: isDark ? 12 : 14,
            controlPaddingHorizontal: isDark ? 10 : 12,
            controlPaddingHorizontalSM: isDark ? 10 : 12,
            margin: isDark ? 12 : 10,
            marginSM: isDark ? 8 : 10,
            marginMD: isDark ? 10 : 12,
            marginLG: isDark ? 12 : 14,
            marginXL: isDark ? 14 : 16,
            marginXS: isDark ? 16 : 18,
            marginXXS: isDark ? 18 : 20,
          },
          components: {
            Segmented: {
              itemSelectedColor: isDark ? "#00b96b" : "#00b96b",
              itemHoverColor: isDark ? "#00B96CA0" : "#00b96bA0",
            },
            Tabs: {
              colorBgContainer: "#0000",
            },
            Modal: {
              padding: 12,
            },
          },
          algorithm: isDark ? theme.darkAlgorithm : theme.compactAlgorithm,
        }}
      >
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />

        </Head>
        <Component {...pageProps} />
      </ConfigProvider>
    </StyleProvider>
  );
}
