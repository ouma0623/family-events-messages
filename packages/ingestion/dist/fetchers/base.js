"use strict";
/**
 * ベースフェッチャークラス
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const retry_1 = require("../errors/retry");
/**
 * フェッチャーのベースクラス
 */
class BaseFetcher {
    constructor(source) {
        this.userAgent = 'TokaiKidsEvents/1.0';
        this.source = source;
    }
    /**
     * HTTP GETリクエストを実行（リトライ付き）
     */
    async httpGet(url) {
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
     * レスポンスをBufferに変換
     */
    responseToBuffer(response) {
        return Buffer.from(response.data);
    }
}
exports.BaseFetcher = BaseFetcher;
//# sourceMappingURL=base.js.map