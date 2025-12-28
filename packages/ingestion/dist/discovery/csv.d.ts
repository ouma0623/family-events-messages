/**
 * CSVスキーマ検出
 * 17_SCHEMA_DISCOVERY.md セクション3 に準拠
 */
import { SchemaDiscoveryResult } from './types';
import { Source } from '@ouma-family-event/common';
/**
 * CSVスキーマを検出
 */
export declare function discoverCsvSchema(buffer: Buffer, source: Source, sampleSize?: number): SchemaDiscoveryResult;
//# sourceMappingURL=csv.d.ts.map