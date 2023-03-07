
# 一个用于方法ChatGPT官方api的简单web应用
---

- 可以指定模型
- 可以使用单次对话模式
- 可以使用连续对话模式（将会发送历史消息，会消耗额外的token）


## 使用方式

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
5. 写入默认的访问用户名
*简单实现，只是用来简单的限制未知用户的调用*
```shell
# 如果使用 npm run build + npm run start 的方式启动，此步骤需要在编译前操作 也就是 npm run build之前
echo '[{"user": "2333","pass": "123456"}]' > users.json
```
6. 启动测试
```shell
npm run dev
# or
yarn dev
# or
pnpm dev
```

---

## 功能说明

#### 助理模式
- 本质上是在每一个对话前增加一个固定的前缀（将消耗额外的token）
- 可以设置不一样的前缀，可以指定助理昵称，会显示在界面

#### 连续对话模式
- 当以对话方式发送消息时，将会把消息记录打包后整体发送，让openai可以基于历史对话生成新的对话内容
- 当使用提交后将重新开启新的对话

#### 单次对话模式
- 每次发送的消息和回复的内容与前一次的对话将没有关系
- 常用于解答问题，可以节省token
- 当每次点击【提交】按钮发起单次对话都会结束当前的连续对话（等于开启一个新的连续对话）

