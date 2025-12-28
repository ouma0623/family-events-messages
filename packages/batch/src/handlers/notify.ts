/**
 * Lambda/ECSハンドラー（金曜通知バッチ）
 * 06_BATCH_JOBS.md セクション2 に準拠
 */

import { runFridayNotify, User } from '../friday-notify';
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

    // 通知有効なユーザー一覧を取得
    const dbRepository = repository as DynamoDBEventRepository;
    const usersData = await dbRepository.getNotifyEnabledUsers();

    // User形式に変換
    const users: User[] = usersData
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
    const results = await runFridayNotify(repository, users);

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
  } catch (error: any) {
    const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
    errorHandler.critical('Friday notify batch failed', {
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
