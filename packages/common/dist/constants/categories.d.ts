/**
 * カテゴリ定義
 * 08_RULE_TAGGING.md セクション3 に準拠
 */
import { Category } from '../types/Category';
/**
 * 8カテゴリの定義
 */
export declare const CATEGORIES: Category[];
/**
 * カテゴリのキーワードマッピング（タグ付け用）
 * 08_RULE_TAGGING.md セクション3.1 に準拠
 */
export declare const CATEGORY_KEYWORDS: Record<Category, string[]>;
/**
 * カテゴリが有効かどうか確認
 */
export declare function isValidCategory(category: string): category is Category;
//# sourceMappingURL=categories.d.ts.map