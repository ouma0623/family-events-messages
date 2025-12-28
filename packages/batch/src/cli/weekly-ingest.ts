/**
 * weekly-ingestバッチのCLIエントリーポイント
 * EC2インスタンス上で実行される
 */

import { runWeeklyIngest } from '../weekly-ingest';
import { DynamoDBEventRepository } from '@ouma-family-event/api';
import { errorHandler } from '@ouma-family-event/ingestion';

async function main() {
  try {
    console.log('=== weekly-ingestバッチ開始 ===');
    
    // Repositoryの初期化
    const repository = new DynamoDBEventRepository();

    // バッチ処理を実行
    const results = await runWeeklyIngest(repository, false, true);

    // 結果を集計
    const totalFetched = results.reduce((sum, r) => sum + r.fetched, 0);
    const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0);
    const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);
    const successCount = results.filter((r) => r.success).length;

    console.log('=== 実行結果 ===');
    console.log(`総ソース数: ${results.length}`);
    console.log(`成功ソース数: ${successCount}`);
    console.log(`取得件数: ${totalFetched}`);
    console.log(`正規化件数: ${totalNormalized}`);
    console.log(`保存件数: ${totalSaved}`);

    // エラーがある場合は出力
    results.forEach((result) => {
      if (!result.success || result.errors.length > 0) {
        console.error(`エラー: ${result.sourceId}`);
        result.errors.forEach((error) => console.error(`  - ${error}`));
      }
    });

    console.log('=== weekly-ingestバッチ終了 ===');

    // エラーがある場合は終了コード1を返す
    if (successCount < results.length) {
      process.exit(1);
    }
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || String(error);
    errorHandler.critical('Weekly ingest batch failed', {
      error: errorMessage,
    });
    console.error(`致命的なエラー: ${errorMessage}`);
    process.exit(1);
  }
}

main();

