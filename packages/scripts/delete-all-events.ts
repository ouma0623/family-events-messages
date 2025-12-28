/**
 * DynamoDBから全イベントデータを削除するスクリプト
 * Phase8: WalkerPlus一本化のためのデータクリーンアップ（全データ削除版）
 */

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventsTableName = process.env.EVENTS_TABLE_NAME || 'ouma-fe-prd-events';

async function deleteAllEvents() {
  console.log('=== 全イベントデータ削除スクリプト ===\n');
  console.log(`テーブル: ${eventsTableName}`);
  console.log('削除対象: 全イベントデータ\n');

  let totalScanned = 0;
  let totalDeleted = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    // スキャンでイベントを取得
    const scanParams: any = {
      TableName: eventsTableName,
      Limit: 100,
    };

    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    const scanResult = await dynamoClient.send(new ScanCommand(scanParams));
    const items = scanResult.Items || [];
    totalScanned += items.length;

    if (items.length > 0) {
      // バッチ削除（最大25件ずつ）
      const batchSize = 25;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const deleteRequests = batch.map((item) => {
          const unmarshalled = unmarshall(item);
          return {
            DeleteRequest: {
              Key: { eventId: unmarshalled.eventId },
            },
          };
        });

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [eventsTableName]: deleteRequests,
            },
          })
        );

        totalDeleted += batch.length;
        console.log(`削除: ${totalDeleted}件 (スキャン済み: ${totalScanned}件)`);
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`\n=== 削除完了 ===`);
  console.log(`スキャン総数: ${totalScanned}件`);
  console.log(`削除件数: ${totalDeleted}件`);
}

// 実行
deleteAllEvents().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});
