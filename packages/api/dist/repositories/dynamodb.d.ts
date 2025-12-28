/**
 * DynamoDB実装
 * フェーズ5で実装
 */
import { EventRepository } from './interface';
import { EventNormalized } from '@ouma-family-event/common';
import { SearchQuery, UserPreference } from './types';
/**
 * DynamoDB実装
 */
export declare class DynamoDBEventRepository implements EventRepository {
    private client;
    private eventsTableName;
    private usersTableName;
    private summariesTableName;
    constructor();
    /**
     * イベントを一括Upsert
     */
    upsertMany(events: EventNormalized[]): Promise<void>;
    /**
     * イベントを検索
     */
    search(query: SearchQuery): Promise<EventNormalized[]>;
    /**
     * eventIdでイベントを取得
     */
    getById(eventId: string): Promise<EventNormalized | null>;
    /**
     * 週末おすすめイベントを取得
     */
    listWeekendRecommendations(userPref: UserPreference, weekendOf?: string): Promise<EventNormalized[]>;
    /**
     * 市で検索
     */
    private searchByCity;
    /**
     * 都道府県で検索
     */
    private searchByPref;
    /**
     * カテゴリで検索
     */
    private searchByCategory;
    /**
     * 日付範囲で検索（全件スキャン）
     */
    private searchByDateRange;
    /**
     * 最近のイベントを取得（過去30日から未来30日）
     */
    private searchRecent;
    /**
     * イベントを表示順序でソート
     * 優先度1: イベント期間が3日以内を最優先
     * 優先度2: 同じ優先度の場合はdisplayOrder順
     */
    private sortEventsByDisplayOrder;
    /**
     * EventNormalizedをDynamoDB形式に変換
     */
    private normalizeEvent;
    /**
     * DynamoDB形式からEventNormalizedに変換
     */
    private denormalizeEvent;
    /**
     * TTL計算（イベント終了日から30日後）
     */
    private calculateTTL;
    /**
     * ユーザー情報を取得
     */
    getUser(userId: string): Promise<any | null>;
    /**
     * ユーザー情報を更新
     */
    updateUser(userId: string, preferences: Partial<UserPreference> & {
        lineUserId?: string;
        notifyEnabled?: boolean;
    }): Promise<void>;
    /**
     * 通知有効なユーザー一覧を取得
     */
    getNotifyEnabledUsers(): Promise<any[]>;
}
//# sourceMappingURL=dynamodb.d.ts.map