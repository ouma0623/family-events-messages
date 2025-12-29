/**
 * Repositoryインターフェース
 * 18_DATA_PIPELINE.md セクション3.1 に準拠
 */
import { EventNormalized } from '@ouma-family-event/common';
import { SearchQuery, UserPreference } from './types';
/**
 * EventRepositoryインターフェース
 */
export interface EventRepository {
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
     * @param userPref ユーザー設定
     * @param weekendOf 週末の基準日（YYYY-MM-DD形式、指定しない場合は今週末）
     */
    listWeekendRecommendations(userPref: UserPreference, weekendOf?: string): Promise<EventNormalized[]>;
    /**
     * 全イベントを削除（洗い替え用）
     */
    deleteAll(): Promise<void>;
}
//# sourceMappingURL=interface.d.ts.map