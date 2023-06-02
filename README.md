
# ChatGPT 助手
---

**此项目提供了一个访问ChatGPT或者Claude的网页界面，可以在网页配置自己的OpenApi key或者Slack的App token+频道ID+ClaudeID后使用。**
**项目并没有直接访问ChatGPT或Claude的api地址，而是两个cloudflare Workers反向代理([示例](#cloudflare反向代理))的地址，地址已经被墙，所以...你可以自己使用nginx配置([示例](#nginx反向代理))一个在本地电脑的反向代理来使用（仅限Claude，Slack的api没有被墙），也可以找一个没用被墙的域名去自己搭建一个云端的反向代理。**


- 如果担心代理地址多人在用有可能被封号，可以使用自己的API代理地址
- 所有的对话内容都可以编辑（Claude模式编辑并不会对后续对话生效）
- 可以任意伪造对话实现理想的控制效果（仅ChatGPT有效，但亲测Claude不需要这样做）
- 通过有限发送上文的方法可以实现同话题超出token限制的对话（仅ChatGPT模式有效）
- 可以访问 [https://litechat.22733.site](https://litechat.22733.site) 用自己的key体验
- 如果你需要自己部署，请看[这里](#独立部署)
- 如果要使用ChatGLM作为机器人，可以看这个项目：[ChatGLM-6B_Api_kaggle](https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle)


[一个有很多助理设定的网站(为什么我没有早点发现Orz)](https://ai.usesless.com/scene)

[一个购买key的商店（询问过卖家可以挂上来）,一个5刀的key就可以用半个月了。](https://gptnb.net)

[ClaudeApi调用相关的key获取方式，我也是从这学会的](https://github.com/bincooo/claude-api) 

[一个赞助入口 ₍₍ ◟(∗˙ ꒵ ˙∗)◞ ₎₎](./%E8%BF%99%E4%B8%AA%E6%96%87%E4%BB%B6%E6%B2%A1%E4%BA%BA%E4%BC%9A%E7%82%B9%E5%BC%80%E7%9A%84%E5%90%A7.md)

## 功能说明
---

**此文档的说明可能滞后，以网站体验为准**

### 对话功能
- 使用/开头代替AI发言。
- 使用\开头发送一条不会马上发送给ChatGPT的消息。
- 使用::开头以系统的身份发送内容，/::可以发送后不触发ChatGPT。
- 每条消息都可以任意编辑、删除。
- 可以快速复制内容。
- 可以快速导入内容到编辑框。
- 可以复制代码块。
- 使用Markdown渲染。
- 可以开任意数量话题，可以切换到任意话题继续。
- 可以创建多个会话，每个会话的话题独立，配置独立(除了key)，AI人格(助理配置)独立，用户昵称独立。
- 可以导出导入会话，导入时会删除对应会话的旧数据。
- 默认只发送前面10条对话记录用于生成新的内容，可以通过勾选消息或者在配置里增加配置的方式将重要信息发送给AI。
- 支持修改背景图片了（总归好看了一点）
![主界面截图](./主界面截图.png)
### 设置功能说明
- 助理配置(人格配置)也可用来配置成[文字游戏](#游戏模式)
  - 可配置头像和昵称，英语名称用于多助理(人格)模式时区分发言的助理(还没写完)
  - 使用/开头的内容将用于伪造AI的发言。
  - 使用::开头以系统的身份发送内容。
  - 可以增加任意数量的附加配置，方便诱导AI和编写规则。
  - 可以删除或调整附加配置的顺序。
- 用户配置
  - 可配置用户的头像，显示的名称
  - 用户简介配置后将会自动以系统的身份告诉ChatGPT用户的简介。
- 基本配置
  - 可以配置key(在公共电脑请不要勾选保存) 可以查看余额了（查看余额暂时不能用了）
  - 可配置接口代理地址(因为没有使用服务器转发的方式，而是直接由浏览器请求，所有代理地址需要将此网站加入允许跨域访问的名单)，同ip多人访问可能产生封号危险，所有这里你可以使用你自己的代理地址。参考[chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI)
  - 接口代理地址的最后不能有‘/’
  - 上下文数量用于配置发送消息给AI时把前面的几条对话记录也发送过去，一般情况下有4 5条记录就能正常对话了。
- 接口参数
  - 这些都是调用OpenAPI时使用的参数，参数具体的作用我也不太明白，默认的说明是ChatGPT告诉我的。

## 接下来要做的事情 （可能）
- 多助理：可以@某个助理进行对话
- 引用：可以引用单条内容单独询问助理或ChatGPT，独立于当前上下文
- 数据同步：打算是采用第三方云盘或者webdav或者git，因为不想数据流转到代理服务器，所有需要使用客户端才能跨域访问第三方服务。
- 自动助理配置：类似AutoGPT，但是现在连怎么让ChatGPT返回固定的json格式都还不知道
- **如果你有什么需求也可以在[issues](https://github.com/viyiviyi/AI-Assistant-ChatGPT/issues)提，我会收到邮件的。**

## [一些助理的配置参考](./%E5%8A%A9%E7%90%86%E8%AE%BE%E5%AE%9A.md)  

## 独立部署
**这个项目现在是一个纯前端项目，本质上不需要独立部署，如果你需要做修改并使用自己的后端，可以参考这个**

- 这只是一个nextjs的项目，可以使用比如Cloudflare的Pages快速部署（需要使用静态网站的模式，也是上面可用网站的部署方式）
  1. fork仓库
  2. 在你的Cloudflare绑定你的GitHub
  3. 在pages里创建项目并使用GitHub仓库
  4. 等待第一次构建
  5. 访问pages默认的域名即可
  6. 如果有自己的域名，绑定自己的域名更好，因为默认的域名被墙了
  7. 以上都是废话，如果你都要自己部署了，这些想必都知道，如果这些都不知道，你独立部署的意义何在。
- 如果你需要使用自己的后端（比如改成免费的服务，增加广告）
  1. 可以在ApiClient.ts这个文件修改默认后端地址，因为这个项目本身的后端地址是可用前端指定的，所有这里没有写配置项
  2. 接口的调用方式保存官方的一致即可，你的后端怎么收费，怎么转发是你的事情
  3. 增加广告这种事情我也不知道
  4. 登录界面和接口相关的已经被删了，所有如果你要增加相关的内容需要自己写
   

- 如果你需要二次修改，请随意。这是一个MIT开源协议的项目。


## cloudflare反向代理
```javascript
const TELEGRAPH_URL = 'https://slack.com';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  url.host = TELEGRAPH_URL.replace(/^https?:\/\//, '');

  let new_request_headers = new Headers(request.headers);
  new_request_headers.set('Host', 'https://slack.com');
  new_request_headers.set('Orgin', 'https://slack.com');
  new_request_headers.set('Referer', url.href);

  const modifiedRequest = new Request(url.toString(), {
    headers: new_request_headers,
    method: request.method,
    body: request.body,
    redirect: 'follow'
  });

  const response = await fetch(modifiedRequest);

  const modifiedResponse = new Response(response.body, response);
  // 添加允许跨域访问的响应头
  if (request.Origin == 'litechat.22733.site')
    modifiedResponse.headers.set('Access-Control-Allow-Origin', 'https://litechat.22733.site');
  if (request.Origin == '22733.site')
    modifiedResponse.headers.set('Access-Control-Allow-Origin', 'https://22733.site');
  // modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  modifiedResponse.headers.set('cache-control' ,'public, max-age=14400')
  modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
  modifiedResponse.headers.set('access-control-allow-credentials', 'true');
  modifiedResponse.headers.delete('content-security-policy');
  modifiedResponse.headers.delete('content-security-policy-report-only');
  modifiedResponse.headers.delete('clear-site-data');
  return modifiedResponse;
}
```

## nginx反向代理
```conf
server
{
    listen 80;
		listen 443 ssl http2;
		listen [::]:443 ssl http2;
    listen [::]:80;
    server_name slack.domain.com; # 这里写用来代理的域名

#     ssl证书地址
    ssl_certificate            "xxx.pem"; # pem文件的路径
    ssl_certificate_key        "xxx.key"; # key文件的路径

#     ssl验证相关配置
    ssl_protocols              TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers                ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers  on;
    ssl_session_cache          shared:SSL:10m;
    ssl_session_timeout        10m;

    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Headers *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, OPTIONS";

    if ($request_method = 'OPTIONS') {
        return 200;
    }

    location /
    {
        proxy_pass https://slack.com;
        proxy_set_header Host slack.com;
        proxy_set_header REMOTE-HOST $remote_addr;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection upgrade;

        if ($request_method = OPTIONS){
						return 200;
				}
        # 自定义cors允许的域名 end
        proxy_http_version 1.1;
    }
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md)
    {
        return 404;
    }
}
```
