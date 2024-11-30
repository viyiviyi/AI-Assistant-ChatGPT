/* tslint:disable */
/**
 * ValidationError
 * @export
 * @interface ValidationError
 */
export interface ValidationError {
  /**
   * Location
   * @type {Array<string | number>}
   * @memberof ValidationError
   */
  loc: Array<string | number>;
  /**
   * Message
   * @type {string}
   * @memberof ValidationError
   */
  msg: string;
  /**
   * Error Type
   * @type {string}
   * @memberof ValidationError
   */
  type: string;
}

export function ValidationErrorFromJSON(json: any): ValidationError {
  return ValidationErrorFromJSONTyped(json, false);
}

export function ValidationErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): ValidationError {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    loc: (json['loc'] as Array<any>).map((a) => a && a.toString()),
    msg: json['msg'],
    type: json['type'],
  };
}

export function ValidationErrorToJSON(value?: ValidationError | null): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    loc: (value.loc as Array<any>).map((a) => a && a.toString()),
    msg: value.msg,
    type: value.type,
  };
}
