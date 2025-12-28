"use strict";
/**
 * エラーハンドラー
 * 20_ERROR_HANDLING.md に準拠
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ErrorHandler = exports.ErrorLevel = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@ouma-family-event/common");
/**
 * エラーレベル
 */
var ErrorLevel;
(function (ErrorLevel) {
    ErrorLevel["WARNING"] = "WARNING";
    ErrorLevel["ERROR"] = "ERROR";
    ErrorLevel["CRITICAL"] = "CRITICAL";
})(ErrorLevel || (exports.ErrorLevel = ErrorLevel = {}));
/**
 * エラーハンドラー
 */
class ErrorHandler {
    logDir;
    enableFileLogging;
    constructor(logDir) {
        // Lambda環境の場合は /tmp を使用、それ以外は logs を使用
        const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        this.logDir = logDir || (isLambda ? '/tmp/logs' : 'logs');
        this.enableFileLogging = !isLambda || process.env.ENABLE_FILE_LOGGING === 'true';
        if (this.enableFileLogging) {
            this.ensureLogDirectory();
        }
    }
    /**
     * ログディレクトリを確保
     */
    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        }
        catch (error) {
            // ディレクトリ作成に失敗した場合はファイルログを無効化
            console.warn(`Failed to create log directory: ${this.logDir}`, error);
            this.enableFileLogging = false;
        }
    }
    /**
     * エラーログを出力
     */
    log(entry) {
        const fullEntry = {
            ...entry,
            timestamp: (0, common_1.getCurrentISO8601)(),
        };
        // コンソールにも出力
        console.error(`[${fullEntry.level}] ${fullEntry.message}`, fullEntry.error || '');
        // ファイルに出力
        this.writeLogFile(fullEntry);
    }
    /**
     * 警告ログを出力
     */
    warn(message, context) {
        this.log({
            level: ErrorLevel.WARNING,
            message,
            ...context,
        });
    }
    /**
     * エラーログを出力
     */
    error(message, context) {
        this.log({
            level: ErrorLevel.ERROR,
            message,
            ...context,
        });
    }
    /**
     * 重大エラーログを出力
     */
    critical(message, context) {
        this.log({
            level: ErrorLevel.CRITICAL,
            message,
            ...context,
        });
    }
    /**
     * ログファイルに書き込み
     */
    writeLogFile(entry) {
        // ファイルログが無効化されている場合はスキップ
        if (!this.enableFileLogging) {
            return;
        }
        try {
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const sourceId = entry.sourceId || 'unknown';
            const logDir = path.join(this.logDir, 'ingestion_errors', sourceId);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const logFile = path.join(logDir, `${date}.log`);
            const logLine = JSON.stringify(entry) + '\n';
            fs.appendFileSync(logFile, logLine, 'utf8');
        }
        catch (error) {
            // ファイル書き込みに失敗した場合は警告のみ（CloudWatch Logsには既に出力済み）
            console.warn(`Failed to write log file: ${error}`);
        }
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * グローバルエラーハンドラーインスタンス
 */
exports.errorHandler = new ErrorHandler();
//# sourceMappingURL=handler.js.map