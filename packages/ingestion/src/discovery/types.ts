/**
 * スキーマ検出結果の型定義
 * 17_SCHEMA_DISCOVERY.md セクション2 に準拠
 */

export interface SchemaDiscoveryResult {
  sourceId: string;
  detectedFormat: 'csv' | 'xml';
  detectedEncoding: string;
  columns?: string[]; // CSVの場合
  xpaths?: string[]; // XMLの場合
  sampleRows?: any[]; // 先頭N件の生データ要約
  datePatterns?: string[]; // 検出した日付フォーマット候補
  detectedAt: string; // ISO8601形式
}

export interface SchemaChange {
  sourceId: string;
  date: string; // yyyymmdd
  added?: string[];
  removed?: string[];
  changed?: Array<{ old: string; new: string }>;
}
