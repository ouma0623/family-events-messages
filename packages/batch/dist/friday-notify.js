"use strict";
/**
 * 金曜通知バッチ
 * 06_BATCH_JOBS.md セクション2 に準拠
 * 07_LINE_NOTIFICATION.md に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFridayNotify = runFridayNotify;
const ingestion_1 = require("@ouma-family-event/ingestion");
/**
 * 週末イベントを取得
 */
function getWeekendDateRange() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // 金曜日（5）の場合、次の土日を取得
    // それ以外の場合は今週の土日を取得
    const daysUntilSaturday = (6 - dayOfWeek) % 7 || 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    const startDate = saturday.toISOString().split('T')[0] + 'T00:00:00+09:00';
    const endDate = sunday.toISOString().split('T')[0] + 'T23:59:59+09:00';
    return { startDate, endDate };
}
/**
 * イベントをユーザー設定でフィルタ
 */
function filterByUserPreference(events, userPref) {
    return events.filter((event) => {
        // 都道府県でフィルタ
        if (userPref.pref && event.venuePref !== userPref.pref) {
            return false;
        }
        // 市でフィルタ
        if (userPref.city && event.venueCity !== userPref.city) {
            return false;
        }
        // 対象年齢でフィルタ
        if (userPref.ageRanges && userPref.ageRanges.length > 0) {
            if (!event.targetAges || event.targetAges.length === 0) {
                // unknownは許容（設定による）
            }
            else {
                const hasMatch = event.targetAges.some((age) => userPref.ageRanges.includes(age));
                if (!hasMatch) {
                    return false;
                }
            }
        }
        // 屋内優先
        if (userPref.indoorPreferred) {
            if (event.indoorOutdoor !== 'indoor' && event.indoorOutdoor !== 'both') {
                return false;
            }
        }
        return true;
    });
}
/**
 * イベントをランキング
 */
function rankEvents(events, userPref) {
    // recommendScoreでソート
    return events.sort((a, b) => b.recommendScore - a.recommendScore);
}
/**
 * イベントをメッセージに整形
 */
function formatEventMessage(event) {
    let message = `📅 ${event.title}\n`;
    if (event.venueName) {
        message += `📍 ${event.venueName}\n`;
    }
    if (event.startAt) {
        const startDate = new Date(event.startAt);
        const dateStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
        message += `🗓️ ${dateStr}`;
        if (event.timeText) {
            message += ` ${event.timeText}`;
        }
        message += '\n';
    }
    if (event.isFree === true) {
        message += `💰 無料\n`;
    }
    else if (event.priceText) {
        message += `💰 ${event.priceText}\n`;
    }
    if (event.url) {
        message += `🔗 ${event.url}\n`;
    }
    return message;
}
/**
 * 複数イベントをメッセージに整形
 */
function formatEventsMessage(events) {
    if (events.length === 0) {
        return '今週末のおすすめイベントはありません。';
    }
    let message = `今週末のおすすめイベント（${events.length}件）\n\n`;
    events.slice(0, 10).forEach((event, index) => {
        message += `${index + 1}. ${formatEventMessage(event)}\n`;
    });
    if (events.length > 10) {
        message += `\n他${events.length - 10}件のイベントがあります。`;
    }
    return message;
}
/**
 * LINEメッセージを送信（簡易実装）
 * TODO: 実際のLINE Messaging APIを使用
 */
async function sendLineMessage(lineUserId, message) {
    // TODO: LINE Messaging API SDKを使用して実装
    // const client = new Client({
    //   channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    // });
    // await client.pushMessage({
    //   to: lineUserId,
    //   messages: [{ type: 'text', text: message }],
    // });
    // 暫定実装：ログ出力
    console.log(`[LINE] Sending to ${lineUserId}: ${message}`);
}
/**
 * 金曜通知バッチを実行
 */
async function runFridayNotify(repository, users) {
    const { startDate, endDate } = getWeekendDateRange();
    const results = [];
    // 週末イベントを取得
    const weekendEvents = await repository.search({
        startDate,
        endDate,
        limit: 100,
    });
    // 各ユーザーに通知
    for (const user of users) {
        if (!user.notifyEnabled || !user.lineUserId) {
            continue; // 通知無効またはLINE未連携
        }
        const result = {
            userId: user.userId,
            success: false,
            sent: 0,
            errors: [],
        };
        try {
            // ユーザー設定でフィルタ
            const filteredEvents = filterByUserPreference(weekendEvents, user.preferences);
            // ランキング
            const rankedEvents = rankEvents(filteredEvents, user.preferences);
            // 上位10件を取得
            const topEvents = rankedEvents.slice(0, 10);
            if (topEvents.length > 0) {
                // メッセージ整形
                const message = formatEventsMessage(topEvents);
                // LINE送信
                await sendLineMessage(user.lineUserId, message);
                result.sent = topEvents.length;
            }
            result.success = true;
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            result.errors.push(errorMessage);
            ingestion_1.errorHandler.error(`Failed to send notification to ${user.userId}`, {
                error: errorMessage,
            });
        }
        results.push(result);
    }
    return results;
}
//# sourceMappingURL=friday-notify.js.map