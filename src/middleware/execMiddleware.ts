import { IChat } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "./IMiddleware";

const middlewareIndex: { [key: string]: IMiddleware } = {};
const middlewareList: Array<IMiddleware> = [];
const middlewareArr: Array<new () => IMiddleware> = [];

export function onSendBefore(
  chat: IChat,
  context: Array<ChatCompletionRequestMessage>
): Array<ChatCompletionRequestMessage> {
  let m = chat.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return context;
  let r = context;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onSendBefore ? m[i].onSendBefore!(chat, r) : r;
    if (!next) return r;
  }
  return r;
}

export function onReader(chat: IChat, result: string): string {
  let m = chat.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return result;
  let r = result;
  for (let i = 0; i < m.length; i++) {
    r = m[i].onReader ? m[i].onReader!(chat, r) || "" : r;
  }
  return r;
}

export function onReaderAfter(chat: IChat, resule: Message[]): Message[] {
  let m = chat.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return resule;
  let r = resule;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onReaderAfter ? m[i].onReaderAfter!(chat, r) : r;
    if (!next) return r;
  }
  return r;
}

export function registerMiddleware() {
  middlewareArr.forEach((middleware) => {
    let m = new middleware();
    middlewareList.push(m);
    middlewareIndex[m.key] = m;
  });
}

export function getMiddlewareList(): Array<IMiddleware> {
  return middlewareList;
}
