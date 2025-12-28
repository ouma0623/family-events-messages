/**
 * 統合処理
 * 09_DEDUP_RULES.md セクション5 に準拠
 */
import { EventNormalized } from '@ouma-family-event/common';
/**
 * 同一イベントを統合
 * 長い方を優先（title, description）
 * URL優先順位（自治体/公式 > その他）
 */
export declare function mergeEvents(event1: EventNormalized, event2: EventNormalized): EventNormalized;
//# sourceMappingURL=merger.d.ts.map