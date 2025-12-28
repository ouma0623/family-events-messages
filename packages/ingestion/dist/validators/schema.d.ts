/**
 * スキーマ検証
 * 15_NORMALIZED_SCHEMA.md セクション4 に準拠
 * 21_DATA_QUALITY.md セクション2 に準拠
 */
import { EventNormalized } from '@ouma-family-event/common';
/**
 * バリデーション結果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * EventNormalizedを検証
 */
export declare function validateSchema(event: EventNormalized): ValidationResult;
//# sourceMappingURL=schema.d.ts.map