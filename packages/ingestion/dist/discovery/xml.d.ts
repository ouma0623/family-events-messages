/**
 * XMLスキーマ検出
 * 17_SCHEMA_DISCOVERY.md セクション3 に準拠
 */
import { SchemaDiscoveryResult } from './types';
import { Source } from '@ouma-family-event/common';
/**
 * XMLスキーマを検出
 */
export declare function discoverXmlSchema(buffer: Buffer, source: Source, sampleSize?: number): Promise<SchemaDiscoveryResult>;
//# sourceMappingURL=xml.d.ts.map