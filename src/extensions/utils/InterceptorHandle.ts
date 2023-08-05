import { InputConfig } from "@/core/AiService/IAiService";
import { ChatContext } from "@/core/ChatManagement";
import { Extensions } from "@/extensions/Extensions";
import { Message } from "@/Models/DataBase";
import { ChatCompletionRequestMessage } from "openai";
import { useContext } from "react";
import { Interceptor } from "../models/Interceptor";

export type InterceptorExecData = {};

export async function useInterceptorExec(
  interceptor: Interceptor,
  input: InterceptorExecData,
  next: (putput: InterceptorExecData) => void
) {}

export async function useSendBeforeInterceptor() {
  const { chat } = useContext(ChatContext);
  const { extensions } = Extensions.useExtension(chat);
  function onSendBeforeInterceptor(
    input: {
      msg: Message;
      context: Array<ChatCompletionRequestMessage>;
      config: InputConfig;
    },
    next: (output: {
      msg: Message;
      context: Array<ChatCompletionRequestMessage>;
      config: InputConfig;
    }) => void
  ) {
    extensions.forEach((v) => {});
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
