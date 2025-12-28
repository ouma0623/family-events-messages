"use strict";
/**
 * データ品質チェック
 * 21_DATA_QUALITY.md セクション4 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDataConfidence = calculateDataConfidence;
exports.updateDataConfidence = updateDataConfidence;
/**
 * dataConfidenceを算出
 */
function calculateDataConfidence(event) {
    let score = 0.0;
    // 必須フィールドが全て揃っている: +0.3
    if (event.title &&
        event.startAt &&
        event.endAt &&
        event.venueCity &&
        event.venueCity !== 'unknown' &&
        event.url) {
        score += 0.3;
    }
    // venueNameがある: +0.2
    if (event.venueName) {
        score += 0.2;
    }
    // descriptionがある: +0.15
    if (event.description) {
        score += 0.15;
    }
    // venueAddressがある: +0.1
    if (event.venueAddress) {
        score += 0.1;
    }
    // imageUrlsがある: +0.1
    if (event.imageUrls && event.imageUrls.length > 0) {
        score += 0.1;
    }
    // contactNameがある: +0.05
    if (event.contactName) {
        score += 0.05;
    }
    // contactTelまたはcontactEmailがある: +0.05
    if (event.contactTel || event.contactEmail) {
        score += 0.05;
    }
    // priceTextがある: +0.05
    if (event.priceText) {
        score += 0.05;
    }
    // 0.0〜1.0の範囲にclamp
    return Math.min(1.0, Math.max(0.0, score));
}
/**
 * EventNormalizedのdataConfidenceを更新
 */
function updateDataConfidence(event) {
    return {
        ...event,
        dataConfidence: calculateDataConfidence(event),
    };
}
//# sourceMappingURL=quality.js.map