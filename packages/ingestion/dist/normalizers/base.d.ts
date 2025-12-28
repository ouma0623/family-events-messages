/**
 * ベース正規化クラス
 */
import { EventNormalized, Source } from '@ouma-family-event/common';
/**
 * 正規化のベースクラス
 */
export declare abstract class BaseNormalizer {
    protected readonly source: Source;
    constructor(source: Source);
    /**
     * マッピング結果をEventNormalizedに変換
     */
    abstract normalize(mapped: Record<string, any>, raw: Record<string, any>): EventNormalized;
    /**
     * 日付文字列をISO8601形式に変換
     */
    protected parseDate(dateStr: string | undefined, isEnd?: boolean): string | undefined;
    /**
     * eventIdを生成
     */
    protected createEventId(sourceEventId: string | undefined, title: string, startAt: string, endAt: string, venueName: string | undefined, url: string): string;
    /**
     * 必須フィールドを設定
     */
    protected setRequiredFields(partial: Partial<EventNormalized>, title: string, startAt: string, endAt: string, url: string): EventNormalized;
}
//# sourceMappingURL=base.d.ts.map