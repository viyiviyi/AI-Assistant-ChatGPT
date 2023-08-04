import { format } from "date-fns";

export const functions = {
  currentTime() {
    return new Date().toLocaleString();
  },
  timeFormat(time: string | Date, formatStr: string = "yyyy-MM-dd HH:mm:ss") {
    return format(new Date(), formatStr);
  },
  join(input: string, str = "") {},
  split(input: string, str = "\n") {},
};
