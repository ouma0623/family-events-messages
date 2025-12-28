/**
 * DynamoDBから既存イベントデータ（S1〜S7）を削除するスクリプト
 * Phase8: WalkerPlus一本化のためのデータクリーンアップ
 */

import { DynamoDBClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const eventsTableName = process.env.EVENTS_TABLE_NAME || 'Events';

const OLD_SOURCE_IDS = [
  'S1_AICHI_PREF',
  'S2_KARIYA_CSV',
  'S3_KASUGAI_XML',
  'S4_ANJO_XML',
  'S5_TOYOKAWA_DKAN',
  'S6_GAMAGORI_DKAN',
  'S7_TOYOHASHI_DKAN',
];

async function deleteOldEvents() {
  console.log('=== 既存イベントデータ削除スクリプト ===\n');
  console.log(`テーブル: ${eventsTableName}`);
  console.log(`削除対象ソース: ${OLD_SOURCE_IDS.join(', ')}\n`);

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
    const items = (scanResult.Items || []).map((item) => unmarshall(item));
    totalScanned += items.length;

    // 削除対象のイベントをフィルタリング
    const itemsToDelete = items.filter((item) => {
      const sourceId = item.sourceId;
      return OLD_SOURCE_IDS.includes(sourceId);
    });

    if (itemsToDelete.length > 0) {
      // バッチ削除（最大25件ずつ）
      const batchSize = 25;
      for (let i = 0; i < itemsToDelete.length; i += batchSize) {
        const batch = itemsToDelete.slice(i, i + batchSize);
        const deleteRequests = batch.map((item) => ({
          DeleteRequest: {
            Key: marshall({ eventId: item.eventId }),
          },
        }));

        await dynamoClient.send(
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
deleteOldEvents().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});


