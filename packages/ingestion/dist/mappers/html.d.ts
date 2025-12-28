/**
 * HTMLマッパー
 * WalkerPlusのHTMLデータをEventNormalized形式にマッピング
 */
/**
 * HTMLイベントデータをマッピング
 */
export interface HtmlEventData {
    jsonLd: any;
    dataPage?: any;
    eventId: string;
    displayOrder: number;
}
/**
 * HTMLイベントデータをマッピング
 */
export declare function mapHtmlEvent(jsonLdData: any, dataPageHtml: string | null, eventId: string, displayOrder: number): HtmlEventData;
//# sourceMappingURL=html.d.ts.map