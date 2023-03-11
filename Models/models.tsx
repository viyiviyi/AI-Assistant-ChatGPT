export type Message = {
  key: string;
  nickname?: string;
  timestamp: number;
  message: string;
  isPull: boolean;
  isSkip?: boolean;
};

export type Assistant = {
  key: string;
  name: string;
  prefix: string;
};

export type GptConfig = {
  key: string;
  role: "assistant" | "system" | "user";
  model: string;
  max_tokens: 300;
  top_p: 1;
  temperature: 0.5;
  msgCount: number;
};

export type Chat = {
  key: string;
  name: string;
  avatar?: string;
  enableAssistant?: boolean;
};

export type User = {
  key: string;
  name: string;
  avatar: string;
};

export type DataChat = {
  key: string;
  config: string;
  user: string;
  gptConfig: string;
  assistant: string;
  messages: string[];
};
