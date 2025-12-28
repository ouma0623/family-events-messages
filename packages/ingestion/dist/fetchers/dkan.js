"use strict";
/**
 * DKAN取得フェッチャー
 * 14_SOURCES_AICHI.md セクション1（S5, S6, S7）に準拠
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DkanFetcher = void 0;
const base_1 = require("./base");
const handler_1 = require("../errors/handler");
const cheerio = __importStar(require("cheerio"));
/**
 * DKAN取得フェッチャー
 */
class DkanFetcher extends base_1.BaseFetcher {
    /**
     * DKANデータを取得（フォールバック処理含む）
     */
    async fetch() {
        // 優先: ダウンロードURLで直接取得
        try {
            const response = await this.httpGet(this.source.dkanDownloadUrl);
            return this.responseToBuffer(response);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            handler_1.errorHandler.warn(`Failed to fetch from DKAN download URL, trying fallback`, {
                sourceId: this.source.sourceId,
                error: errorMessage,
            });
            // フォールバック: メタデータURLからHTMLを取得し、ダウンロードリンクを抽出
            return this.fetchWithFallback();
        }
    }
    /**
     * フォールバック処理: HTMLからダウンロードリンクを抽出
     */
    async fetchWithFallback() {
        try {
            // メタデータURLからHTMLを取得
            const htmlResponse = await this.httpGet(this.source.dkanMetadataUrl);
            const html = htmlResponse.data.toString('utf-8');
            // HTMLからダウンロードリンクを抽出
            const downloadUrl = this.extractDownloadLink(html);
            if (!downloadUrl) {
                throw new Error('Failed to extract download link from HTML');
            }
            // 抽出したURLで再取得
            const response = await this.httpGet(downloadUrl);
            return this.responseToBuffer(response);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            const errorStack = error?.stack;
            handler_1.errorHandler.error(`Failed to fetch from DKAN with fallback`, {
                sourceId: this.source.sourceId,
                error: errorMessage,
                stack: errorStack,
            });
            throw error;
        }
    }
    /**
     * HTMLからダウンロードリンクを抽出
     */
    extractDownloadLink(html) {
        const $ = cheerio.load(html);
        // ダウンロードリンクを探す（href属性に "download" を含む）
        const downloadLink = $('a[href*="download"]').first().attr('href');
        if (downloadLink) {
            // 相対URLの場合は絶対URLに変換
            if (downloadLink.startsWith('/')) {
                const baseUrl = new URL(this.source.dkanMetadataUrl);
                return `${baseUrl.origin}${downloadLink}`;
            }
            if (downloadLink.startsWith('http')) {
                return downloadLink;
            }
            // 相対URL（../download等）の場合
            const baseUrl = new URL(this.source.dkanMetadataUrl);
            return new URL(downloadLink, baseUrl).toString();
        }
        return null;
    }
}
exports.DkanFetcher = DkanFetcher;
//# sourceMappingURL=dkan.js.map