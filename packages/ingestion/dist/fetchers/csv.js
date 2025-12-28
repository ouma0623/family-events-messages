"use strict";
/**
 * CSV取得フェッチャー
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvFetcher = void 0;
const base_1 = require("./base");
const handler_1 = require("../errors/handler");
/**
 * CSV取得フェッチャー
 */
class CsvFetcher extends base_1.BaseFetcher {
    /**
     * CSVデータを取得
     */
    async fetch() {
        try {
            const response = await this.httpGet(this.source.url);
            return this.responseToBuffer(response);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            const errorStack = error?.stack;
            handler_1.errorHandler.error(`Failed to fetch CSV from ${this.source.url}`, {
                sourceId: this.source.sourceId,
                error: errorMessage,
                stack: errorStack,
            });
            throw error;
        }
    }
}
exports.CsvFetcher = CsvFetcher;
//# sourceMappingURL=csv.js.map