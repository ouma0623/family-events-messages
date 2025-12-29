/**
 * HTMLマッパー
 * WalkerPlusのHTMLデータをEventNormalized形式にマッピング
 */

import { extractFromDataPage, extractFromDetailPage, extractFromPricePage } from '../parsers/html';

/**
 * HTMLイベントデータをマッピング
 */
export interface HtmlEventData {
  jsonLd: any;
  dataPage?: any;
  pricePage?: { priceText?: string; isFree?: boolean };
  eventId: string;
  displayOrder: number;
}

/**
 * HTMLイベントデータをマッピング
 */
export function mapHtmlEvent(
  jsonLdData: any,
  dataPageHtml: string | null,
  pricePageHtml: string | null,
  eventId: string,
  displayOrder: number
): HtmlEventData {
  let dataPageData: any = {};
  
  if (dataPageHtml) {
    dataPageData = extractFromDataPage(dataPageHtml);
  }

  let pricePageData: { priceText?: string; isFree?: boolean } | undefined;
  if (pricePageHtml) {
    pricePageData = extractFromPricePage(pricePageHtml);
  }

  return {
    jsonLd: jsonLdData,
    dataPage: dataPageData,
    pricePage: pricePageData,
    eventId,
    displayOrder,
  };
}


