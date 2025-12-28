"use strict";
/**
 * XMLスキーマ検出
 * 17_SCHEMA_DISCOVERY.md セクション3 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverXmlSchema = discoverXmlSchema;
const xml_1 = require("../parsers/xml");
const handler_1 = require("../errors/handler");
const common_1 = require("@ouma-family-event/common");
/**
 * XMLスキーマを検出
 */
async function discoverXmlSchema(buffer, source, sampleSize = 20) {
    try {
        // XML解析
        const parseResult = await (0, xml_1.parseXml)(buffer, source.sourceId);
        // サンプル要素を抽出（先頭N件）
        const sampleRows = parseResult.events.slice(0, sampleSize);
        // XPath候補を探索
        const xpaths = extractXPathCandidates(parseResult.events);
        // 日付パターンを検出
        const datePatterns = detectDatePatterns(parseResult.events);
        return {
            sourceId: source.sourceId,
            detectedFormat: 'xml',
            detectedEncoding: parseResult.encoding,
            xpaths,
            sampleRows,
            datePatterns,
            detectedAt: (0, common_1.getCurrentISO8601)(),
        };
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        handler_1.errorHandler.error(`Failed to discover XML schema for ${source.sourceId}`, {
            sourceId: source.sourceId,
            error: errorMessage,
        });
        throw error;
    }
}
/**
 * XPath候補を抽出
 */
function extractXPathCandidates(events) {
    const xpaths = new Set();
    if (events.length === 0) {
        return [];
    }
    // 最初のイベント要素からキーを抽出
    const firstEvent = events[0];
    if (firstEvent && typeof firstEvent === 'object') {
        for (const key of Object.keys(firstEvent)) {
            // 一般的なXPath候補を生成
            xpaths.add(`//${key}/text()`);
            xpaths.add(`//event/${key}/text()`);
            xpaths.add(`//item/${key}/text()`);
        }
    }
    return Array.from(xpaths);
}
/**
 * 日付パターンを検出
 */
function detectDatePatterns(events) {
    const patterns = new Set();
    for (const event of events) {
        if (!event || typeof event !== 'object')
            continue;
        for (const [key, value] of Object.entries(event)) {
            if (!value || typeof value !== 'string')
                continue;
            // 日付らしいキーかどうか
            if (key.match(/日|date|Date|開始|終了|期間/)) {
                const strValue = value;
                // 日付パターンを検出
                if (strValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    patterns.add('YYYY-MM-DD');
                }
                else if (strValue.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
                    patterns.add('YYYY/MM/DD');
                }
                else if (strValue.match(/\d{4}年\d{1,2}月\d{1,2}日/)) {
                    patterns.add('YYYY年MM月DD日');
                }
                else if (strValue.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/)) {
                    patterns.add('YYYY-MM-DD HH:mm:ss');
                }
            }
        }
    }
    return Array.from(patterns);
}
//# sourceMappingURL=xml.js.map