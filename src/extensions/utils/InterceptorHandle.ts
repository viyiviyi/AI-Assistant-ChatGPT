import { InputConfig } from "@/core/AiService/IAiService";
import { ChatContext } from "@/core/ChatManagement";
import { Extensions } from "@/extensions/Extensions";
import { CtxItem } from "@/Models/CtxItem";
import { CtxRole } from "@/Models/CtxRole";
import { Message } from "@/Models/DataBase";
import { useContext } from "react";
import { Interceptor } from "../models/Interceptor";
export type InterceptorExecData = {
  data: { msg?: { content: string; index: number } };
  funcs: {
    onPushMsg?: (role: CtxRole, content: string, index?: number) => void;
    onRemoveCtx?: (removeIndex: number[]) => void;
    onChangeMsg?: (nextRole: CtxRole, nextContent: string) => void;
    onPushResult?: (
      role: CtxRole,
      content: string,
      id: string,
      index?: number
    ) => void;
    onChangeResult?: (resultId: number, role: CtxRole, content: string) => void;
  };
};

export async function useInterceptorExec(
  interceptor: Interceptor,
  input: InterceptorExecData,
  next: (putput: InterceptorExecData) => void
) {}

export async function useSendBeforeInterceptor() {
  const { chatMgt: chat } = useContext(ChatContext);
  const { extensions } = Extensions.useExtension(chat.getChat());
  function onSendBeforeInterceptor(
    input: {
      msg: Message;
      context: Array<CtxItem>;
      config: InputConfig;
    },
    next: (output: {
      msg: Message;
      context: Array<CtxItem>;
      config: InputConfig;
    }) => void
  ) {
    extensions.forEach((v) => {
    v.onSendBefore.forEach(fun=>fun.handleType)
    });
  }

  return { onSendBeforeInterceptor };
}
export function useSendInterceptor() {
  function onSendInterceptor() {}

  return { onSendInterceptor };
}
export function useSendAfterInterceptor() {
  function onSendAfterInterceptor() {}

  return { onSendAfterInterceptor };
}
export function useRenderInterceptor() {
  function onRenderInterceptor() {}

  return { onRenderInterceptor };
}
