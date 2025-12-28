/**
 * CSV alias表
 * 16_MAPPING_RULES.md セクション1.2 に準拠
 */
/**
 * CSV列名をEventNormalizedフィールドにマッピング
 */
export declare function mapCsvColumn(columnName: string): string | null;
/**
 * CSV行をマッピング
 */
export declare function mapCsvRow(row: Record<string, string>): {
    mapped: Record<string, any>;
    raw: Record<string, string>;
};
//# sourceMappingURL=alias.d.ts.map