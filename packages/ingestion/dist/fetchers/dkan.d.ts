/**
 * DKAN取得フェッチャー
 * 14_SOURCES_AICHI.md セクション1（S5, S6, S7）に準拠
 */
import { BaseFetcher } from './base';
/**
 * DKAN取得フェッチャー
 */
export declare class DkanFetcher extends BaseFetcher {
    /**
     * DKANデータを取得（フォールバック処理含む）
     */
    fetch(): Promise<Buffer>;
    /**
     * フォールバック処理: HTMLからダウンロードリンクを抽出
     */
    private fetchWithFallback;
    /**
     * HTMLからダウンロードリンクを抽出
     */
    private extractDownloadLink;
}
//# sourceMappingURL=dkan.d.ts.map