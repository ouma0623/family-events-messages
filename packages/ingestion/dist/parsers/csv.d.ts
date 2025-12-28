/**
 * CSVパーサー
 * 16_MAPPING_RULES.md セクション1.1 に準拠
 * 20_ERROR_HANDLING.md セクション3.2 に準拠
 */
/**
 * CSV解析結果
 */
export interface CsvParseResult {
    headers: string[];
    rows: Record<string, string>[];
    encoding: string;
}
/**
 * CSVを解析
 */
export declare function parseCsv(buffer: Buffer, sourceId: string): CsvParseResult;
//# sourceMappingURL=csv.d.ts.map