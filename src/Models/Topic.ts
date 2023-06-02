import { Message, Topic } from "@/Models/DataBase";
export type TopicMessage = Topic & {
  messages: Message[];
  messageMap: { [key: string]: Message };
};
