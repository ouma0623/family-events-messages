/**
 * カテゴリ判定
 * 08_RULE_TAGGING.md セクション3 に準拠
 */

import { Category, CATEGORY_KEYWORDS } from '@ouma-family-event/common';
import { EventNormalized } from '@ouma-family-event/common';

/**
 * テキストを正規化（全角/半角統一、記号除去）
 */
function normalizeText(text: string): string {
  // 全角英数字を半角に変換
  let normalized = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });

  // 記号を除去
  normalized = normalized.replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');

  // 小文字に統一
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * カテゴリを判定
 */
export function tagCategories(event: EventNormalized): Category[] {
  const title = event.title ? normalizeText(event.title) : '';
  const description = event.description ? normalizeText(event.description) : '';
  const venueName = event.venueName ? normalizeText(event.venueName) : '';

  // 各カテゴリのスコアを計算
  const scores: Record<Category, number> = {} as Record<Category, number>;

  for (const category of Object.keys(CATEGORY_KEYWORDS) as Category[]) {
    let score = 0;
    const keywords = CATEGORY_KEYWORDS[category];

    for (const keyword of keywords) {
      const normalizedKeyword = normalizeText(keyword);
      const regex = new RegExp(normalizedKeyword, 'g');

      // titleは重み2、descriptionは重み1
      const titleMatches = (title.match(regex) || []).length;
      const descMatches = (description.match(regex) || []).length;
      const venueMatches = (venueName.match(regex) || []).length;

      score += titleMatches * 2 + descMatches * 1 + venueMatches * 1;
    }

    scores[category] = score;
  }

  // スコアが0より大きいカテゴリを取得
  const categories = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)
    .map(([category, _]) => category as Category);

  // 上位1〜2カテゴリを返す（同点なら両方）
  if (categories.length === 0) {
    return []; // 何も当たらなければ空配列
  }

  const topScore = scores[categories[0]];
  const result = categories.filter((cat) => scores[cat] === topScore);

  // 最大2つまで
  return result.slice(0, 2);
}
