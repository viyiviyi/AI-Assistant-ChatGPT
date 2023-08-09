import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import type { DocumentContext } from "next/document";
import Document, { Head, Html, Main, NextScript } from "next/document";

const MyDocument = () => (
  <Html lang="zh-cn">
    <Head>
      <link rel="icon" href="/favicon.ico" />
      <meta
        name="keywords"
        content="便捷使用ChatGPT,ChatGPT工具,ChatGPT聊天界面,ChatGPT助手,ChatGPT长文本聊天,自由的ChatGPT客户端,AI助理,Claude使用工具,OpenAI,ChatGPT,ChatGPT网页版,ChatGPT创作工具,ChatGPT写文工具,ChatGPT,AI创作工具,AI助理,AI机器人,ChatGPT机器人,ChatGPT插件,AI插件,大语言模型,大语言模型使用,ChatGPT对话,AI对话,完全免费,免费工具,免费ChatGPT客户端,免费客户端,"
      ></meta>
      <meta
        name="description"
        content="ChatGPT、ChatGLM使用工具，灵活轻便，简洁美观，可完全自由的控制对话上下文，可简单生成远大于token限制的超长文本；可为ChatGPT设定复杂且便于控制的前导提示词，通过简单的勾选，实现超长记忆能力；导航式的话题管理，在多个话题间快速切换和创作，提升工作效率，解放你的生产力；文档/对话两种渲染方式，既能陪你聊天，又能帮你创作。"
      ></meta>
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
