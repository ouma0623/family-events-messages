/**
 * ベースフェッチャークラス
 */
import { AxiosResponse } from 'axios';
import { Source } from '@ouma-family-event/common';
/**
 * フェッチャーのベースクラス
 */
export declare abstract class BaseFetcher {
    protected readonly source: Source;
    protected readonly userAgent = "TokaiKidsEvents/1.0";
    constructor(source: Source);
    /**
     * データを取得
     */
    abstract fetch(): Promise<Buffer>;
    /**
     * HTTP GETリクエストを実行（リトライ付き）
     */
    protected httpGet(url: string): Promise<AxiosResponse<Buffer>>;
    /**
     * レスポンスをBufferに変換
     */
    protected responseToBuffer(response: AxiosResponse<Buffer>): Buffer;
}
//# sourceMappingURL=base.d.ts.map