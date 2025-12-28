/**
 * HTMLパーサー
 * WalkerPlusのHTMLからイベント情報を抽出
 */
/**
 * JSON-LD構造化データをパース
 */
export declare function parseJsonLd(html: string): any[];
/**
 * 一覧ページからイベントIDを抽出
 */
export declare function extractEventIds(html: string): string[];
/**
 * 一覧ページからイベント情報を抽出（JSON-LDから）
 */
export declare function extractEventFromListPage(html: string, index: number): any;
/**
 * 詳細ページ（event.html）から基本情報を抽出
 */
export declare function extractFromDetailPage(html: string): any;
/**
 * data.htmlから詳細情報を抽出
 */
export declare function extractFromDataPage(html: string): any;
/**
 * HTMLをパースしてイベント情報を抽出
 */
export interface HtmlParseResult {
    eventIds: string[];
    events: any[];
}
/**
 * ページネーションの「次へ」リンクがあるかチェック
 */
export declare function hasNextPage(html: string): boolean;
/**
 * 現在のページ番号を取得
 */
export declare function getCurrentPageNumber(html: string): number;
/**
 * 一覧ページをパース
 */
export declare function parseHtmlList(html: string): HtmlParseResult;
//# sourceMappingURL=html.d.ts.map