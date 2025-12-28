/**
 * HTML正規化
 * WalkerPlusのHTMLデータをEventNormalized形式に正規化
 */
import { BaseNormalizer } from './base';
import { EventNormalized } from '@ouma-family-event/common';
import { HtmlEventData } from '../mappers/html';
/**
 * HTML正規化クラス
 */
export declare class HtmlNormalizer extends BaseNormalizer {
    /**
     * HTMLイベントデータをEventNormalizedに変換
     */
    normalize(mapped: HtmlEventData, raw: any): EventNormalized;
    /**
     * 日付をISO8601形式（JST）に変換
     */
    private normalizeDate;
    /**
     * 住所から市名を抽出
     */
    private extractCity;
    /**
     * イベント期間（日数）を計算
     */
    private calculateDurationDays;
}
//# sourceMappingURL=html.d.ts.map