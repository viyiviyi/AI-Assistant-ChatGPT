import { Variate } from "./model";

export const VariateDefinition: Variate[] = [];

export function useVariate<T extends number | string | boolean | undefined>(
  define: Variate
) {
  let val: T & any = undefined;

  return val;
}
