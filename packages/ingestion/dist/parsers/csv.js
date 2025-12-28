"use strict";
/**
 * CSVパーサー
 * 16_MAPPING_RULES.md セクション1.1 に準拠
 * 20_ERROR_HANDLING.md セクション3.2 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCsv = parseCsv;
const sync_1 = require("csv-parse/sync");
const common_1 = require("@ouma-family-event/common");
const handler_1 = require("../errors/handler");
/**
 * CSVを解析
 */
function parseCsv(buffer, sourceId) {
    try {
        // ソース定義から文字コードを取得（指定されている場合）
        const source = (0, common_1.getSource)(sourceId);
        let text;
        let encoding;
        if (source.encoding) {
            // ソース定義で文字コードが指定されている場合はそれを使用
            try {
                handler_1.errorHandler.warn(`[DEBUG] Attempting to decode ${sourceId} with encoding: ${source.encoding}`);
                text = (0, common_1.decodeBuffer)(buffer, source.encoding);
                encoding = source.encoding;
                const sampleText = text.substring(0, 100).replace(/[\r\n]/g, ' ');
                const headers = text.split('\n')[0];
                handler_1.errorHandler.warn(`[DEBUG] Successfully decoded ${sourceId} with encoding: ${encoding}, headers: ${headers}`);
            }
            catch (error) {
                handler_1.errorHandler.warn(`Failed to decode ${sourceId} with encoding ${source.encoding}, falling back to auto-detect`, {
                    sourceId,
                    error: error?.message || String(error),
                });
                // 指定された文字コードでデコードできない場合は自動判定にフォールバック
                const result = (0, common_1.detectAndDecode)(buffer);
                text = result.text;
                encoding = result.encoding;
            }
        }
        else {
            // 文字コード判定・デコード
            const result = (0, common_1.detectAndDecode)(buffer);
            text = result.text;
            encoding = result.encoding;
        }
        // CSV解析
        // S1_AICHI_PREFのように1行目が日付のみの場合、2行目をヘッダーとして使用
        let textToParse = text;
        const lines = text.split('\n').filter((line) => line.trim());
        // 1行目が日付のみ（YYYY/MM/DD形式）の場合は1行目をスキップ
        if (lines.length > 1 && /^\d{4}\/\d{1,2}\/\d{1,2}/.test(lines[0])) {
            // 1行目を削除
            const firstNewlineIndex = text.indexOf('\n');
            if (firstNewlineIndex >= 0) {
                textToParse = text.substring(firstNewlineIndex + 1);
            }
        }
        const records = (0, sync_1.parse)(textToParse, {
            columns: true, // ヘッダー行をキーとして使用
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true, // 列数が不一致でもエラーにしない
        });
        // ヘッダー行を抽出（最初のレコードのキーから）
        const headers = records.length > 0 ? Object.keys(records[0]) : [];
        return {
            headers,
            rows: records,
            encoding,
        };
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        const errorStack = error?.stack;
        handler_1.errorHandler.error(`Failed to parse CSV for ${sourceId}`, {
            sourceId,
            error: errorMessage,
            stack: errorStack,
        });
        throw error;
    }
}
//# sourceMappingURL=csv.js.map