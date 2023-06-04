import { Message, Topic } from "@/Models/DataBase";
export type TopicMessage = Topic & {
  messages: Message[];
  messageMap: { [key: string]: Message };
  titleTree: TitleTree[];
  loadAll?:boolean
};

export type TitleTree = {
  lv: 1 | 2 | 3 | 4 | 5;
  msgId: string;
  title: string;
};
