
# AI 助理

---

**此项目提供了一个使用ChatGPT或Claude (暂时只有这两) 来创作或模拟对话的工具，需要使用自己的OpenApi key或者Slack的App token+频道ID+ClaudeID后使用。**

**此项目的目标是提供一个在一个工具里可以自由使用国内外的AI语言模型进行创作的工具，现在仅支持了ChatGPT和Claude(Slack)**

- 此项目没有后端服务也没有直接访问ChatGPT或Claude的api地址，而是访问另两个使用cloudflare Workers反向代理([示例](#cloudflare反向代理))的地址，用于绕过浏览器的跨域检测。
- 支持随时修改到自己的反向代理地址，文档后面有代码配置示例。
- 提供了一个类似聊天窗口的使用界面，可以同时发起多个对话，并及时的显示回复进度。
- 可以随时编辑对话历史（Slack(Claude)模式无效，因为这个的上下文是存在Slack的服务里的）。
- 可以导出为markdown文档，可以导出为json格式用于备份或在设备间传递。
- 支持自定义上下文数量，创作或工作时设置为1，对话时建议设置10条以上。
- 可以自由勾选提问时发送的上下文，对于需要连续提问时很方便。
- 使用 会话-话题 的方式管理对话，一个会话有多个话题，大部分配置都安照会话做区分。
- 可以为每个会话独立的配置助理设定，工作娱乐分开进行。
- 可以自定义修改每个会话的背景（可以让界面好看一些）。  

## 其他

- 如果担心代理地址多人在用有可能被封号，可以使用自己的API代理地址
- 可以访问 [https://litechat.22733.site](https://litechat.22733.site) 或 [https://22733.site](https://22733.site) 直接使用（可能被墙了）。
- 如果你需要自己部署，请看[这里](#独立部署)
- 如果要使用ChatGLM作为机器人，可以看这个项目：[ChatGLM-6B_Api_kaggle](https://github.com/viyiviyi/ChatGLM-6B_Api_kaggle) 并将得到的地址填到ChatGPT的代理地址里就可以使用ChatGLM作为免费的AI助理。
- [一个有很多助理设定的网站 (为什么我没有早点发现Orz)](https://ai.usesless.com/scene)
- [一个购买key的商店（询问过卖家可以挂上来）,一个5刀的key就可以用半个月了。](https://gptnb.net)
- [ClaudeApi调用相关的key获取方式，我也是从这学会的](https://github.com/bincooo/claude-api) 
- [一个赞助入口 ₍₍ ◟(∗˙ ꒵ ˙∗)◞ ₎₎](./%E8%BF%99%E4%B8%AA%E6%96%87%E4%BB%B6%E6%B2%A1%E4%BA%BA%E4%BC%9A%E7%82%B9%E5%BC%80%E7%9A%84%E5%90%A7.md)

![主界面截图](./主界面预览.webp)

## 功能说明

---

*此文档的说明可能滞后，以网站体验为准*

### 对话功能

- 使用/开头代替AI发言。
- 使用\\开头发送一条不会发送给ChatGPT的消息。
- 使用::开头以系统的身份发送内容，/::可以发送后不触发ChatGPT。
- 输入内容为空时在支持上下文的AI会把当前上下文发送出去，不支持上下文的AI会获取历史记录。
- 每条消息都可以任意编辑、删除、重复发送（电脑端把鼠标移到消息上，手机端点击消息，消息下方会出现插入内容和重复发送的按钮）。
- 输入框上方的话题名称点击后可以锁定只显示当前话题，锁定后正在回复的消息将会保持在页面底部。
- 左侧导航将会显示全部话题，并且能从消息中读取标题（只读取第一行）。可以通过增加话题或增加标题（Markdown语法 #开头加空格后接标题内容）的方式方便查找。
- 可以通过选中消息的方式灵活的指定哪些内容不受上下文限制的发送给AI。
- 可以快速复制内容。
- 可以快速导入消息到编辑框。
- 可以复制代码块。
- 可以开任意数量话题，可以多个话题同步进行（如果上下文数量是1时，单个话题也能同时进行多个对话）。
- 可以备份还原会话的配置和消息。
- 可以导出话题为markdown文档（在话题标题的下载按钮），可以导出会话的全部话题到单独的Markdown文档（在设置的备份按钮）。
- 上下文的配置将会影响发送给AI时的上下文数量，更多的上下文会让对话更合理，但也会消耗更多的token，并且总的token是有上限的，也可以通过在消息列表里勾选指定消息的方式让限制范围外的重要消息也被发送。

### 助理配置

- 可配置头像和昵称，英语名称用于多助理(人格)模式时区分发言的助理(还没写完)
- 使用/开头的内容将用于伪造AI的发言。
- 使用::开头以系统的身份发送内容。
- 可以增加任意数量的附加配置，方便诱导AI和编写规则。
- 可以删除或调整附加配置的顺序。
- 可配置用户的头像，显示的名称
- 用户简介配置后将会自动以系统的身份告诉ChatGPT用户的简介。

### 会话配置

- 可配置会话标题和头像。
- 可以指定AI类型，可以使用不同的AI交叉使用，但可能出问题。
- 可以为会话指定使用的模型
- 可以指定上下文数量。上下文数量在支持上下文的AI里，可以自由的调整发送内容给AI时从当前话题加载多少条记录发送给AI，如果是模拟聊天，建议10以上，如果是提问或创作，建议设为1，临时需要包含前面的内容进行提问时，可以临时勾选后发送。
- 需要在秘钥配置配置相关的key后才能使用对应的AI
- 可配置接口代理地址(因为没有使用服务器转发的方式，而是直接由浏览器请求，所有代理地址需要将此网站加入允许跨域访问的名单)，同ip多人访问可能产生封号危险，所有这里你可以使用你自己的代理地址。参考[chatgptProxyAPI](https://github.com/x-dr/chatgptProxyAPI)
- 接口代理地址的最后不能有‘/’
- 可以配置AI支持的参数，如果有需要的话，正常情况下使用默认值即可。
- 除标注的几个配置外，其他配置都是仅当前会话生效。

## 接下来要做的事情 （可能）

- 多助理：可以@某个助理进行对话
- 引用：可以引用单条内容单独询问助理或ChatGPT，独立于当前上下文
- 数据同步：打算是采用第三方云盘或者webdav或者git，因为不想数据流转到代理服务器，所有需要使用客户端才能跨域访问第三方服务。
- 自动助理配置：类似AutoGPT，但是现在连怎么让ChatGPT返回固定的json格式都还不知道
- **如果你有什么需求也可以在[issues](https://github.com/viyiviyi/AI-Assistant-ChatGPT/issues)提，我会收到邮件的。**

## [一些助理的配置参考](./%E5%8A%A9%E7%90%86%E8%AE%BE%E5%AE%9A.md)  

## 独立部署

**这个项目现在是一个纯前端项目，本质上不需要独立部署，如果你需要做修改并使用自己的后端，可以参考以下内容**

- 这只是一个nextjs的项目，可以使用比如Cloudflare的Pages快速部署（需要使用静态网站的模式，也是上面可用网站的部署方式）
  1. fork仓库
  2. 在你的Cloudflare绑定你的GitHub
  3. 在pages里创建项目并使用GitHub仓库
  4. 等待第一次构建
  5. 访问pages默认的域名即可
  6. 如果有自己的域名，绑定自己的域名更好，因为默认的域名被墙了

- 如果你需要使用自己的后端（比如改成免费的服务，增加广告）
  - 可以在AiService/ServiceProvider.ts这个文件修改默认后端地址，并且把设置里面的自定义代理地址删除。
  - 如果要增加新的AI服务，比如国内的，继承AiService/IAiService.ts 这个接口实现后在AiService/ServiceProvider.ts文件里面增加类型名称和对应的初始化方式就行
  - 如果需要登录功能，需要自己写。

- 如果你需要二次修改，请随意。这是一个MIT开源协议的项目。


## cloudflare反向代理

```javascript

const TELEGRAPH_URL = 'https://api.openai.com';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  url.host = TELEGRAPH_URL.replace(/^https?:\/\//, '');
  let old_request_headers = new Headers(request.headers);
  let new_request_headers = new Headers();
  new_request_headers.set('Host', 'https://api.openai.com');
  new_request_headers.set('Orgin', 'https://api.openai.com');
  new_request_headers.set('Referer', '');
  new_request_headers.set('user-agent', '');
  new_request_headers.set('Authorization', old_request_headers.get('Authorization'));
  new_request_headers.set('Accept-Language', old_request_headers.get('Accept-Language'));
  new_request_headers.set('Accept-Encoding', old_request_headers.get('Accept-Encoding'));
  new_request_headers.set('Content-Type', old_request_headers.get('Content-Type'));

  const modifiedRequest = new Request(url.toString(), {
    headers: new_request_headers,
    method: request.method,
    body: request.body,
    redirect: 'follow'
  });

  const response = await fetch(modifiedRequest);

  const modifiedResponse = new Response(response.body, response);
  // 添加允许跨域访问的响应头
  modifiedResponse.headers.set('Access-Control-Allow-Origin', "*");
  modifiedResponse.headers.set('cache-control', 'public, max-age=14400')
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
