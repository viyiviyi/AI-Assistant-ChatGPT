
# 一个简单的chat gpt访问页面

使用方式

1. 克隆仓库
```shell
git clone https://github.com/viyiviyi/ChatGPTLitePage.git
```
2. 安装依赖
```shell
cd ChatGPTLitePage
yarn
# or
npm i
```
4. api token
```shell
echo "OPENAI_API_KEY="$(cat /kaggle/input/configs/openai_token.txt) > .env
```
5. 启动测试
```shell
npm run dev
# or
yarn dev
# or
pnpm dev
```
