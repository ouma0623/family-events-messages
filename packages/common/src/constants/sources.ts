/**
 * データソース定義
 * 14_SOURCES_AICHI.md に完全準拠
 */

import { Source, SourceId } from '../types/Source';

/**
 * 全ソース定義
 * Phase8: WalkerPlusのみに統一
 */
export const SOURCES: Record<SourceId, Source> = {
  S8_WALKERPLUS: {
    sourceId: 'S8_WALKERPLUS',
    name: 'WalkerPlus 東海イベント',
    url: 'https://www.walkerplus.com/event_list/ar0600/',
    format: 'html',
    encoding: 'utf-8',
  },
};

/**
 * ソースIDの配列
 */
export const SOURCE_IDS: SourceId[] = Object.keys(SOURCES) as SourceId[];

/**
 * sourceIdからSourceを取得
 */
export function getSource(sourceId: SourceId): Source {
  return SOURCES[sourceId];
}

/**
 * 全ソースを取得
 */
export function getAllSources(): Source[] {
  return Object.values(SOURCES);
}

/**
 * DKANソースのみを取得（Phase8: 削除済み）
 * @deprecated Phase8でDKANソースは削除されました
 */
export function getDkanSources(): Source[] {
  return [];
}
