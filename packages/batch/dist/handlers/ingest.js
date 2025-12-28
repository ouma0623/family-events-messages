"use strict";
/**
 * Lambda/ECSハンドラー（週次収集バッチ）
 * 06_BATCH_JOBS.md セクション1 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const weekly_ingest_1 = require("../weekly-ingest");
const api_1 = require("@ouma-family-event/api");
const ingestion_1 = require("@ouma-family-event/ingestion");
/**
 * Lambdaハンドラー
 */
async function handler(event, context) {
    try {
        // Repositoryの初期化（DynamoDB実装を使用）
        const repository = new api_1.DynamoDBEventRepository();
        // スキーマ検出モード（環境変数から取得）
        const enableDiscovery = process.env.ENABLE_DISCOVERY === 'true';
        // 週次収集バッチを実行
        const results = await (0, weekly_ingest_1.runWeeklyIngest)(repository, enableDiscovery);
        // 結果を集計
        const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
        const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0);
        const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);
        const successCount = results.filter((r) => r.success).length;
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                summary: {
                    totalSources: results.length,
                    successSources: successCount,
                    totalFetched,
                    totalNormalized,
                    totalSaved,
                },
                results,
            }),
        };
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        ingestion_1.errorHandler.critical('Weekly ingest batch failed', {
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
//# sourceMappingURL=ingest.js.map