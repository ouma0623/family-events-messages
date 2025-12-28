"use strict";
/**
 * ベース正規化クラス
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNormalizer = void 0;
const common_1 = require("@ouma-family-event/common");
/**
 * 正規化のベースクラス
 */
class BaseNormalizer {
    source;
    constructor(source) {
        this.source = source;
    }
    /**
     * 日付文字列をISO8601形式に変換
     */
    parseDate(dateStr, isEnd = false) {
        if (!dateStr)
            return undefined;
        const dateStrTrimmed = String(dateStr).trim();
        // 既にISO8601形式の場合はそのまま返す（例: 2025-12-18T14:37:28+09:00）
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(dateStrTrimmed)) {
            if (isEnd && dateStrTrimmed.includes('T00:00:00')) {
                // 終了日の場合は23:59:59に変更
                return dateStrTrimmed.replace('T00:00:00', 'T23:59:59');
            }
            return dateStrTrimmed;
        }
        try {
            return (0, common_1.parseDateToISO8601)(dateStrTrimmed, isEnd);
        }
        catch (error) {
            // 日付パースエラーは無視（後続のバリデーションで検出）
            return undefined;
        }
    }
    /**
     * eventIdを生成
     */
    createEventId(sourceEventId, title, startAt, endAt, venueName, url) {
        return (0, common_1.generateEventId)(this.source.sourceId, sourceEventId, title, startAt, endAt, venueName || '', url);
    }
    /**
     * 必須フィールドを設定
     */
    setRequiredFields(partial, title, startAt, endAt, url) {
        const now = (0, common_1.getCurrentISO8601)();
        return {
            eventId: partial.eventId ||
                this.createEventId(partial.sourceEventId, title, startAt, endAt, partial.venueName, url),
            sourceId: this.source.sourceId,
            sourceEventId: partial.sourceEventId,
            title,
            startAt,
            endAt,
            venueCity: partial.venueCity || 'unknown',
            venuePref: partial.venuePref || '愛知県',
            url,
            categories: partial.categories || [],
            recommendScore: partial.recommendScore || 50, // デフォルト値（後続のタグ付けで更新）
            recommendReasons: partial.recommendReasons || [],
            dataConfidence: partial.dataConfidence || 0.5, // デフォルト値（後続のバリデーションで更新）
            raw: partial.raw || {},
            ingestedAt: partial.ingestedAt || now,
            updatedAt: now,
            // オプショナルフィールド
            description: partial.description,
            summary: partial.summary,
            eventType: partial.eventType,
            tags: partial.tags,
            indoorOutdoor: partial.indoorOutdoor,
            isFree: partial.isFree,
            priceText: partial.priceText,
            targetAges: partial.targetAges,
            timeText: partial.timeText,
            occurrences: partial.occurrences,
            venueName: partial.venueName,
            venueAddress: partial.venueAddress,
            lat: partial.lat,
            lng: partial.lng,
            accessText: partial.accessText,
            parkingText: partial.parkingText,
            imageUrls: partial.imageUrls,
            applyStartAt: partial.applyStartAt,
            applyEndAt: partial.applyEndAt,
            contactName: partial.contactName,
            contactTel: partial.contactTel,
            contactEmail: partial.contactEmail,
        };
    }
}
exports.BaseNormalizer = BaseNormalizer;
//# sourceMappingURL=base.js.map