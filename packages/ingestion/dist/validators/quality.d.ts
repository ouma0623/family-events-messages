/**
 * データ品質チェック
 * 21_DATA_QUALITY.md セクション4 に準拠
 */
import { EventNormalized } from '@ouma-family-event/common';
/**
 * dataConfidenceを算出
 */
export declare function calculateDataConfidence(event: EventNormalized): number;
/**
 * EventNormalizedのdataConfidenceを更新
 */
export declare function updateDataConfidence(event: EventNormalized): EventNormalized;
//# sourceMappingURL=quality.d.ts.map