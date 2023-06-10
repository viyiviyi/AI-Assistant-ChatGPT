import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="zh-cn">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="keywords"
          content="便捷使用ChatGPT,ChatGPT工具,ChatGPT聊天界面,ChatGPT助手,ChatGPT长文本聊天,自由的ChatGPT客户端,AI助理,Claude使用工具"
        ></meta>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
