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
import {
    ValidationError,
    ValidationErrorFromJSON,
    ValidationErrorFromJSONTyped,
    ValidationErrorToJSON,
} from './';

/**
 * HTTPValidationError
 * @export
 * @interface HttpValidationError
 */
export interface HttpValidationError {
    /**
     * Detail
     * @type {Array<ValidationError>}
     * @memberof HttpValidationError
     */
    detail?: Array<ValidationError>;
}

export function HttpValidationErrorFromJSON(json: any): HttpValidationError {
    return HttpValidationErrorFromJSONTyped(json, false);
}

export function HttpValidationErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): HttpValidationError {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'detail': !exists(json, 'detail') ? undefined : ((json['detail'] as Array<any>).map(ValidationErrorFromJSON)),
    };
}

export function HttpValidationErrorToJSON(value?: HttpValidationError | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'detail': value.detail === undefined ? undefined : ((value.detail as Array<any>).map(ValidationErrorToJSON)),
    };
}


