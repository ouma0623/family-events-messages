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
export function createFetcher(source: Source): BaseFetcher {
  if (source.format === 'html') {
    return new HtmlFetcher(source);
  }

  throw new Error(`Unsupported format: ${source.format}`);
}

export { BaseFetcher, HtmlFetcher };
