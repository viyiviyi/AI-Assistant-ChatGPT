
export type Lifecycle ='onSendBefore'|'onSend'|'onSendAfter'|'onRender'
export const LifecycleList: { [key in Lifecycle]: { name: string, explain: string } } = {
  onSendBefore: {
    name: "请求数据处理阶段",
    explain: "所有插件将会按顺序执行此过程内的全部功能，如果在此阶段存在网络请求功能，将会在所有插件的这个阶段除网络功能之外的功能完成后再调用网络功能，且会替换原来的网络请求，可用于实现自定义后端接口，如果多个插件都在此阶段增加了网络请求，都将会生效，且响应的数据会进入插件各自的【响应数据处理阶段】"
  },
  onSend: {
    name: "请求过程中",
    explain: "发送请求后，等待请求完成的这段时间，此过程的所有功能都将是异步的，对正常请求不会产生任何影响"
  },
  onSendAfter: {
    name: "响应数据处理阶段",
    explain: "当接口开始响应到响应结束的整个阶段，如果插件使用了自己的网络请求，此阶段获取的响应内容将会是插件的内容，此阶段的所有功能都会同步执行，包括网络请求，可以在此阶段完成比如在线NSFW检查"
  },
  onRender: {
    name: "渲染阶段",
    explain: "每次发生页面重绘都会按顺序调用所有插件此阶段的功能，可以用于调整文本格式，内容过滤等，此阶段不允许发生网络请求"
  }
}