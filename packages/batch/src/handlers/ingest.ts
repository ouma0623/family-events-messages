/**
 * Lambda/ECSハンドラー（週次収集バッチ）
 * 06_BATCH_JOBS.md セクション1 に準拠
 */

import { runWeeklyIngest } from '../weekly-ingest';
import { EventRepository } from '@ouma-family-event/api';
import { DynamoDBEventRepository } from '@ouma-family-event/api';
import { errorHandler } from '@ouma-family-event/ingestion';

/**
 * Lambdaハンドラー
 */
export async function handler(
  event: any,
  context: any
): Promise<{ statusCode: number; body: string }> {
  try {
    // Repositoryの初期化（DynamoDB実装を使用）
    const repository: EventRepository = new DynamoDBEventRepository();

    // スキーマ検出モード（環境変数から取得）
    const enableDiscovery = process.env.ENABLE_DISCOVERY === 'true';

    // 週次収集バッチを実行
    const results = await runWeeklyIngest(repository, enableDiscovery);

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
  } catch (error: any) {
    const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
    errorHandler.critical('Weekly ingest batch failed', {
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
