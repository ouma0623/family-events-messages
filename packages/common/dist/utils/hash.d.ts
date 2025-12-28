/**
 * eventId生成ユーティリティ
 * 15_NORMALIZED_SCHEMA.md セクション2 に準拠
 * 22_DEV_GUIDELINES.md セクション2.1 に準拠
 */
/**
 * sourceEventIdが無い場合のハッシュ生成
 * @param title タイトル
 * @param startAt 開始日時（ISO8601）
 * @param endAt 終了日時（ISO8601）
 * @param venueName 会場名（空文字列可）
 * @param url URL
 * @returns 16桁のハッシュ文字列
 */
export declare function generateSourceEventId(title: string, startAt: string, endAt: string, venueName: string, url: string): string;
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
export declare function generateEventId(sourceId: string, sourceEventId: string | undefined, title: string, startAt: string, endAt: string, venueName: string, url: string): string;
//# sourceMappingURL=hash.d.ts.map