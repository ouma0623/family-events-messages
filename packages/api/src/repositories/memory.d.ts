/**
 * メモリ実装（開発・テスト用）
 * 18_DATA_PIPELINE.md セクション3.1 に準拠
 */
import { EventRepository } from './interface';
import { EventNormalized } from '@ouma-family-event/common';
import { SearchQuery, UserPreference } from './types';
/**
 * メモリ実装（開発・テスト用）
 */
export declare class MemoryEventRepository implements EventRepository {
  private events;
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
  listWeekendRecommendations(userPref: UserPreference): Promise<EventNormalized[]>;
}
//# sourceMappingURL=memory.d.ts.map
