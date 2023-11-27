import { IChat } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "./IMiddleware";
import { ChubPrompt } from "./scripts/ChubPrompt.middleware";
import { ContinueLastMsg } from "./scripts/ContinueLastMsg";
import { CreataMessageForUser } from "./scripts/CreataMessageForUser";
import { NameMacrosPrompt } from "./scripts/NameMacrosPrompt.middleware";
import { ReplaceHalfWidthSymbols } from "./scripts/ReplaceHalfWidthSymbols.middleware";
import { UserMessagePrdfix } from "./scripts/UserMessagePrdfix.middleware";

const middlewareIndex: { [key: string]: IMiddleware } = {};
const middlewareList: Array<IMiddleware> = [];

const middlewareArr: Array<new () => IMiddleware> = [
  ContinueLastMsg,
  CreataMessageForUser,
  NameMacrosPrompt,
  UserMessagePrdfix,
  ReplaceHalfWidthSymbols,
  ChubPrompt,
];

/**
 * 内容发送之前
 * @param chat 
 * @param context 
 * @returns 
 */
export function onSendBefore(
  chat: IChat,
  context: {
    allCtx: Array<ChatCompletionRequestMessage>;
    history: Array<ChatCompletionRequestMessage>;
  }
): Array<ChatCompletionRequestMessage> {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return context.allCtx;
  let r = context;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onSendBefore ? m[i].onSendBefore!(chat, r) : r.allCtx;
    if (!next) return r.allCtx;
    else {
      r.allCtx = next;
    }
  }
  return r.allCtx;
}

/**
 * 响应内容被创建的时候
 * @param chat 
 * @param send 响应的内容的前一条内容
 * @param result 
 * @returns 
 */
export function onReaderFirst(
  chat: IChat,
  send: Message,
  result: Message
): Message {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return result;
  let r = result;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onReaderFirst ? m[i].onReaderFirst!(chat, send, r) : r;
    if (!next) return r;
    r = next
  }
  return r;
}
export function onReader(chat: IChat, result: string): string {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return result;
  let r = result;
  for (let i = 0; i < m.length; i++) {
    r = m[i].onReader ? m[i].onReader!(chat, r) || "" : r;
  }
  return r;
}

export function onReaderAfter(chat: IChat, result: Message[]): Message[] {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return result;
  let r = result;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onReaderAfter ? m[i].onReaderAfter!(chat, r) : r;
    if (!next) return r;
    r = next
  }
  return r;
}

export function onRender(chat: IChat, result: string): string {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return result;
  let r = result;
  for (let i = 0; i < m.length; i++) {
    r = m[i].onRender ? m[i].onRender!(chat, r) || "" : r;
  }
  return r;
}
let register = false;
export function registerMiddleware() {
  if (register) return;
  register = true;
  middlewareArr.forEach((middleware) => {
    let m = new middleware();
    middlewareList.push(m);
    middlewareIndex[m.key] = m;
  });
}

export function getMiddlewareList(): Array<IMiddleware> {
  return middlewareList;
}
