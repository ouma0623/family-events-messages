/**
 * 金曜通知バッチ
 * 06_BATCH_JOBS.md セクション2 に準拠
 * 07_LINE_NOTIFICATION.md に準拠
 */
import { EventRepository, UserPreference } from '@ouma-family-event/api';
/**
 * 通知結果
 */
export interface NotifyResult {
    userId: string;
    success: boolean;
    sent: number;
    errors: string[];
}
/**
 * ユーザー情報（LINE連携済み）
 */
export interface User {
    userId: string;
    lineUserId?: string;
    preferences: UserPreference;
    notifyEnabled: boolean;
}
/**
 * 金曜通知バッチを実行
 */
export declare function runFridayNotify(repository: EventRepository, users: User[]): Promise<NotifyResult[]>;
//# sourceMappingURL=friday-notify.d.ts.map