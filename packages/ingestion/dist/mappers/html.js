"use strict";
/**
 * HTMLマッパー
 * WalkerPlusのHTMLデータをEventNormalized形式にマッピング
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapHtmlEvent = mapHtmlEvent;
const html_1 = require("../parsers/html");
/**
 * HTMLイベントデータをマッピング
 */
function mapHtmlEvent(jsonLdData, dataPageHtml, eventId, displayOrder) {
    let dataPageData = {};
    if (dataPageHtml) {
        dataPageData = (0, html_1.extractFromDataPage)(dataPageHtml);
    }
    return {
        jsonLd: jsonLdData,
        dataPage: dataPageData,
        eventId,
        displayOrder,
    };
}
//# sourceMappingURL=html.js.map