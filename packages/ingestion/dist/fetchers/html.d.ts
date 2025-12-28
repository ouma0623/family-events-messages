/**
 * HTMLフェッチャー
 * WalkerPlusからのHTMLデータ取得
 */
import { BaseFetcher } from './base';
import { Source } from '@ouma-family-event/common';
import { AxiosResponse } from 'axios';
/**
 * HTMLフェッチャー
 */
export declare class HtmlFetcher extends BaseFetcher {
    constructor(source: Source);
    /**
     * 一覧ページを取得
     */
    fetch(): Promise<Buffer>;
    /**
     * 詳細ページを取得
     */
    fetchDetail(eventId: string): Promise<Buffer>;
    /**
     * data.htmlページを取得
     */
    fetchData(eventId: string): Promise<Buffer>;
    /**
     * ページネーション付きで一覧ページを取得
     */
    fetchListPage(pageNumber?: number): Promise<Buffer>;
    /**
     * HTTP GETリクエストを実行（リトライ付き、レート制限対応）
     */
    protected httpGet(url: string): Promise<AxiosResponse<Buffer>>;
    /**
     * 遅延処理（レート制限用）
     */
    private delay;
}
//# sourceMappingURL=html.d.ts.map