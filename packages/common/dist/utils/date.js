"use strict";
/**
 * 日付処理ユーティリティ
 * 15_NORMALIZED_SCHEMA.md セクション1.2 に準拠
 * JST固定（+09:00）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDateToISO8601 = parseDateToISO8601;
exports.parseDateTimeToISO8601 = parseDateTimeToISO8601;
exports.getCurrentISO8601 = getCurrentISO8601;
const JST_OFFSET = '+09:00';
/**
 * 日付文字列をISO8601形式（JST）に変換
 * @param dateStr 日付文字列（YYYY-MM-DD, YYYY/MM/DD等）
 * @param isEnd 終了日の場合true（23:59:59を設定）
 * @returns ISO8601形式の文字列（JST固定）
 */
function parseDateToISO8601(dateStr, isEnd = false) {
    // 複数の日付が含まれる場合、最初の日付を抽出
    // 「、」や「,」で区切られている場合を想定
    let singleDateStr = dateStr.trim();
    if (singleDateStr.includes('、') || singleDateStr.includes(',')) {
        // 最初の日付を抽出
        const parts = singleDateStr.split(/[、,]/);
        singleDateStr = parts[0].trim();
    }
    // 日付文字列を正規化（YYYY-MM-DD形式に統一）
    const normalized = normalizeDateString(singleDateStr);
    if (!normalized) {
        throw new Error(`Invalid date format: ${dateStr}`);
    }
    if (isEnd) {
        // 終了日: 23:59:59を設定
        return `${normalized}T23:59:59${JST_OFFSET}`;
    }
    else {
        // 開始日: 00:00:00を設定
        return `${normalized}T00:00:00${JST_OFFSET}`;
    }
}
/**
 * 日付文字列を正規化（YYYY-MM-DD形式に変換）
 */
function normalizeDateString(dateStr) {
    // YYYY-MM-DD形式（月や日が1桁の場合も含む）
    const match1 = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match1) {
        const [, year, month, day] = match1;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // YYYY/MM/DD形式（月や日が1桁の場合も含む）
    const match2 = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (match2) {
        const [, year, month, day] = match2;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // YYYY年MM月DD日形式
    const match3 = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match3) {
        const [, year, month, day] = match3;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // MM月DD日形式（年が省略されている場合、現在年を使用）
    const match4 = dateStr.match(/(\d{1,2})月(\d{1,2})日/);
    if (match4) {
        const currentYear = new Date().getFullYear();
        const [, month, day] = match4;
        return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // MM月上旬/中旬/下旬形式（年が省略されている場合、現在年を使用）
    const match5 = dateStr.match(/(\d{1,2})月(上旬|中旬|下旬)/);
    if (match5) {
        const currentYear = new Date().getFullYear();
        const [, month, period] = match5;
        let day = '01';
        if (period === '中旬') {
            day = '15';
        }
        else if (period === '下旬') {
            day = '28'; // 月によって異なるが、28日をデフォルトとする
        }
        return `${currentYear}-${month.padStart(2, '0')}-${day}`;
    }
    // MM月第N曜日形式（年が省略されている場合、現在年を使用）
    // 例: 5月第4土曜日 → その年の5月の第4土曜日を計算
    const match6 = dateStr.match(/(\d{1,2})月第(\d{1,2})([月火水木金土日])曜日/);
    if (match6) {
        const currentYear = new Date().getFullYear();
        const [, month, nth, dayOfWeek] = match6;
        const dayOfWeekMap = {
            日: 0,
            月: 1,
            火: 2,
            水: 3,
            木: 4,
            金: 5,
            土: 6,
        };
        const targetDayOfWeek = dayOfWeekMap[dayOfWeek];
        const nthNum = parseInt(nth, 10);
        // その月の最初の日を取得
        const firstDay = new Date(currentYear, parseInt(month, 10) - 1, 1);
        // 最初の日の曜日を取得
        const firstDayOfWeek = firstDay.getDay();
        // 目標の曜日までの日数を計算
        let daysToAdd = (targetDayOfWeek - firstDayOfWeek + 7) % 7;
        // 第N週なので、(N-1)週分の日数を追加
        daysToAdd += (nthNum - 1) * 7;
        const targetDate = new Date(currentYear, parseInt(month, 10) - 1, 1 + daysToAdd);
        const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
        const targetDay = String(targetDate.getDate()).padStart(2, '0');
        return `${currentYear}-${targetMonth}-${targetDay}`;
    }
    return null;
}
/**
 * 日時文字列をISO8601形式（JST）に変換
 * @param dateTimeStr 日時文字列（YYYY-MM-DD HH:mm:ss等）
 * @returns ISO8601形式の文字列（JST固定）
 */
function parseDateTimeToISO8601(dateTimeStr) {
    // 日時文字列をパース
    const normalized = normalizeDateTimeString(dateTimeStr);
    if (!normalized) {
        throw new Error(`Invalid datetime format: ${dateTimeStr}`);
    }
    return `${normalized}${JST_OFFSET}`;
}
/**
 * 日時文字列を正規化（YYYY-MM-DDTHH:mm:ss形式に変換）
 */
function normalizeDateTimeString(dateTimeStr) {
    // YYYY-MM-DD HH:mm:ss形式
    const match1 = dateTimeStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
    if (match1) {
        return `${match1[1]}T${match1[2]}`;
    }
    // YYYY-MM-DDTHH:mm:ss形式（既にISO8601形式）
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateTimeStr)) {
        return dateTimeStr;
    }
    // YYYY-MM-DD HH:mm形式
    const match2 = dateTimeStr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
    if (match2) {
        return `${match2[1]}T${match2[2]}:00`;
    }
    return null;
}
/**
 * 現在日時をISO8601形式（JST）で取得
 */
function getCurrentISO8601() {
    const now = new Date();
    // JSTはUTC+9時間
    const jstTime = now.getTime() + 9 * 60 * 60 * 1000;
    const jstDate = new Date(jstTime);
    const year = jstDate.getUTCFullYear();
    const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jstDate.getUTCDate()).padStart(2, '0');
    const hours = String(jstDate.getUTCHours()).padStart(2, '0');
    const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(jstDate.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${JST_OFFSET}`;
}
//# sourceMappingURL=date.js.map