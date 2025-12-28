"use strict";
/**
 * XML取得フェッチャー
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlFetcher = void 0;
const base_1 = require("./base");
const handler_1 = require("../errors/handler");
/**
 * XML取得フェッチャー
 */
class XmlFetcher extends base_1.BaseFetcher {
    /**
     * XMLデータを取得
     */
    async fetch() {
        try {
            const response = await this.httpGet(this.source.url);
            return this.responseToBuffer(response);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            const errorStack = error?.stack;
            handler_1.errorHandler.error(`Failed to fetch XML from ${this.source.url}`, {
                sourceId: this.source.sourceId,
                error: errorMessage,
                stack: errorStack,
            });
            throw error;
        }
    }
}
exports.XmlFetcher = XmlFetcher;
//# sourceMappingURL=xml.js.map