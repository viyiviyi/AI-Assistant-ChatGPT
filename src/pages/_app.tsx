import { useDark } from "@/core/hooks";
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
import { useEffect, useState } from "react";
import "../styles/atom-one-dark.css";

export default function App({ Component, pageProps }: AppProps) {
  const isDark = useDark();
  const [holderStyle, setHolderStyle] = useState(true);
  useEffect(() => {
    setHolderStyle(false);
  }, []);
  return (
    <StyleProvider
      hashPriority="high"
      transformers={[legacyLogicalPropertiesTransformer]}
    >
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: "#00b96b",
            colorInfoBg: isDark ? "#3338" : "#eee8",
            colorTextBase: isDark ? "#cecece" : "#111",
            colorBgElevated: isDark ? "#222" : "#eee",
            colorLink: "#59ccccd5",
            colorLinkActive: "#41CECED5",
            fontSize: 16,
            colorLinkHover: "#66E6E6D5",
          },
          components: {
            Segmented: {
              itemHoverColor: isDark ? "#00b96b" : "#00b96b",
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
          {holderStyle ? (
            <style
              id="holderStyle"
              dangerouslySetInnerHTML={{
                __html: `/* https://github.com/ant-design/ant-design/issues/16037#issuecomment-483140458 */
/* Not only antd, but also any other style if you want to use ssr. */
*, *::before, *::after {transition: none!important;}`,
              }}
            />
          ) : undefined}
        </Head>
        <Component {...pageProps} />
      </ConfigProvider>
    </StyleProvider>
  );
}
