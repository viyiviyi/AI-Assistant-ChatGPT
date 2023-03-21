(function () {
  var orginUrl = "https://litechat.22733.site";
  // 创建iframe元素
  var iframe = document.createElement("iframe");
  // 设置iframe的样式
  iframe.style.position = "fixed";
  iframe.style.top = "0";
  iframe.style.left = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  // 将iframe添加到body中
  document.body.appendChild(iframe);
  // 设置iframe的src属性
  iframe.src = orginUrl;
  function getUuid() {
    if (typeof crypto === "object") {
      if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      if (
        typeof crypto.getRandomValues === "function" &&
        typeof Uint8Array === "function"
      ) {
        const callback = (c) => {
          const num = Number(c);
          return (
            num ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (num / 4)))
          ).toString(16);
        };
        return ([1e7].join("") + -1e3 + -4e3 + -8e3 + -1e11).replace(
          /[018]/g,
          callback
        );
      }
    }
    let timestamp = new Date().getTime();
    let perforNow =
      (typeof performance !== "undefined" &&
        performance.now &&
        performance.now() * 1000) ||
      0;
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      let random = Math.random() * 16;
      if (timestamp > 0) {
        random = (timestamp + random) % 16 | 0;
        timestamp = Math.floor(timestamp / 16);
      } else {
        random = (perforNow + random) % 16 | 0;
        perforNow = Math.floor(perforNow / 16);
      }
      return (c === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
  }
  window.authToken = ``;
  /**
    message: Array<{
      role: "assistant" | "user" | "system";
      content: string;
      name: string;
    }>
    */
  async function sendMessage(conversations) {
    // 请求官方接口
    await new Promise((res, rej) => {
      const xhr = new XMLHttpRequest();
      const url = "https://chat.openai.com/backend-api/conversation";
      const data = JSON.stringify(conversations);
      xhr.open("POST", url, true);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer " + window.authToken);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          console.log(xhr.responseText);
          let res = JSON.parse(xhr.responseText.replace(/^data:/,''));
          if (res.message) {
            if (res.message.content) {
              if (res.message.content.parts) {
                console.log(res.message.content.parts);
              }
            }
          }
          res(xhr.responseText);
        } else {
          rej("error");
        }
      };
      xhr.send(data);
    }).catch((error) => console.error(error));
  }
  var iframeWindow = iframe.contentWindow;
  window.addEventListener("message", function (event) {
    // 检查消息来源
    if (event.origin !== orginUrl) {
      return;
    }
    // 获取从iframe内发送过来的消息
    let { cbName, messages } = event.data;
    if (!messages) return;
    // 处理消息
    sendMessage(messages)
      .then((result) => {
        iframeWindow.postMessage({ cbName, result }, orginUrl);
      })
      .catch((error) => {
        iframeWindow.postMessage({ cbName, error }, orginUrl);
      });
  });
})();
