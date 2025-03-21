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
 * ScriptArg
 * @export
 * @interface ScriptArg
 */
export interface ScriptArg {
    /**
     * Label，Name of the argument in UI
     * @type {string}
     * @memberof ScriptArg
     */
    label?: string;
    /**
     * 
     * @type {string}
     * @memberof ScriptArg
     */
    value?: string;
    /**
     * 
     * @type {string}
     * @memberof ScriptArg
     */
    minimum?: string;
    /**
     * 
     * @type {string}
     * @memberof ScriptArg
     */
    maximum?: string;
    /**
     * 
     * @type {string}
     * @memberof ScriptArg
     */
    step?: string;
    /**
     * Choices，Possible values for the argument
     * @type {Array<string>}
     * @memberof ScriptArg
     */
    choices?: Array<string>;
}

export function ScriptArgFromJSON(json: any): ScriptArg {
    return ScriptArgFromJSONTyped(json, false);
}

export function ScriptArgFromJSONTyped(json: any, ignoreDiscriminator: boolean): ScriptArg {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'label': !exists(json, 'label') ? undefined : json['label'],
        'value': !exists(json, 'value') ? undefined : json['value'],
        'minimum': !exists(json, 'minimum') ? undefined : json['minimum'],
        'maximum': !exists(json, 'maximum') ? undefined : json['maximum'],
        'step': !exists(json, 'step') ? undefined : json['step'],
        'choices': !exists(json, 'choices') ? undefined : json['choices'],
    };
}

export function ScriptArgToJSON(value?: ScriptArg | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'label': value.label,
        'value': value.value,
        'minimum': value.minimum,
        'maximum': value.maximum,
        'step': value.step,
        'choices': value.choices,
    };
}


