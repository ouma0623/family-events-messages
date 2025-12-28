/**
 * 年齢判定
 * 08_RULE_TAGGING.md セクション4 に準拠
 */

import { TargetAge } from '@ouma-family-event/common';
import { EventNormalized } from '@ouma-family-event/common';

/**
 * テキストを正規化
 */
function normalizeText(text: string): string {
  return text.toLowerCase();
}

/**
 * 対象年齢を判定
 */
export function tagTargetAges(event: EventNormalized): TargetAge[] {
  const title = event.title ? normalizeText(event.title) : '';
  const description = event.description ? normalizeText(event.description) : '';
  const allText = `${title} ${description}`;

  const ages: TargetAge[] = [];

  // 0-2
  if (allText.match(/乳児|0歳|1歳|2歳|ベビー|赤ちゃん/)) {
    ages.push('0-2');
  }

  // 3-5
  if (allText.match(/未就学|幼児|3歳|4歳|5歳|6歳|園児|親子/)) {
    ages.push('3-5');
  }

  // 6-12
  if (allText.match(/小学生|低学年|高学年|7歳|8歳|9歳|10歳|11歳|12歳/)) {
    ages.push('6-12');
  }

  // 13-15
  if (allText.match(/中学生|13歳|14歳|15歳/)) {
    ages.push('13-15');
  }

  // 16+
  if (allText.match(/高校生|16歳|17歳|18歳|大人|一般/)) {
    ages.push('16+');
  }

  return ages;
}
