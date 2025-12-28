/**
 * Repository型定義
 * 18_DATA_PIPELINE.md セクション3 に準拠
 */

import { EventNormalized } from '@ouma-family-event/common';

/**
 * 検索クエリ
 */
export interface SearchQuery {
  city?: string; // 市で絞り込み
  pref?: string; // 都道府県で絞り込み
  startDate?: string; // 開始日（ISO8601）
  endDate?: string; // 終了日（ISO8601）
  categories?: string[]; // カテゴリで絞り込み
  ageRanges?: string[]; // 年齢範囲で絞り込み
  indoorOutdoor?: string; // 屋内/屋外
  isFree?: boolean; // 無料/有料
  keyword?: string; // キーワード検索（タイトル/概要/会場）
  limit?: number; // 取得件数
  offset?: number; // オフセット
}

/**
 * ユーザー設定
 */
export interface UserPreference {
  city?: string;
  pref?: string;
  ageRanges?: string[];
  indoorPreferred?: boolean;
}
