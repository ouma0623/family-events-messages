/**
 * カテゴリ分類ユーティリティ
 * キーワードベースでカテゴリを大ジャンル・小ジャンルに分類
 */
export type MajorGenre = '食べる' | '遊ぶ' | '見る・学ぶ';
export interface CategoryClassification {
    majorGenre: MajorGenre;
    minorGenre: string;
}
/**
 * カテゴリをキーワードベースで分類
 * @param category カテゴリ名
 * @returns 分類結果（大ジャンル・小ジャンル）
 */
export declare function classifyCategory(category: string): CategoryClassification;
/**
 * 複数のカテゴリを分類
 * @param categories カテゴリ名の配列
 * @returns 分類結果の配列
 */
export declare function classifyCategories(categories: string[]): CategoryClassification[];
//# sourceMappingURL=categoryClassifier.d.ts.map