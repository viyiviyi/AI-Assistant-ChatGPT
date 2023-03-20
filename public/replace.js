(function () {
  var baseUrl = "https://litechat.22733.site";
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
  iframe.src = baseUrl;
  async function sendMessage(message) {
    // 请求官方接口
    return "hello word";
  }
  var iframeWindow = iframe.contentWindow;
  window.addEventListener("message", function (event) {
    // 检查消息来源
    if (event.origin !== baseUrl) {
      return;
    }
    // 获取从iframe内发送过来的消息
    let { cbName, messages } = event.data;
    if (!messages) return;
    // 处理消息
    sendMessage(messages)
      .then((result) => {
        iframeWindow.postMessage({ cbName, result }, baseUrl);
      })
      .catch((error) => {
        iframeWindow.postMessage({ cbName, error }, baseUrl);
      });
  });
})();
