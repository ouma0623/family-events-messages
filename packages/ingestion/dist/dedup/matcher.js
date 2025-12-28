"use strict";
/**
 * 同一判定
 * 09_DEDUP_RULES.md セクション3 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameEvent = isSameEvent;
/**
 * テキストを正規化
 */
function normalizeText(text) {
    let normalized = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    });
    normalized = normalized.replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
    normalized = normalized.replace(/\s+/g, '');
    return normalized.toLowerCase();
}
/**
 * 会場名を正規化（空白/記号除去）
 */
function normalizeVenueName(venueName) {
    if (!venueName)
        return '';
    return normalizeText(venueName);
}
/**
 * title類似度を計算（Jaccard類似度）
 * 09_DEDUP_RULES.md セクション4 に準拠
 */
function calculateTitleSimilarity(title1, title2) {
    const normalized1 = normalizeText(title1);
    const normalized2 = normalizeText(title2);
    // トークン化（簡易版：空白区切り + 2-gram）
    const tokens1 = new Set();
    const tokens2 = new Set();
    // 空白区切り
    normalized1.split(/\s+/).forEach((token) => {
        if (token.length > 0)
            tokens1.add(token);
    });
    normalized2.split(/\s+/).forEach((token) => {
        if (token.length > 0)
            tokens2.add(token);
    });
    // 2-gram
    for (let i = 0; i < normalized1.length - 1; i++) {
        tokens1.add(normalized1.substring(i, i + 2));
    }
    for (let i = 0; i < normalized2.length - 1; i++) {
        tokens2.add(normalized2.substring(i, i + 2));
    }
    // Jaccard類似度
    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    if (union.size === 0)
        return 0;
    return intersection.size / union.size;
}
/**
 * 日付が一致するかチェック
 */
function datesMatch(startAt1, endAt1, startAt2, endAt2) {
    return startAt1 === startAt2 && endAt1 === endAt2;
}
/**
 * 市が一致するかチェック
 */
function cityMatches(city1, city2) {
    const normalized1 = normalizeText(city1);
    const normalized2 = normalizeText(city2);
    return normalized1 === normalized2;
}
/**
 * 会場名が一致するかチェック
 */
function venueMatches(venue1, venue2) {
    if (!venue1 || !venue2)
        return false;
    const normalized1 = normalizeVenueName(venue1);
    const normalized2 = normalizeVenueName(venue2);
    return normalized1 === normalized2;
}
/**
 * 同一イベントかどうか判定
 * 09_DEDUP_RULES.md セクション3 に準拠
 */
function isSameEvent(event1, event2) {
    // 1. 日付が一致
    if (!datesMatch(event1.startAt, event1.endAt, event2.startAt, event2.endAt)) {
        return false;
    }
    // 2. 市が一致
    if (!cityMatches(event1.venueCity, event2.venueCity)) {
        return false;
    }
    // 3. 会場名が一致（両方ある場合）
    if (event1.venueName && event2.venueName) {
        if (!venueMatches(event1.venueName, event2.venueName)) {
            return false;
        }
    }
    // 4. title類似度が0.7以上
    const similarity = calculateTitleSimilarity(event1.title, event2.title);
    if (similarity < 0.7) {
        return false;
    }
    return true;
}
//# sourceMappingURL=matcher.js.map