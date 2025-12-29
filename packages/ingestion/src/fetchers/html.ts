/**
 * HTMLフェッチャー
 * WalkerPlusからのHTMLデータ取得
 */

import { BaseFetcher } from './base';
import { Source } from '@ouma-family-event/common';
import axios, { AxiosResponse } from 'axios';
import { withRetry } from '../errors/retry';

/**
 * HTMLフェッチャー
 */
export class HtmlFetcher extends BaseFetcher {
  constructor(source: Source) {
    super(source);
  }

  /**
   * 一覧ページを取得
   */
  async fetch(): Promise<Buffer> {
    const response = await this.httpGet(this.source.url);
    return this.responseToBuffer(response);
  }

  /**
   * 詳細ページを取得
   */
  async fetchDetail(eventId: string): Promise<Buffer> {
    const detailUrl = `https://www.walkerplus.com/event/${eventId}/`;
    const response = await this.httpGet(detailUrl);
    return this.responseToBuffer(response);
  }

  /**
   * data.htmlページを取得
   */
  async fetchData(eventId: string): Promise<Buffer> {
    const dataUrl = `https://www.walkerplus.com/event/${eventId}/data.html`;
    const response = await this.httpGet(dataUrl);
    return this.responseToBuffer(response);
  }

  /**
   * price.htmlページを取得
   */
  async fetchPrice(eventId: string): Promise<Buffer> {
    const priceUrl = `https://www.walkerplus.com/event/${eventId}/price.html`;
    const response = await this.httpGet(priceUrl);
    return this.responseToBuffer(response);
  }

  /**
   * ページネーション付きで一覧ページを取得
   */
  async fetchListPage(pageNumber: number = 1): Promise<Buffer> {
    let url: string;
    if (pageNumber === 1) {
      url = this.source.url;
    } else {
      url = `${this.source.url}${pageNumber}.html`;
    }
    const response = await this.httpGet(url);
    return this.responseToBuffer(response);
  }

  /**
   * HTTP GETリクエストを実行（リトライ付き、レート制限対応）
   */
  protected async httpGet(url: string): Promise<AxiosResponse<Buffer>> {
    // レート制限: 1リクエスト/秒
    await this.delay(1000);

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
   * 遅延処理（レート制限用）
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


