import { IChat } from "@/core/ChatManagement";
import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { IMiddleware } from "./IMiddleware";
import { ChubPrompt } from "./scripts/ChubPrompt.middleware";
import { CurrentTime } from "./scripts/CurrentTime.middleware";
import { NameMacrosPrompt } from "./scripts/NameMacrosPrompt.middleware";
import { ReplaceHalfWidthSymbols } from "./scripts/ReplaceHalfWidthSymbols.middleware";
import { UserMessagePrdfix } from "./scripts/UserMessagePrdfix.middleware";

const middlewareIndex: { [key: string]: IMiddleware } = {};
const middlewareList: Array<IMiddleware> = [];
const middlewareArr: Array<new () => IMiddleware> = [NameMacrosPrompt, ChubPrompt, CurrentTime, ReplaceHalfWidthSymbols, UserMessagePrdfix];

export function onSendBefore(
  chat: IChat,
  context: Array<ChatCompletionRequestMessage>
): Array<ChatCompletionRequestMessage> {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return context;
  let r = context;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onSendBefore ? m[i].onSendBefore!(chat, r) : r;
    if (!next) return r;
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

export function onReaderAfter(chat: IChat, resule: Message[]): Message[] {
  let m = chat.config.middleware?.map((v) => middlewareIndex[v]);
  if (!m) return resule;
  let r = resule;
  for (let i = 0; i < m.length; i++) {
    let next = m[i].onReaderAfter ? m[i].onReaderAfter!(chat, r) : r;
    if (!next) return r;
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
  if (register) return
  register = true
  middlewareArr.forEach((middleware) => {
    let m = new middleware();
    middlewareList.push(m);
    middlewareIndex[m.key] = m;
  });
}

export function getMiddlewareList(): Array<IMiddleware> {
  return middlewareList;
}