/**
 * XMLパーサー
 * 16_MAPPING_RULES.md セクション2.1 に準拠
 * 20_ERROR_HANDLING.md セクション3.3 に準拠
 */
/**
 * XML解析結果
 */
export interface XmlParseResult {
    root: any;
    events: any[];
    encoding: string;
}
/**
 * XMLを解析
 */
export declare function parseXml(buffer: Buffer, sourceId: string): Promise<XmlParseResult>;
//# sourceMappingURL=xml.d.ts.map