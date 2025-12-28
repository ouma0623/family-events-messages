/**
 * エラーハンドラー
 * 20_ERROR_HANDLING.md に準拠
 */
/**
 * エラーレベル
 */
export declare enum ErrorLevel {
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
/**
 * エラーログエントリ
 */
export interface ErrorLogEntry {
    timestamp: string;
    level: ErrorLevel;
    sourceId?: string;
    message: string;
    error?: string;
    eventId?: string;
    stack?: string;
}
/**
 * エラーハンドラー
 */
export declare class ErrorHandler {
    private logDir;
    private enableFileLogging;
    constructor(logDir?: string);
    /**
     * ログディレクトリを確保
     */
    private ensureLogDirectory;
    /**
     * エラーログを出力
     */
    log(entry: Omit<ErrorLogEntry, 'timestamp'>): void;
    /**
     * 警告ログを出力
     */
    warn(message: string, context?: {
        sourceId?: string;
        eventId?: string;
        error?: string;
    }): void;
    /**
     * エラーログを出力
     */
    error(message: string, context?: {
        sourceId?: string;
        eventId?: string;
        error?: string;
        stack?: string;
    }): void;
    /**
     * 重大エラーログを出力
     */
    critical(message: string, context?: {
        sourceId?: string;
        error?: string;
        stack?: string;
    }): void;
    /**
     * ログファイルに書き込み
     */
    private writeLogFile;
}
/**
 * グローバルエラーハンドラーインスタンス
 */
export declare const errorHandler: ErrorHandler;
//# sourceMappingURL=handler.d.ts.map