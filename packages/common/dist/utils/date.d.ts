/**
 * 日付処理ユーティリティ
 * 15_NORMALIZED_SCHEMA.md セクション1.2 に準拠
 * JST固定（+09:00）
 */
/**
 * 日付文字列をISO8601形式（JST）に変換
 * @param dateStr 日付文字列（YYYY-MM-DD, YYYY/MM/DD等）
 * @param isEnd 終了日の場合true（23:59:59を設定）
 * @returns ISO8601形式の文字列（JST固定）
 */
export declare function parseDateToISO8601(dateStr: string, isEnd?: boolean): string;
/**
 * 日時文字列をISO8601形式（JST）に変換
 * @param dateTimeStr 日時文字列（YYYY-MM-DD HH:mm:ss等）
 * @returns ISO8601形式の文字列（JST固定）
 */
export declare function parseDateTimeToISO8601(dateTimeStr: string): string;
/**
 * 現在日時をISO8601形式（JST）で取得
 */
export declare function getCurrentISO8601(): string;
//# sourceMappingURL=date.d.ts.map