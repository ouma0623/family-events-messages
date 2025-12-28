"use strict";
/**
 * CSVスキーマ検出
 * 17_SCHEMA_DISCOVERY.md セクション3 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverCsvSchema = discoverCsvSchema;
const csv_1 = require("../parsers/csv");
const handler_1 = require("../errors/handler");
const common_1 = require("@ouma-family-event/common");
/**
 * CSVスキーマを検出
 */
function discoverCsvSchema(buffer, source, sampleSize = 20) {
    try {
        // CSV解析
        const parseResult = (0, csv_1.parseCsv)(buffer, source.sourceId);
        // サンプル行を抽出（先頭N件）
        const sampleRows = parseResult.rows.slice(0, sampleSize);
        // 日付パターンを検出
        const datePatterns = detectDatePatterns(parseResult.rows);
        return {
            sourceId: source.sourceId,
            detectedFormat: 'csv',
            detectedEncoding: parseResult.encoding,
            columns: parseResult.headers,
            sampleRows,
            datePatterns,
            detectedAt: (0, common_1.getCurrentISO8601)(),
        };
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        handler_1.errorHandler.error(`Failed to discover CSV schema for ${source.sourceId}`, {
            sourceId: source.sourceId,
            error: errorMessage,
        });
        throw error;
    }
}
/**
 * 日付パターンを検出
 */
function detectDatePatterns(rows) {
    const patterns = new Set();
    for (const row of rows) {
        for (const [key, value] of Object.entries(row)) {
            if (!value)
                continue;
            // 日付らしい列名かどうか
            if (key.match(/日|date|Date|開始|終了|期間/)) {
                // 日付パターンを検出
                if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    patterns.add('YYYY-MM-DD');
                }
                else if (value.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
                    patterns.add('YYYY/MM/DD');
                }
                else if (value.match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
                    patterns.add('YYYY年MM月DD日');
                }
                else if (value.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/)) {
                    patterns.add('YYYY-MM-DD HH:mm:ss');
                }
            }
        }
    }
    return Array.from(patterns);
}
//# sourceMappingURL=csv.js.map