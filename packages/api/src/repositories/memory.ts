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
export class MemoryEventRepository implements EventRepository {
  private events: Map<string, EventNormalized> = new Map();

  /**
   * イベントを一括Upsert
   */
  async upsertMany(events: EventNormalized[]): Promise<void> {
    for (const event of events) {
      this.events.set(event.eventId, event);
    }
  }

  /**
   * イベントを検索
   */
  async search(query: SearchQuery): Promise<EventNormalized[]> {
    let results = Array.from(this.events.values());

    // フィルタリング
    if (query.city) {
      results = results.filter((e) => e.venueCity === query.city);
    }
    if (query.pref) {
      results = results.filter((e) => e.venuePref === query.pref);
    }
    if (query.startDate) {
      results = results.filter((e) => e.endAt >= query.startDate!);
    }
    if (query.endDate) {
      results = results.filter((e) => e.startAt <= query.endDate!);
    }
    if (query.categories && query.categories.length > 0) {
      results = results.filter((e) => e.categories.some((cat) => query.categories!.includes(cat)));
    }
    if (query.indoorOutdoor) {
      results = results.filter((e) => e.indoorOutdoor === query.indoorOutdoor);
    }
    if (query.isFree !== undefined) {
      results = results.filter((e) => e.isFree === query.isFree);
    }
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(keyword) ||
          (e.description && e.description.toLowerCase().includes(keyword)) ||
          (e.venueName && e.venueName.toLowerCase().includes(keyword))
      );
    }

    // ソート（startAt昇順）
    results.sort((a, b) => a.startAt.localeCompare(b.startAt));

    // ページネーション
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * eventIdでイベントを取得
   */
  async getById(eventId: string): Promise<EventNormalized | null> {
    return this.events.get(eventId) || null;
  }

  /**
   * 週末おすすめイベントを取得
   */
  async listWeekendRecommendations(userPref: UserPreference): Promise<EventNormalized[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeekend = getNextWeekend(today);

    let results = Array.from(this.events.values());

    // 週末のイベントをフィルタ
    results = results.filter((e) => {
      const startDate = new Date(e.startAt);
      return startDate >= today && startDate <= nextWeekend && isWeekend(startDate);
    });

    // ユーザー設定でフィルタ
    if (userPref.city) {
      results = results.filter((e) => e.venueCity === userPref.city);
    }
    if (userPref.pref) {
      results = results.filter((e) => e.venuePref === userPref.pref);
    }
    if (userPref.indoorPreferred) {
      results = results.filter((e) => e.indoorOutdoor === 'indoor');
    }

    // recommendScoreでソート
    results.sort((a, b) => b.recommendScore - a.recommendScore);

    // 上位20件
    return results.slice(0, 20);
  }
}

/**
 * 次の週末を取得
 */
function getNextWeekend(today: Date): Date {
  const dayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  nextSaturday.setHours(23, 59, 59, 999);
  return nextSaturday;
}

/**
 * 週末かどうか判定
 */
function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 日曜日または土曜日
}
