/**
 * CSV正規化
 */
import { BaseNormalizer } from './base';
import { EventNormalized } from '@ouma-family-event/common';
/**
 * CSV正規化クラス
 */
export declare class CsvNormalizer extends BaseNormalizer {
    /**
     * CSV行をEventNormalizedに変換
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
//# sourceMappingURL=csv.d.ts.map