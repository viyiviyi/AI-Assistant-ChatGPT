import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import type { DocumentContext } from "next/document";
import Document, { Head, Html, Main, NextScript } from "next/document";

import appManifest from "../../public/manifest.json";
const MyDocument = () => (
  <Html lang="zh-cn">
    <Head>
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <meta
        name="keywords"
        content="ChatGPT工具,ChatGPT聊天界面,ChatGPT助手,ChatGPT客户端,AI助理,Claude使用工具,OpenAI,ChatGPT,ChatGPT网页版,ChatGPT创作工具,ChatGPT写文工具,ChatGPT,AI创作工具,AI助理,AI机器人,ChatGPT机器人,大语言模型,大语言模型使用,ChatGPT对话,AI对话,完全免费,免费工具,免费ChatGPT客户端,免费客户端,AI文创,AI聊天,AI写作"
      ></meta>
      <meta name="description" content={appManifest.description}></meta>
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) =>
        (
          <StyleProvider cache={cache}>
            <App {...props} />
          </StyleProvider>
        ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  const style = extractStyle(cache, true);
  return {
    ...initialProps,
    styles: (
      <>
        {initialProps.styles}
        <style dangerouslySetInnerHTML={{ __html: style }} />
      </>
    ),
  };
};

export default MyDocument;
