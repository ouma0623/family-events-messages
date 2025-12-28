/**
 * スキーマ検出結果の型定義
 * 17_SCHEMA_DISCOVERY.md セクション2 に準拠
 */
export interface SchemaDiscoveryResult {
    sourceId: string;
    detectedFormat: 'csv' | 'xml';
    detectedEncoding: string;
    columns?: string[];
    xpaths?: string[];
    sampleRows?: any[];
    datePatterns?: string[];
    detectedAt: string;
}
export interface SchemaChange {
    sourceId: string;
    date: string;
    added?: string[];
    removed?: string[];
    changed?: Array<{
        old: string;
        new: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map