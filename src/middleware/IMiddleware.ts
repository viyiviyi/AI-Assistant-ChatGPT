import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { ChatCompletionRequestMessage } from "openai";
import { IChat } from "./../core/ChatManagement";
import { Message } from "./../Models/DataBase";
export interface IMiddleware {
  readonly key: string;
  readonly name: string;
  readonly tags: string[];
  readonly description: string;
  readonly setting?: VirtualRoleSetting[] | undefined;
  readonly onSendBefore?:
    | ((
        chat: IChat,
        context: {
          allCtx: Array<ChatCompletionRequestMessage>;
          history: Array<ChatCompletionRequestMessage>;
        }
      ) => undefined | Array<ChatCompletionRequestMessage>)
    | undefined;

  readonly onReaderFirst?:
    | ((chat: IChat, send: Message, result: Message) => Message)
    | undefined;
  readonly onReader?: ((chat: IChat, result: string) => string) | undefined;
  readonly onReaderAfter?:
    | ((chat: IChat, resule: Message[]) => Message[])
    | undefined;
  readonly onRender?: ((chat: IChat, result: string) => string) | undefined;
}
