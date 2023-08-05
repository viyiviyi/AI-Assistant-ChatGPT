import { ArgumentDefine, ArgumentVal } from "./Argument";
import { Lifecycle } from "./Lifecycle";

export type InterceptorHandleType =
  | "replace"
  | "interrupt"
  | "if"
  | "add"
  | "request";

export interface Interceptor {
  handleType: InterceptorHandleType;
  args: ArgumentVal[];
  children: Interceptor[];
}

export const InterceptorHandleList: {
  [key in InterceptorHandleType]: {
    name: string;
    explain: string;
    variates: ArgumentDefine[];
    nextArgs?: ArgumentDefine[];
    lifecycle: Lifecycle[];
  };
} = {
  replace: {
    name: "查找替换",
    explain: "",
    variates: [],
    lifecycle: [],
  },
  interrupt: {
    name: "拦截器",
    explain: "",
    variates: [],
    lifecycle: [],
  },
  if: {
    name: "条件",
    explain: "",
    variates: [],
    lifecycle: [],
  },
  add: {
    name: "追加",
    explain: "",
    variates: [],
    lifecycle: [],
  },
  request: {
    name: "网络请求",
    explain: "",
    variates: [],
    nextArgs: [],
    lifecycle: [],
  },
};
