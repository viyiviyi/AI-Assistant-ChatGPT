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
 * SDVaeItem
 * @export
 * @interface SdVaeItem
 */
export interface SdVaeItem {
    /**
     * Model Name
     * @type {string}
     * @memberof SdVaeItem
     */
    modelName: string;
    /**
     * Filename
     * @type {string}
     * @memberof SdVaeItem
     */
    filename: string;
}

export function SdVaeItemFromJSON(json: any): SdVaeItem {
    return SdVaeItemFromJSONTyped(json, false);
}

export function SdVaeItemFromJSONTyped(json: any, ignoreDiscriminator: boolean): SdVaeItem {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'modelName': json['model_name'],
        'filename': json['filename'],
    };
}

export function SdVaeItemToJSON(value?: SdVaeItem | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'model_name': value.modelName,
        'filename': value.filename,
    };
}


