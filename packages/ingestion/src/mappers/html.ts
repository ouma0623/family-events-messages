/**
 * HTMLマッパー
 * WalkerPlusのHTMLデータをEventNormalized形式にマッピング
 */

import { extractFromDataPage, extractFromDetailPage } from '../parsers/html';

/**
 * HTMLイベントデータをマッピング
 */
export interface HtmlEventData {
  jsonLd: any;
  dataPage?: any;
  eventId: string;
  displayOrder: number;
}

/**
 * HTMLイベントデータをマッピング
 */
export function mapHtmlEvent(
  jsonLdData: any,
  dataPageHtml: string | null,
  eventId: string,
  displayOrder: number
): HtmlEventData {
  let dataPageData: any = {};
  
  if (dataPageHtml) {
    dataPageData = extractFromDataPage(dataPageHtml);
  }

  return {
    jsonLd: jsonLdData,
    dataPage: dataPageData,
    eventId,
    displayOrder,
  };
}


