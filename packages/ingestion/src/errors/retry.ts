/**
 * リトライロジック
 * 20_ERROR_HANDLING.md セクション2.2 に準拠
 */

import { errorHandler } from './handler';

/**
 * リトライ可能なエラーかどうか判定
 */
export function isRetryableError(error: any): boolean {
  // HTTPステータスコード
  if (error?.response?.status) {
    const status = error.response.status;
    return status === 429 || status >= 500;
  }

  // ネットワークエラー
  if (
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNREFUSED'
  ) {
    return true;
  }

  // タイムアウトエラー
  if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * 指数バックオフで待機
 */
function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * リトライ付きで関数を実行
 * @param fn 実行する関数
 * @param maxRetries 最大リトライ回数（デフォルト: 3）
 * @param context エラーログ用のコンテキスト
 * @returns 関数の実行結果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context?: { sourceId?: string }
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // リトライ可能なエラーかどうか確認
      if (!isRetryableError(error)) {
        // リトライ不可のエラーは即座にthrow
        throw error;
      }

      // 最後の試行の場合はthrow
      if (attempt === maxRetries) {
        break;
      }

      // 指数バックオフで待機（1秒、2秒、4秒）
      const waitSeconds = Math.pow(2, attempt);
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      errorHandler.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitSeconds}s`, {
        sourceId: context?.sourceId,
        error: errorMessage,
      });
      await sleep(waitSeconds);
    }
  }

  // 全てのリトライが失敗
  const lastErrorMessage =
    (lastError as any)?.message || (lastError as any)?.toString() || String(lastError);
  const lastErrorStack = (lastError as any)?.stack;
  errorHandler.error(`Failed after ${maxRetries} retries`, {
    sourceId: context?.sourceId,
    error: lastErrorMessage,
    stack: lastErrorStack,
  });
  throw lastError;
}
