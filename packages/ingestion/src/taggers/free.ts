/**
 * 無料/有料判定
 * 08_RULE_TAGGING.md セクション6 に準拠
 */

import { EventNormalized } from '@ouma-family-event/common';

/**
 * 無料/有料を判定
 */
export function tagIsFree(event: EventNormalized): boolean | null {
  const priceText = event.priceText ? event.priceText.toLowerCase() : '';
  const description = event.description ? event.description.toLowerCase() : '';
  const allText = `${priceText} ${description}`;

  // 無料キーワード
  if (allText.includes('無料') || allText.includes('0円') || allText.includes('入場無料')) {
    return true;
  }

  // 有料キーワード
  if (allText.match(/円|料金|参加費|入場料/)) {
    // 「入場無料（体験は有料）」のような場合は有料タグも追加
    if (allText.includes('入場無料') && allText.match(/体験.*有料|有料.*体験/)) {
      return false; // 有料
    }
    return false;
  }

  return null; // 不明
}
