import { GlobalVariate } from "../models/Variate";


export function useVariate<T extends number | string | boolean | undefined>(
  define: GlobalVariate
) {
  let val: T & any = undefined;

  return val;
}
