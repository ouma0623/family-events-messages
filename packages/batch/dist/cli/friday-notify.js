"use strict";
/**
 * friday-notifyバッチのCLIエントリーポイント
 * EC2インスタンス上で実行される
 */
Object.defineProperty(exports, "__esModule", { value: true });
const friday_notify_1 = require("../friday-notify");
const api_1 = require("@ouma-family-event/api");
const ingestion_1 = require("@ouma-family-event/ingestion");
async function main() {
    try {
        console.log('=== friday-notifyバッチ開始 ===');
        // Repositoryの初期化
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
        console.log(`通知対象ユーザー数: ${users.length}`);
        // バッチ処理を実行
        const results = await (0, friday_notify_1.runFridayNotify)(repository, users);
        // 結果を集計
        const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
        const successCount = results.filter((r) => r.success).length;
        console.log('=== 実行結果 ===');
        console.log(`総ユーザー数: ${users.length}`);
        console.log(`成功ユーザー数: ${successCount}`);
        console.log(`送信件数: ${totalSent}`);
        // エラーがある場合は出力
        results.forEach((result) => {
            if (!result.success || result.errors.length > 0) {
                console.error(`エラー: ${result.userId}`);
                result.errors.forEach((error) => console.error(`  - ${error}`));
            }
        });
        console.log('=== friday-notifyバッチ終了 ===');
        // エラーがある場合は終了コード1を返す
        if (successCount < users.length) {
            process.exit(1);
        }
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        ingestion_1.errorHandler.critical('Friday notify batch failed', {
            error: errorMessage,
        });
        console.error(`致命的なエラー: ${errorMessage}`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=friday-notify.js.map