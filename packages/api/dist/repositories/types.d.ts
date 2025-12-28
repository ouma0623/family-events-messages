/**
 * Repository型定義
 * 18_DATA_PIPELINE.md セクション3 に準拠
 */
/**
 * 検索クエリ
 */
export interface SearchQuery {
    city?: string;
    pref?: string;
    startDate?: string;
    endDate?: string;
    categories?: string[];
    ageRanges?: string[];
    indoorOutdoor?: string;
    isFree?: boolean;
    keyword?: string;
    limit?: number;
    offset?: number;
}
/**
 * ユーザー設定
 */
export interface UserPreference {
    city?: string;
    pref?: string;
    ageRanges?: string[];
    indoorPreferred?: boolean;
}
//# sourceMappingURL=types.d.ts.map