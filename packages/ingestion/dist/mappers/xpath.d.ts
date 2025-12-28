/**
 * XML XPath候補
 * 16_MAPPING_RULES.md セクション2.2 に準拠
 */
/**
 * XML要素から値を抽出（XPath候補を順に試行）
 */
export declare function extractXmlValue(event: any, field: string): string | string[] | null;
/**
 * XMLイベント要素をマッピング
 */
export declare function mapXmlEvent(event: any): {
    mapped: Record<string, any>;
    raw: any;
};
//# sourceMappingURL=xpath.d.ts.map