/**
 * eventId生成ユーティリティ
 * 15_NORMALIZED_SCHEMA.md セクション2 に準拠
 * 22_DEV_GUIDELINES.md セクション2.1 に準拠
 */

import * as crypto from 'crypto';

/**
 * sourceEventIdが無い場合のハッシュ生成
 * @param title タイトル
 * @param startAt 開始日時（ISO8601）
 * @param endAt 終了日時（ISO8601）
 * @param venueName 会場名（空文字列可）
 * @param url URL
 * @returns 16桁のハッシュ文字列
 */
export function generateSourceEventId(
  title: string,
  startAt: string,
  endAt: string,
  venueName: string,
  url: string
): string {
  // 区切り文字は "|" を使用
  const input = `${title}|${startAt}|${endAt}|${venueName}|${url}`;

  // sha256でハッシュ化
  const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');

  // 先頭16桁を返す
  return hash.substring(0, 16);
}

/**
 * eventIdを生成
 * @param sourceId ソースID
 * @param sourceEventId ソース側イベントID（無い場合はハッシュ生成）
 * @param title タイトル
 * @param startAt 開始日時（ISO8601）
 * @param endAt 終了日時（ISO8601）
 * @param venueName 会場名（空文字列可）
 * @param url URL
 * @returns eventId
 */
export function generateEventId(
  sourceId: string,
  sourceEventId: string | undefined,
  title: string,
  startAt: string,
  endAt: string,
  venueName: string,
  url: string
): string {
  const actualSourceEventId =
    sourceEventId || generateSourceEventId(title, startAt, endAt, venueName || '', url);

  return `${sourceId}:${actualSourceEventId}`;
}
