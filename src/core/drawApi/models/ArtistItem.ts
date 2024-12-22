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
 * ArtistItem
 * @export
 * @interface ArtistItem
 */
export interface ArtistItem {
    /**
     * Name
     * @type {string}
     * @memberof ArtistItem
     */
    name: string;
    /**
     * Score
     * @type {number}
     * @memberof ArtistItem
     */
    score: number;
    /**
     * Category
     * @type {string}
     * @memberof ArtistItem
     */
    category: string;
}

export function ArtistItemFromJSON(json: any): ArtistItem {
    return ArtistItemFromJSONTyped(json, false);
}

export function ArtistItemFromJSONTyped(json: any, ignoreDiscriminator: boolean): ArtistItem {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'score': json['score'],
        'category': json['category'],
    };
}

export function ArtistItemToJSON(value?: ArtistItem | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'score': value.score,
        'category': value.category,
    };
}

