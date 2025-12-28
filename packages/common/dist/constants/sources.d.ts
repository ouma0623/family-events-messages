/**
 * データソース定義
 * 14_SOURCES_AICHI.md に完全準拠
 */
import { Source, SourceId } from '../types/Source';
/**
 * 全ソース定義
 * Phase8: WalkerPlusのみに統一
 */
export declare const SOURCES: Record<SourceId, Source>;
/**
 * ソースIDの配列
 */
export declare const SOURCE_IDS: SourceId[];
/**
 * sourceIdからSourceを取得
 */
export declare function getSource(sourceId: SourceId): Source;
/**
 * 全ソースを取得
 */
export declare function getAllSources(): Source[];
/**
 * DKANソースのみを取得（Phase8: 削除済み）
 * @deprecated Phase8でDKANソースは削除されました
 */
export declare function getDkanSources(): Source[];
//# sourceMappingURL=sources.d.ts.map