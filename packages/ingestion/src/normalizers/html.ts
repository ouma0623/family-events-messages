/**
 * HTML正規化
 * WalkerPlusのHTMLデータをEventNormalized形式に正規化
 */

import { BaseNormalizer } from './base';
import { EventNormalized, Source } from '@ouma-family-event/common';
import { HtmlEventData } from '../mappers/html';
import { classifyCategories } from '@ouma-family-event/common';

/**
 * HTML正規化クラス
 */
export class HtmlNormalizer extends BaseNormalizer {
  /**
   * HTMLイベントデータをEventNormalizedに変換
   */
  normalize(mapped: HtmlEventData, raw: any): EventNormalized {
    const jsonLdData = mapped.jsonLd;
    const dataPageData = mapped.dataPage || {};
    const eventId = mapped.eventId;
    const displayOrder = mapped.displayOrder;

    // 日付をISO8601形式（JST）に変換
    const startAt = this.normalizeDate(jsonLdData.startDate);
    const endAt = this.normalizeDate(jsonLdData.endDate);

    // イベント期間（日数）を計算
    const durationDays = this.calculateDurationDays(startAt, endAt);

    // 住所から市名を抽出
    const address = jsonLdData.location?.address?.streetAddress || dataPageData.venueAddress || '';
    const city = this.extractCity(address);
    const pref = jsonLdData.location?.address?.addressRegion || '愛知県';

    // イベントIDを生成
    const normalizedEventId = `S8_WALKERPLUS:${eventId}`;

    // 料金情報を設定
    const pricePageData = mapped.pricePage;
    const priceText = pricePageData?.priceText;
    const isFree = pricePageData?.isFree;

    // カテゴリ分類を適用
    const categories = dataPageData.categories || [];
    const categoryClassifications = classifyCategories(categories);

    // EventNormalized形式に変換
    const event: EventNormalized = {
      eventId: normalizedEventId,
      sourceId: 'S8_WALKERPLUS',
      sourceEventId: eventId,
      title: jsonLdData.name || '',
      description: jsonLdData.description || '',
      startAt,
      endAt,
      venueCity: city,
      venuePref: pref,
      venueName: jsonLdData.location?.name || dataPageData.venueName || '',
      venueAddress: address,
      url: jsonLdData.url || `https://www.walkerplus.com/event/${eventId}/`,
      categories: dataPageData.categories || [],
      timeText: dataPageData.timeText || '',
      accessText: dataPageData.accessText || '',
      parkingText: dataPageData.parkingText || '',
      contactTel: jsonLdData.telephone || dataPageData.contactTel || '',
      imageUrls: jsonLdData.image ? [jsonLdData.image] : [],
      displayOrder,
      durationDays,
      // 料金情報
      priceText: priceText,
      isFree: isFree !== undefined ? isFree : null,
      // デフォルト値
      recommendScore: 50,
      recommendReasons: [],
      dataConfidence: 0.5,
      raw: {
        jsonLd: jsonLdData,
        dataPage: dataPageData,
        pricePage: pricePageData,
        categoryClassifications: categoryClassifications,
      },
      ingestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return event;
  }

  /**
   * 日付をISO8601形式（JST）に変換
   */
  private normalizeDate(dateStr: string): string {
    // JSON-LDの日付形式（YYYY-MM-DD）をISO8601形式に変換
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${dateStr}T00:00:00+09:00`;
    }
    return dateStr || '';
  }

  /**
   * 住所から市名を抽出
   */
  private extractCity(address: string): string {
    if (!address) return 'unknown';
    
    // 「名古屋市中村区」-> 「名古屋市」
    const match = address.match(/(.+?[市区町村])/);
    if (match && match[1]) {
      return match[1];
    }
    
    return 'unknown';
  }

  /**
   * イベント期間（日数）を計算
   */
  private calculateDurationDays(startAt: string, endAt: string): number {
    if (!startAt || !endAt) return 0;
    
    const start = new Date(startAt);
    const end = new Date(endAt);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}


