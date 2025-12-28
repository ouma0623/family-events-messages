"use strict";
/**
 * HTML正規化
 * WalkerPlusのHTMLデータをEventNormalized形式に正規化
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlNormalizer = void 0;
const base_1 = require("./base");
/**
 * HTML正規化クラス
 */
class HtmlNormalizer extends base_1.BaseNormalizer {
    /**
     * HTMLイベントデータをEventNormalizedに変換
     */
    normalize(mapped, raw) {
        const jsonLdData = mapped.jsonLd;
        const dataPageData = mapped.dataPage || {};
        const eventId = mapped.eventId;
        const displayOrder = mapped.displayOrder;
        // 日付をISO8601形式（JST）に変換
        const startAt = this.normalizeDate(jsonLdData.startDate);
        const endAt = this.normalizeDate(jsonLdData.endDate);
        // イベント期間（日数）を計算
        const durationDays = this.calculateDurationDays(startAt, endAt);
        // 住所から市名を抽出
        const address = jsonLdData.location?.address?.streetAddress || dataPageData.venueAddress || '';
        const city = this.extractCity(address);
        const pref = jsonLdData.location?.address?.addressRegion || '愛知県';
        // イベントIDを生成
        const normalizedEventId = `S8_WALKERPLUS:${eventId}`;
        // EventNormalized形式に変換
        const event = {
            eventId: normalizedEventId,
            sourceId: 'S8_WALKERPLUS',
            sourceEventId: eventId,
            title: jsonLdData.name || '',
            description: jsonLdData.description || '',
            startAt,
            endAt,
            venueCity: city,
            venuePref: pref,
            venueName: jsonLdData.location?.name || dataPageData.venueName || '',
            venueAddress: address,
            url: jsonLdData.url || `https://www.walkerplus.com/event/${eventId}/`,
            categories: dataPageData.categories || [],
            timeText: dataPageData.timeText || '',
            accessText: dataPageData.accessText || '',
            parkingText: dataPageData.parkingText || '',
            contactTel: jsonLdData.telephone || dataPageData.contactTel || '',
            imageUrls: jsonLdData.image ? [jsonLdData.image] : [],
            displayOrder,
            durationDays,
            // デフォルト値
            recommendScore: 50,
            recommendReasons: [],
            dataConfidence: 0.5,
            raw: {
                jsonLd: jsonLdData,
                dataPage: dataPageData,
            },
            ingestedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return event;
    }
    /**
     * 日付をISO8601形式（JST）に変換
     */
    normalizeDate(dateStr) {
        // JSON-LDの日付形式（YYYY-MM-DD）をISO8601形式に変換
        if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return `${dateStr}T00:00:00+09:00`;
        }
        return dateStr || '';
    }
    /**
     * 住所から市名を抽出
     */
    extractCity(address) {
        if (!address)
            return 'unknown';
        // 「名古屋市中村区」-> 「名古屋市」
        const match = address.match(/(.+?[市区町村])/);
        if (match && match[1]) {
            return match[1];
        }
        return 'unknown';
    }
    /**
     * イベント期間（日数）を計算
     */
    calculateDurationDays(startAt, endAt) {
        if (!startAt || !endAt)
            return 0;
        const start = new Date(startAt);
        const end = new Date(endAt);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}
exports.HtmlNormalizer = HtmlNormalizer;
//# sourceMappingURL=html.js.map