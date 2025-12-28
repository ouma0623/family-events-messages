"use strict";
/**
 * 統合処理
 * 09_DEDUP_RULES.md セクション5 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeEvents = mergeEvents;
const common_1 = require("@ouma-family-event/common");
/**
 * 同一イベントを統合
 * 長い方を優先（title, description）
 * URL優先順位（自治体/公式 > その他）
 */
function mergeEvents(event1, event2) {
    // 基本はevent1をベースに、event2の方が良い場合は上書き
    const merged = { ...event1 };
    // title: 長い方を優先
    if (event2.title.length > event1.title.length) {
        merged.title = event2.title;
    }
    // description: 長い方を優先
    if (event2.description &&
        (!event1.description || event2.description.length > event1.description.length)) {
        merged.description = event2.description;
    }
    // url: 自治体/公式を優先
    const isOfficial1 = event1.url.includes('.lg.jp') || event1.url.includes('.pref.aichi.jp');
    const isOfficial2 = event2.url.includes('.lg.jp') || event2.url.includes('.pref.aichi.jp');
    if (isOfficial2 && !isOfficial1) {
        merged.url = event2.url;
    }
    // その他のフィールド: 存在する方を優先
    if (event2.venueName && !event1.venueName) {
        merged.venueName = event2.venueName;
    }
    if (event2.venueAddress && !event1.venueAddress) {
        merged.venueAddress = event2.venueAddress;
    }
    if (event2.imageUrls &&
        event2.imageUrls.length > 0 &&
        (!event1.imageUrls || event1.imageUrls.length === 0)) {
        merged.imageUrls = event2.imageUrls;
    }
    if (event2.contactName && !event1.contactName) {
        merged.contactName = event2.contactName;
    }
    if (event2.contactTel && !event1.contactTel) {
        merged.contactTel = event2.contactTel;
    }
    if (event2.contactEmail && !event1.contactEmail) {
        merged.contactEmail = event2.contactEmail;
    }
    // categories: 両方をマージ（重複除去）
    const allCategories = new Set([...(event1.categories || []), ...(event2.categories || [])]);
    merged.categories = Array.from(allCategories);
    // recommendScore: 高い方を優先
    if (event2.recommendScore > event1.recommendScore) {
        merged.recommendScore = event2.recommendScore;
    }
    // recommendReasons: 両方をマージ（重複除去）
    const allReasons = new Set([
        ...(event1.recommendReasons || []),
        ...(event2.recommendReasons || []),
    ]);
    merged.recommendReasons = Array.from(allReasons);
    // dataConfidence: 高い方を優先
    if (event2.dataConfidence > event1.dataConfidence) {
        merged.dataConfidence = event2.dataConfidence;
    }
    // updatedAtを更新
    merged.updatedAt = (0, common_1.getCurrentISO8601)();
    // raw: 両方をマージ
    merged.raw = {
        ...event1.raw,
        ...event2.raw,
        _merged: true,
        _sources: [event1.sourceId, event2.sourceId],
    };
    return merged;
}
//# sourceMappingURL=merger.js.map