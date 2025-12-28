"use strict";
/**
 * CSV正規化
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvNormalizer = void 0;
const base_1 = require("./base");
const common_1 = require("@ouma-family-event/common");
/**
 * CSV正規化クラス
 */
class CsvNormalizer extends base_1.BaseNormalizer {
    /**
     * CSV行をEventNormalizedに変換
     */
    normalize(mapped, raw) {
        // 必須フィールドを抽出
        // 配列の場合は最初の要素を使用
        const getFirstValue = (value) => {
            if (Array.isArray(value)) {
                return String(value[0] || '').trim();
            }
            return String(value || '').trim();
        };
        // titleから余分なカンマを除去
        let title = getFirstValue(mapped.title);
        // 末尾のカンマを除去
        title = title.replace(/[,，、]+$/, '');
        let startAtStr = getFirstValue(mapped.startAt);
        let endAtStr = getFirstValue(mapped.endAt);
        // 予定月日のような日付範囲（例: 2024年1月1日〜1月3日、2月上旬～３月中旬）を処理
        if (startAtStr && (startAtStr.includes('〜') || startAtStr.includes('～') || startAtStr.includes('-'))) {
            const separators = ['〜', '～', '-'];
            for (const sep of separators) {
                if (startAtStr.includes(sep)) {
                    const parts = startAtStr.split(sep);
                    if (parts.length === 2) {
                        startAtStr = parts[0].trim();
                        if (!endAtStr) {
                            endAtStr = parts[1].trim();
                        }
                    }
                    break;
                }
            }
        }
        // startAtをパース
        let startAt = this.parseDate(startAtStr, false) || '';
        // endAtが空の場合、startAtと同じ日付を使用
        let endAt = '';
        if (endAtStr) {
            endAt = this.parseDate(endAtStr, true) || '';
        }
        // endAtが空でstartAtがある場合、startAtと同じ日付を使用
        if (!endAt && startAt) {
            // startAtの日付部分を取得して、終了日として設定
            try {
                endAt = (0, common_1.parseDateToISO8601)(startAtStr, true);
            }
            catch {
                // パースに失敗した場合は、startAtと同じ日付を使用
                endAt = startAt.replace('T00:00:00', 'T23:59:59');
            }
        }
        let url = getFirstValue(mapped.url);
        // URLが空の場合、rawから直接探す（マッピングされていない可能性がある）
        // また、複数のURL列がある場合（コンテンツURLとURL）は、空でない方を優先
        if (!url && raw) {
            url = getFirstValue(raw['コンテンツURL']) || getFirstValue(raw['URL']) || getFirstValue(raw['url']) || '';
        }
        // mappedに複数のURLが含まれている場合（配列の場合）、空でない最初の値を取得
        if (!url && mapped.url && Array.isArray(mapped.url)) {
            url = mapped.url.find((u) => u && u.trim()) || '';
        }
        // URLが空の場合、ソースURLをデフォルト値として使用
        if (!url || !url.trim()) {
            url = this.source.url || '';
        }
        // オプショナルフィールドを抽出
        const partial = {
            sourceEventId: mapped.sourceEventId ? getFirstValue(mapped.sourceEventId) : undefined,
            description: mapped.description ? getFirstValue(mapped.description) : undefined,
            timeText: mapped.timeText ? getFirstValue(mapped.timeText) : undefined,
            venueName: mapped.venueName ? getFirstValue(mapped.venueName) : undefined,
            venueAddress: mapped.venueAddress ? getFirstValue(mapped.venueAddress) : undefined,
            venueCity: mapped.venueCity ? getFirstValue(mapped.venueCity) : undefined,
            venuePref: mapped.venuePref ? getFirstValue(mapped.venuePref) : undefined,
            priceText: mapped.priceText ? getFirstValue(mapped.priceText) : undefined,
            isFree: this.parseIsFree(mapped.isFree),
            targetAges: this.parseTargetAges(mapped.targetAges),
            imageUrls: this.parseImageUrls(mapped.imageUrls),
            applyStartAt: this.parseDate(getFirstValue(mapped.applyStartAt), false),
            applyEndAt: this.parseDate(getFirstValue(mapped.applyEndAt), true),
            contactName: mapped.contactName ? getFirstValue(mapped.contactName) : undefined,
            contactTel: mapped.contactTel ? getFirstValue(mapped.contactTel) : undefined,
            contactEmail: mapped.contactEmail ? getFirstValue(mapped.contactEmail) : undefined,
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
exports.CsvNormalizer = CsvNormalizer;
//# sourceMappingURL=csv.js.map