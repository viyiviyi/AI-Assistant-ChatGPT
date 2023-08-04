import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="zh-cn">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="keywords"
          content="便捷使用ChatGPT,ChatGPT工具,ChatGPT聊天界面,ChatGPT助手,ChatGPT长文本聊天,自由的ChatGPT客户端,AI助理,Claude使用工具,OpenAI,ChatGPT,ChatGPT网页版,ChatGPT创作工具,ChatGPT写文工具,ChatGPT,AI创作工具,AI助理,AI机器人,ChatGPT机器人,ChatGPT插件,AI插件,大语言模型,大语言模型使用,ChatGPT对话,AI对话,完全免费,免费工具,免费ChatGPT客户端,免费客户端,"
        ></meta>
        <meta name="description" content="以对话的方式使用各种AI大语言模型，可完全自由的控制对话上下文，灵活可控的对话提示词配置，最大程度开放AI的能力。现已支持ChatGPT各个模型 + ChatGLM + Claude各个模型的访问。"></meta>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
