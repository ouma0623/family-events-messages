"use strict";
/**
 * XMLパーサー
 * 16_MAPPING_RULES.md セクション2.1 に準拠
 * 20_ERROR_HANDLING.md セクション3.3 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXml = parseXml;
const xml2js_1 = require("xml2js");
const common_1 = require("@ouma-family-event/common");
const handler_1 = require("../errors/handler");
/**
 * XMLを解析
 */
function parseXml(buffer, sourceId) {
    return new Promise((resolve, reject) => {
        try {
            // 文字コード判定・デコード
            // まずXML宣言から文字コードを取得
            const xmlText = buffer.toString('utf-8', 0, Math.min(1000, buffer.length)); // 先頭1000バイトで判定
            const xmlEncoding = (0, common_1.getEncodingFromXMLDeclaration)(xmlText);
            let text;
            let encoding;
            if (xmlEncoding) {
                // XML宣言で指定された文字コードを使用
                try {
                    text = (0, common_1.decodeBuffer)(buffer, xmlEncoding);
                    encoding = xmlEncoding;
                }
                catch (error) {
                    // XML宣言の文字コードでデコードできない場合は自動判定
                    const result = (0, common_1.detectAndDecode)(buffer);
                    text = result.text;
                    encoding = result.encoding;
                }
            }
            else {
                // XML宣言がない場合は自動判定
                const result = (0, common_1.detectAndDecode)(buffer);
                text = result.text;
                encoding = result.encoding;
            }
            // XML解析
            (0, xml2js_1.parseString)(text, { explicitArray: false, mergeAttrs: true }, (err, result) => {
                if (err) {
                    const errorMessage = err?.message || err?.toString() || String(err);
                    handler_1.errorHandler.error(`Failed to parse XML for ${sourceId}`, {
                        sourceId,
                        error: errorMessage,
                    });
                    reject(err);
                    return;
                }
                // イベント要素を抽出（event/item等、ソースによって異なる）
                const events = [];
                if (result.event) {
                    events.push(...(Array.isArray(result.event) ? result.event : [result.event]));
                }
                if (result.item) {
                    events.push(...(Array.isArray(result.item) ? result.item : [result.item]));
                }
                if (result.events?.event) {
                    events.push(...(Array.isArray(result.events.event) ? result.events.event : [result.events.event]));
                }
                // RSS形式（rdf:RDF/item）
                if (result['rdf:RDF']?.item) {
                    const rdfItems = result['rdf:RDF'].item;
                    events.push(...(Array.isArray(rdfItems) ? rdfItems : [rdfItems]));
                }
                // RSS形式（rdf:RDF/channel/item）
                if (result['rdf:RDF']?.channel?.item) {
                    const channelItems = result['rdf:RDF'].channel.item;
                    events.push(...(Array.isArray(channelItems) ? channelItems : [channelItems]));
                }
                resolve({
                    root: result,
                    events,
                    encoding,
                });
            });
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            const errorStack = error?.stack;
            handler_1.errorHandler.error(`Failed to parse XML for ${sourceId}`, {
                sourceId,
                error: errorMessage,
                stack: errorStack,
            });
            reject(error);
        }
    });
}
//# sourceMappingURL=xml.js.map