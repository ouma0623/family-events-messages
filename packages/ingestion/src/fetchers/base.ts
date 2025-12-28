/**
 * ベースフェッチャークラス
 */

import axios, { AxiosResponse } from 'axios';
import { withRetry } from '../errors/retry';
import { Source } from '@ouma-family-event/common';

/**
 * フェッチャーのベースクラス
 */
export abstract class BaseFetcher {
  protected readonly source: Source;
  protected readonly userAgent = 'TokaiKidsEvents/1.0';

  constructor(source: Source) {
    this.source = source;
  }

  /**
   * データを取得
   */
  abstract fetch(): Promise<Buffer>;

  /**
   * HTTP GETリクエストを実行（リトライ付き）
   */
  protected async httpGet(url: string): Promise<AxiosResponse<Buffer>> {
    return withRetry(
      async () => {
        const response = await axios.get<Buffer>(url, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30秒
          headers: {
            'User-Agent': this.userAgent,
          },
        });
        return response;
      },
      3,
      { sourceId: this.source.sourceId }
    );
  }

  /**
   * レスポンスをBufferに変換
   */
  protected responseToBuffer(response: AxiosResponse<Buffer>): Buffer {
    return Buffer.from(response.data);
  }
}
