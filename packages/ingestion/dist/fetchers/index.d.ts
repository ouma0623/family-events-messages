/**
 * フェッチャーファクトリー
 * Phase8: WalkerPlus（HTML）のみ対応
 */
import { Source } from '@ouma-family-event/common';
import { BaseFetcher } from './base';
import { HtmlFetcher } from './html';
/**
 * ソースに応じたフェッチャーを生成
 */
export declare function createFetcher(source: Source): BaseFetcher;
export { BaseFetcher, HtmlFetcher };
//# sourceMappingURL=index.d.ts.map