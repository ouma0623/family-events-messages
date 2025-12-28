"use strict";
/**
 * XML正規化
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlNormalizer = void 0;
const base_1 = require("./base");
/**
 * XML正規化クラス
 */
class XmlNormalizer extends base_1.BaseNormalizer {
    /**
     * XML要素をEventNormalizedに変換
     */
    normalize(mapped, raw) {
        // 必須フィールドを抽出
        const title = String(mapped.title || '');
        // startAtとendAtを処理（日付範囲の場合は分割）
        let startAtStr = String(mapped.startAt || '');
        let endAtStr = String(mapped.endAt || '');
        // kikandays/spanのような日付範囲（例: 2026/10/16-2026/10/18）を処理
        if (startAtStr.includes('-') && !endAtStr) {
            const parts = startAtStr.split('-');
            if (parts.length === 2) {
                startAtStr = parts[0].trim();
                endAtStr = parts[1].trim();
            }
        }
        let startAt = this.parseDate(startAtStr, false) || '';
        let endAt = this.parseDate(endAtStr, true) || '';
        // endAtが空でstartAtがある場合、startAtと同じ日付を使用
        if (!endAt && startAt) {
            // startAtの日付部分を取得して、終了日として設定
            try {
                endAt = startAt.replace('T00:00:00', 'T23:59:59');
            }
            catch {
                // パースに失敗した場合は、startAtと同じ日付を使用
                endAt = startAt.replace('T00:00:00', 'T23:59:59');
            }
        }
        let url = String(mapped.url || '');
        // URLが空の場合、ソースURLをデフォルト値として使用
        if (!url || !url.trim()) {
            url = this.source.url || '';
        }
        // オプショナルフィールドを抽出
        const partial = {
            sourceEventId: mapped.sourceEventId ? String(mapped.sourceEventId) : undefined,
            description: mapped.description ? String(mapped.description) : undefined,
            timeText: mapped.timeText ? String(mapped.timeText) : undefined,
            venueName: mapped.venueName ? String(mapped.venueName) : undefined,
            venueAddress: mapped.venueAddress ? String(mapped.venueAddress) : undefined,
            venueCity: mapped.venueCity ? String(mapped.venueCity) : undefined,
            venuePref: mapped.venuePref ? String(mapped.venuePref) : undefined,
            priceText: mapped.priceText ? String(mapped.priceText) : undefined,
            isFree: this.parseIsFree(mapped.isFree),
            targetAges: this.parseTargetAges(mapped.targetAges),
            imageUrls: this.parseImageUrls(mapped.imageUrls),
            applyStartAt: this.parseDate(mapped.applyStartAt, false),
            applyEndAt: this.parseDate(mapped.applyEndAt, true),
            contactName: mapped.contactName ? String(mapped.contactName) : undefined,
            contactTel: mapped.contactTel ? String(mapped.contactTel) : undefined,
            contactEmail: mapped.contactEmail ? String(mapped.contactEmail) : undefined,
            raw,
        };
        return this.setRequiredFields(partial, title, startAt, endAt, url);
    }
    /**
     * isFreeをパース
     */
    parseIsFree(value) {
        if (value === undefined || value === null)
            return undefined;
        const str = String(value).toLowerCase();
        if (str.includes('無料') || str === 'free' || str === '0') {
            return true;
        }
        if (str.includes('有料') || str === 'paid') {
            return false;
        }
        return null; // 不明
    }
    /**
     * targetAgesをパース
     */
    parseTargetAges(value) {
        if (!value)
            return undefined;
        if (Array.isArray(value)) {
            return value.map((v) => String(v));
        }
        return [String(value)];
    }
    /**
     * imageUrlsをパース
     */
    parseImageUrls(value) {
        if (!value)
            return undefined;
        if (Array.isArray(value)) {
            return value.map((v) => String(v));
        }
        const str = String(value);
        // カンマ区切りの場合は分割
        if (str.includes(',')) {
            return str
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s);
        }
        return [str];
    }
}
exports.XmlNormalizer = XmlNormalizer;
//# sourceMappingURL=xml.js.map