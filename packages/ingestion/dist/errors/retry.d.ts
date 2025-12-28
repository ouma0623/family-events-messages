/**
 * リトライロジック
 * 20_ERROR_HANDLING.md セクション2.2 に準拠
 */
/**
 * リトライ可能なエラーかどうか判定
 */
export declare function isRetryableError(error: any): boolean;
/**
 * リトライ付きで関数を実行
 * @param fn 実行する関数
 * @param maxRetries 最大リトライ回数（デフォルト: 3）
 * @param context エラーログ用のコンテキスト
 * @returns 関数の実行結果
 */
export declare function withRetry<T>(fn: () => Promise<T>, maxRetries?: number, context?: {
    sourceId?: string;
}): Promise<T>;
//# sourceMappingURL=retry.d.ts.map