/**
 * データソース定義型
 * 14_SOURCES_AICHI.md に完全準拠
 */

export type SourceId = 'S8_WALKERPLUS';

export interface Source {
  /** ソースID */
  sourceId: SourceId;
  /** ソース名（例: "愛知県（県公式）イベントオープンデータ"） */
  name: string;
  /** 取得URL */
  url: string;
  /** データ形式 */
  format: 'csv' | 'xml' | 'html';
  /** 想定文字コード（実装で検知） */
  encoding?: 'utf-8' | 'utf-8-sig' | 'shift-jis' | 'cp932';
  /** DKANソースかどうか */
  isDkan?: boolean;
  /** DKANメタデータURL（DKANの場合） */
  dkanMetadataUrl?: string;
  /** DKANダウンロードURL（DKANの場合） */
  dkanDownloadUrl?: string;
}
