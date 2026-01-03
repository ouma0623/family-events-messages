/**
 * カテゴリ分類ユーティリティ
 * キーワードベースでカテゴリを大ジャンル・小ジャンルに分類
 */

export type MajorGenre = '食べる' | '遊ぶ' | '見る・学ぶ';

export interface CategoryClassification {
  majorGenre: MajorGenre;
  minorGenre: string; // 元のカテゴリ名をそのまま使用
}

/**
 * カテゴリをキーワードベースで分類
 * @param category カテゴリ名
 * @returns 分類結果（大ジャンル・小ジャンル）
 */
export function classifyCategory(category: string): CategoryClassification {
  if (!category) {
    // カテゴリが空の場合はデフォルト分類（遊ぶ）
    return {
      majorGenre: '遊ぶ',
      minorGenre: category,
    };
  }

  const normalizedCategory = category.toLowerCase();

  // 食べるキーワード
  const eatKeywords = ['食べ', 'グルメ', 'フード', '味覚', '狩り', 'いちご', 'フルーツ', '物産', '観光フェア'];
  // 遊ぶキーワード
  const playKeywords = [
    '体験',
    'ワークショップ',
    'アクティビティ',
    '公園',
    '屋外',
    'スポーツ',
    '祭り',
    'フェア',
    'フェス',
    'パレード',
    'ライブ',
    '音楽',
    '子供',
    '恋人',
    '夫婦',
    '商業施設',
  ];
  // 見る・学ぶキーワード
  const learnKeywords = [
    '展示',
    '企画展',
    '美術館',
    '文化施設',
    '科学館',
    '博物館',
    '図書館',
    '舞台',
    '演劇',
    '花',
    '自然',
  ];

  // キーワードマッチング（大文字小文字を区別しない）
  for (const keyword of eatKeywords) {
    if (normalizedCategory.includes(keyword.toLowerCase())) {
      return {
        majorGenre: '食べる',
        minorGenre: category,
      };
    }
  }

  for (const keyword of learnKeywords) {
    if (normalizedCategory.includes(keyword.toLowerCase())) {
      return {
        majorGenre: '見る・学ぶ',
        minorGenre: category,
      };
    }
  }

  for (const keyword of playKeywords) {
    if (normalizedCategory.includes(keyword.toLowerCase())) {
      return {
        majorGenre: '遊ぶ',
        minorGenre: category,
      };
    }
  }

  // どのキーワードにもマッチしない場合はデフォルト分類（遊ぶ）
  return {
    majorGenre: '遊ぶ',
    minorGenre: category,
  };
}

/**
 * 複数のカテゴリを分類
 * @param categories カテゴリ名の配列
 * @returns 分類結果の配列
 */
export function classifyCategories(categories: string[]): CategoryClassification[] {
  return categories.map((category) => classifyCategory(category));
}







