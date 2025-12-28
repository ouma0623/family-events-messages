"use strict";
/**
 * eventId生成ユーティリティ
 * 15_NORMALIZED_SCHEMA.md セクション2 に準拠
 * 22_DEV_GUIDELINES.md セクション2.1 に準拠
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
exports.generateSourceEventId = generateSourceEventId;
exports.generateEventId = generateEventId;
const crypto = __importStar(require("crypto"));
/**
 * sourceEventIdが無い場合のハッシュ生成
 * @param title タイトル
 * @param startAt 開始日時（ISO8601）
 * @param endAt 終了日時（ISO8601）
 * @param venueName 会場名（空文字列可）
 * @param url URL
 * @returns 16桁のハッシュ文字列
 */
function generateSourceEventId(title, startAt, endAt, venueName, url) {
    // 区切り文字は "|" を使用
    const input = `${title}|${startAt}|${endAt}|${venueName}|${url}`;
    // sha256でハッシュ化
    const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    // 先頭16桁を返す
    return hash.substring(0, 16);
}
/**
 * eventIdを生成
 * @param sourceId ソースID
 * @param sourceEventId ソース側イベントID（無い場合はハッシュ生成）
 * @param title タイトル
 * @param startAt 開始日時（ISO8601）
 * @param endAt 終了日時（ISO8601）
 * @param venueName 会場名（空文字列可）
 * @param url URL
 * @returns eventId
 */
function generateEventId(sourceId, sourceEventId, title, startAt, endAt, venueName, url) {
    const actualSourceEventId = sourceEventId || generateSourceEventId(title, startAt, endAt, venueName || '', url);
    return `${sourceId}:${actualSourceEventId}`;
}
//# sourceMappingURL=hash.js.map