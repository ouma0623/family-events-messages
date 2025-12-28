"use strict";
/**
 * データソース定義
 * 14_SOURCES_AICHI.md に完全準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_IDS = exports.SOURCES = void 0;
exports.getSource = getSource;
exports.getAllSources = getAllSources;
exports.getDkanSources = getDkanSources;
/**
 * 全ソース定義
 * Phase8: WalkerPlusのみに統一
 */
exports.SOURCES = {
    S8_WALKERPLUS: {
        sourceId: 'S8_WALKERPLUS',
        name: 'WalkerPlus 東海イベント',
        url: 'https://www.walkerplus.com/event_list/ar0600/',
        format: 'html',
        encoding: 'utf-8',
    },
};
/**
 * ソースIDの配列
 */
exports.SOURCE_IDS = Object.keys(exports.SOURCES);
/**
 * sourceIdからSourceを取得
 */
function getSource(sourceId) {
    return exports.SOURCES[sourceId];
}
/**
 * 全ソースを取得
 */
function getAllSources() {
    return Object.values(exports.SOURCES);
}
/**
 * DKANソースのみを取得（Phase8: 削除済み）
 * @deprecated Phase8でDKANソースは削除されました
 */
function getDkanSources() {
    return [];
}
//# sourceMappingURL=sources.js.map