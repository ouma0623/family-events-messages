/**
 * HTMLパーサー
 * WalkerPlusのHTMLからイベント情報を抽出
 */

import * as cheerio from 'cheerio';
import { errorHandler } from '../errors/handler';

/**
 * JSON-LD構造化データをパース
 */
export function parseJsonLd(html: string): any[] {
  const $ = cheerio.load(html);
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const events: any[] = [];

  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          events.push(...parsed);
        } else {
          events.push(parsed);
        }
      }
    } catch (e) {
      errorHandler.warn('Failed to parse JSON-LD', { error: String(e) });
    }
  });

  return events;
}

/**
 * 一覧ページからイベントIDを抽出
 */
export function extractEventIds(html: string): string[] {
  const $ = cheerio.load(html);
  const eventIds: string[] = [];
  const links = $('a[href^="/event/ar0623e"], a[href^="/event/ar0600e"]');

  links.each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      // /event/ar0623e205604/ -> ar0623e205604
      const match = href.match(/\/event\/(ar\d+e\d+)\//);
      if (match && match[1]) {
        const eventId = match[1];
        if (!eventIds.includes(eventId)) {
          eventIds.push(eventId);
        }
      }
    }
  });

  return eventIds;
}

/**
 * 一覧ページからイベント情報を抽出（JSON-LDから）
 */
export function extractEventFromListPage(html: string, index: number): any {
  const jsonLdEvents = parseJsonLd(html);
  if (index < jsonLdEvents.length) {
    return jsonLdEvents[index];
  }
  return null;
}

/**
 * 詳細ページ（event.html）から基本情報を抽出
 */
export function extractFromDetailPage(html: string): any {
  const jsonLdEvents = parseJsonLd(html);
  if (jsonLdEvents.length > 0) {
    return jsonLdEvents[0];
  }
  return null;
}

/**
 * data.htmlから詳細情報を抽出
 */
export function extractFromDataPage(html: string): any {
  const $ = cheerio.load(html);
  const data: any = {};

  // テーブルから情報を抽出
  $('tr.m-infotable__row').each((_, row) => {
    const th = $(row).find('th.m-infotable__th').text().trim();
    const td = $(row).find('td.m-infotable__td').text().trim();

    if (th && td) {
      if (th.includes('開催場所')) {
        data.venueName = td.replace(/\[地図\]/g, '').trim();
      } else if (th.includes('開催日')) {
        data.eventPeriod = td;
      } else if (th.includes('開催時間')) {
        data.timeText = td;
      } else if (th.includes('予約')) {
        data.reservationText = td;
      } else if (th.includes('電話番号')) {
        data.contactTel = td.replace(/tel:/g, '').trim();
      } else if (th.includes('住所')) {
        data.venueAddress = td;
      } else if (th.includes('交通アクセス')) {
        data.accessText = td;
      } else if (th.includes('駐車場')) {
        data.parkingText = td;
      } else if (th.includes('カテゴリ')) {
        const categories: string[] = [];
        $(row).find('td.m-infotable__td a.m-detailmain-table__taglink').each((_, link) => {
          const category = $(link).text().trim();
          if (category) {
            categories.push(category);
          }
        });
        data.categories = categories;
      } else if (th.includes('公式サイト')) {
        const link = $(row).find('td.m-infotable__td a').attr('href');
        if (link) {
          data.officialUrl = link;
        }
      } else if (th.includes('駅近')) {
        data.nearStation = td.includes('◯') || td.includes('○');
      }
    }
  });

  // イルミネーション固有情報
  $('dl.m-infotable__dl').each((_, dl) => {
    const dt = $(dl).find('dt.m-infotable__dt').text().trim();
    const dd = $(dl).find('dd.m-infotable__dd').text().trim();

    if (dt.includes('電飾数')) {
      data.illuminationCount = dd;
    } else if (dt.includes('おすすめビューポイント')) {
      data.viewPoint = dd;
    }
  });

  return data;
}

/**
 * HTMLをパースしてイベント情報を抽出
 */
export interface HtmlParseResult {
  eventIds: string[];
  events: any[];
}

/**
 * ページネーションの「次へ」リンクがあるかチェック
 */
export function hasNextPage(html: string): boolean {
  const $ = cheerio.load(html);
  const nextLink = $('a.m-pager__next[rel="next"]');
  return nextLink.length > 0;
}

/**
 * 現在のページ番号を取得
 */
export function getCurrentPageNumber(html: string): number {
  const $ = cheerio.load(html);
  const pageText = $('p.m-pager__txt').text();
  // 例: "1/ 30（全298件中1〜10件）" -> 1
  const match = pageText.match(/(\d+)\s*\/\s*\d+/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 1;
}

/**
 * 一覧ページをパース
 */
export function parseHtmlList(html: string): HtmlParseResult {
  const eventIds = extractEventIds(html);
  const jsonLdEvents = parseJsonLd(html);

  return {
    eventIds,
    events: jsonLdEvents,
  };
}

/**
 * price.htmlから料金情報を抽出
 */
export function extractFromPricePage(html: string): { priceText?: string; isFree?: boolean } {
  const $ = cheerio.load(html);
  const result: { priceText?: string; isFree?: boolean } = {};

  // テーブルから料金情報を抽出
  $('tr.m-infotable__row').each((_, row) => {
    const th = $(row).find('th.m-infotable__th').text().trim();
    const td = $(row).find('td.m-infotable__td').text().trim();

    if (th && td && th.includes('料金')) {
      // 料金テキストを取得
      result.priceText = td;

      // テキストから数値を抽出（正規表現）
      const priceNumbers = td.match(/[\d,]+/g);
      
      // 無料の判定：数値が含まれない、または「無料」「入場無料」などの文字列が含まれる
      const freeKeywords = ['無料', '入場無料', '参加費無料', '観覧無料', '見学無料'];
      const hasFreeKeyword = freeKeywords.some(keyword => td.includes(keyword));
      
      if (hasFreeKeyword || !priceNumbers || priceNumbers.length === 0) {
        result.isFree = true;
      } else {
        result.isFree = false;
        // 数値を抽出して料金テキストに含める（既に含まれている場合はそのまま）
        // 数値が複数ある場合は全て含める
        const extractedPrices = priceNumbers.join(' / ');
        if (extractedPrices) {
          result.priceText = td; // 元のテキストを保持
        }
      }
      return false; // ループを終了
    }
  });

  return result;
}

