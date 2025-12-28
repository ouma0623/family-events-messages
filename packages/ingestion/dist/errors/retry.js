"use strict";
/**
 * リトライロジック
 * 20_ERROR_HANDLING.md セクション2.2 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRetryableError = isRetryableError;
exports.withRetry = withRetry;
const handler_1 = require("./handler");
/**
 * リトライ可能なエラーかどうか判定
 */
function isRetryableError(error) {
    // HTTPステータスコード
    if (error?.response?.status) {
        const status = error.response.status;
        return status === 429 || status >= 500;
    }
    // ネットワークエラー
    if (error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ECONNREFUSED') {
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
function sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
/**
 * リトライ付きで関数を実行
 * @param fn 実行する関数
 * @param maxRetries 最大リトライ回数（デフォルト: 3）
 * @param context エラーログ用のコンテキスト
 * @returns 関数の実行結果
 */
async function withRetry(fn, maxRetries = 3, context) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
            const errorMessage = error?.message || error?.toString() || String(error);
            handler_1.errorHandler.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${waitSeconds}s`, {
                sourceId: context?.sourceId,
                error: errorMessage,
            });
            await sleep(waitSeconds);
        }
    }
    // 全てのリトライが失敗
    const lastErrorMessage = lastError?.message || lastError?.toString() || String(lastError);
    const lastErrorStack = lastError?.stack;
    handler_1.errorHandler.error(`Failed after ${maxRetries} retries`, {
        sourceId: context?.sourceId,
        error: lastErrorMessage,
        stack: lastErrorStack,
    });
    throw lastError;
}
//# sourceMappingURL=retry.js.map