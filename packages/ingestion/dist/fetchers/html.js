"use strict";
/**
 * HTMLフェッチャー
 * WalkerPlusからのHTMLデータ取得
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlFetcher = void 0;
const base_1 = require("./base");
const axios_1 = __importDefault(require("axios"));
const retry_1 = require("../errors/retry");
/**
 * HTMLフェッチャー
 */
class HtmlFetcher extends base_1.BaseFetcher {
    constructor(source) {
        super(source);
    }
    /**
     * 一覧ページを取得
     */
    async fetch() {
        const response = await this.httpGet(this.source.url);
        return this.responseToBuffer(response);
    }
    /**
     * 詳細ページを取得
     */
    async fetchDetail(eventId) {
        const detailUrl = `https://www.walkerplus.com/event/${eventId}/`;
        const response = await this.httpGet(detailUrl);
        return this.responseToBuffer(response);
    }
    /**
     * data.htmlページを取得
     */
    async fetchData(eventId) {
        const dataUrl = `https://www.walkerplus.com/event/${eventId}/data.html`;
        const response = await this.httpGet(dataUrl);
        return this.responseToBuffer(response);
    }
    /**
     * ページネーション付きで一覧ページを取得
     */
    async fetchListPage(pageNumber = 1) {
        let url;
        if (pageNumber === 1) {
            url = this.source.url;
        }
        else {
            url = `${this.source.url}${pageNumber}.html`;
        }
        const response = await this.httpGet(url);
        return this.responseToBuffer(response);
    }
    /**
     * HTTP GETリクエストを実行（リトライ付き、レート制限対応）
     */
    async httpGet(url) {
        // レート制限: 1リクエスト/秒
        await this.delay(1000);
        return (0, retry_1.withRetry)(async () => {
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30秒
                headers: {
                    'User-Agent': this.userAgent,
                },
            });
            return response;
        }, 3, { sourceId: this.source.sourceId });
    }
    /**
     * 遅延処理（レート制限用）
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.HtmlFetcher = HtmlFetcher;
//# sourceMappingURL=html.js.map