/* tslint:disable */
/* eslint-disable */
/**
 * sdapiv1
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * FileData
 * @export
 * @interface FileData
 */
export interface FileData {
    /**
     * File data，Base64 representation of the file
     * @type {string}
     * @memberof FileData
     */
    data: string;
    /**
     * File name
     * @type {string}
     * @memberof FileData
     */
    name: string;
}

export function FileDataFromJSON(json: any): FileData {
    return FileDataFromJSONTyped(json, false);
}

export function FileDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): FileData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': json['data'],
        'name': json['name'],
    };
}

export function FileDataToJSON(value?: FileData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data,
        'name': value.name,
    };
}

