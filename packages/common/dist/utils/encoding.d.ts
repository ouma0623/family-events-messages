/**
 * 文字コード判定・デコードユーティリティ
 * 16_MAPPING_RULES.md セクション5 に準拠
 */
/**
 * バイト列から文字コードを判定してデコード
 * @param buffer バイト列
 * @returns デコードされた文字列と使用した文字コード
 */
export declare function detectAndDecode(buffer: Buffer): {
    text: string;
    encoding: string;
};
/**
 * 指定されたエンコーディングでバッファをデコード
 * @param buffer バイト列
 * @param encoding 文字コード
 * @returns デコードされた文字列
 */
export declare function decodeBuffer(buffer: Buffer, encoding: string): string;
/**
 * XML宣言から文字コードを取得
 * @param xmlText XML文字列
 * @returns 文字コード（見つからない場合はnull）
 */
export declare function getEncodingFromXMLDeclaration(xmlText: string): string | null;
//# sourceMappingURL=encoding.d.ts.map