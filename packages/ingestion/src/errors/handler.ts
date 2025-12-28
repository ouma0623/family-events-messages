/**
 * エラーハンドラー
 * 20_ERROR_HANDLING.md に準拠
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCurrentISO8601 } from '@ouma-family-event/common';

/**
 * エラーレベル
 */
export enum ErrorLevel {
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * エラーログエントリ
 */
export interface ErrorLogEntry {
  timestamp: string; // ISO8601形式
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
export class ErrorHandler {
  private logDir: string;
  private enableFileLogging: boolean;

  constructor(logDir?: string) {
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
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      // ディレクトリ作成に失敗した場合はファイルログを無効化
      console.warn(`Failed to create log directory: ${this.logDir}`, error);
      this.enableFileLogging = false;
    }
  }

  /**
   * エラーログを出力
   */
  log(entry: Omit<ErrorLogEntry, 'timestamp'>): void {
    const fullEntry: ErrorLogEntry = {
      ...entry,
      timestamp: getCurrentISO8601(),
    };

    // コンソールにも出力
    console.error(`[${fullEntry.level}] ${fullEntry.message}`, fullEntry.error || '');

    // ファイルに出力
    this.writeLogFile(fullEntry);
  }

  /**
   * 情報ログを出力
   */
  info(message: string, context?: { sourceId?: string; eventId?: string; error?: string }): void {
    // infoレベルはコンソールに出力のみ（ファイルには出力しない）
    console.log(`[INFO] ${message}`, context || '');
  }

  /**
   * 警告ログを出力
   */
  warn(message: string, context?: { sourceId?: string; eventId?: string; error?: string }): void {
    this.log({
      level: ErrorLevel.WARNING,
      message,
      ...context,
    });
  }

  /**
   * エラーログを出力
   */
  error(
    message: string,
    context?: {
      sourceId?: string;
      eventId?: string;
      error?: string;
      stack?: string;
    }
  ): void {
    this.log({
      level: ErrorLevel.ERROR,
      message,
      ...context,
    });
  }

  /**
   * 重大エラーログを出力
   */
  critical(message: string, context?: { sourceId?: string; error?: string; stack?: string }): void {
    this.log({
      level: ErrorLevel.CRITICAL,
      message,
      ...context,
    });
  }

  /**
   * ログファイルに書き込み
   */
  private writeLogFile(entry: ErrorLogEntry): void {
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
    } catch (error) {
      // ファイル書き込みに失敗した場合は警告のみ（CloudWatch Logsには既に出力済み）
      console.warn(`Failed to write log file: ${error}`);
    }
  }
}

/**
 * グローバルエラーハンドラーインスタンス
 */
export const errorHandler = new ErrorHandler();
