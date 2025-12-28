/**
 * XML正規化
 */
import { BaseNormalizer } from './base';
import { EventNormalized } from '@ouma-family-event/common';
/**
 * XML正規化クラス
 */
export declare class XmlNormalizer extends BaseNormalizer {
    /**
     * XML要素をEventNormalizedに変換
     */
    normalize(mapped: Record<string, any>, raw: Record<string, any>): EventNormalized;
    /**
     * isFreeをパース
     */
    private parseIsFree;
    /**
     * targetAgesをパース
     */
    private parseTargetAges;
    /**
     * imageUrlsをパース
     */
    private parseImageUrls;
}
//# sourceMappingURL=xml.d.ts.map