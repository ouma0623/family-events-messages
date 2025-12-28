"use strict";
/**
 * Lambda/ECSハンドラー（金曜通知バッチ）
 * 06_BATCH_JOBS.md セクション2 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const friday_notify_1 = require("../friday-notify");
const api_1 = require("@ouma-family-event/api");
const ingestion_1 = require("@ouma-family-event/ingestion");
/**
 * Lambdaハンドラー
 */
async function handler(event, context) {
    try {
        // Repositoryの初期化（DynamoDB実装を使用）
        const repository = new api_1.DynamoDBEventRepository();
        // 通知有効なユーザー一覧を取得
        const dbRepository = repository;
        const usersData = await dbRepository.getNotifyEnabledUsers();
        // User形式に変換
        const users = usersData
            .filter((u) => u.lineUserId) // LINE連携済みのみ
            .map((u) => ({
            userId: u.userId,
            lineUserId: u.lineUserId,
            preferences: {
                city: u.city || u.preferences?.city,
                pref: u.pref || u.preferences?.pref,
                ageRanges: u.ageRanges || u.preferences?.ageRanges,
                indoorPreferred: u.indoorPreferred || u.preferences?.indoorPreferred,
            },
            notifyEnabled: u.notifyEnabled,
        }));
        // 金曜通知バッチを実行
        const results = await (0, friday_notify_1.runFridayNotify)(repository, users);
        // 結果を集計
        const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
        const successCount = results.filter((r) => r.success).length;
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                summary: {
                    totalUsers: users.length,
                    successUsers: successCount,
                    totalSent,
                },
                results,
            }),
        };
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        ingestion_1.errorHandler.critical('Friday notify batch failed', {
            error: errorMessage,
        });
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: errorMessage,
            }),
        };
    }
}
//# sourceMappingURL=notify.js.map