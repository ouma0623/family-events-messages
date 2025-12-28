"use strict";
/**
 * HTMLパーサー
 * WalkerPlusのHTMLからイベント情報を抽出
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonLd = parseJsonLd;
exports.extractEventIds = extractEventIds;
exports.extractEventFromListPage = extractEventFromListPage;
exports.extractFromDetailPage = extractFromDetailPage;
exports.extractFromDataPage = extractFromDataPage;
exports.hasNextPage = hasNextPage;
exports.getCurrentPageNumber = getCurrentPageNumber;
exports.parseHtmlList = parseHtmlList;
const cheerio = __importStar(require("cheerio"));
const handler_1 = require("../errors/handler");
/**
 * JSON-LD構造化データをパース
 */
function parseJsonLd(html) {
    const $ = cheerio.load(html);
    const jsonLdScripts = $('script[type="application/ld+json"]');
    const events = [];
    jsonLdScripts.each((_, el) => {
        try {
            const content = $(el).html();
            if (content) {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    events.push(...parsed);
                }
                else {
                    events.push(parsed);
                }
            }
        }
        catch (e) {
            handler_1.errorHandler.warn('Failed to parse JSON-LD', { error: String(e) });
        }
    });
    return events;
}
/**
 * 一覧ページからイベントIDを抽出
 */
function extractEventIds(html) {
    const $ = cheerio.load(html);
    const eventIds = [];
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
function extractEventFromListPage(html, index) {
    const jsonLdEvents = parseJsonLd(html);
    if (index < jsonLdEvents.length) {
        return jsonLdEvents[index];
    }
    return null;
}
/**
 * 詳細ページ（event.html）から基本情報を抽出
 */
function extractFromDetailPage(html) {
    const jsonLdEvents = parseJsonLd(html);
    if (jsonLdEvents.length > 0) {
        return jsonLdEvents[0];
    }
    return null;
}
/**
 * data.htmlから詳細情報を抽出
 */
function extractFromDataPage(html) {
    const $ = cheerio.load(html);
    const data = {};
    // テーブルから情報を抽出
    $('tr.m-infotable__row').each((_, row) => {
        const th = $(row).find('th.m-infotable__th').text().trim();
        const td = $(row).find('td.m-infotable__td').text().trim();
        if (th && td) {
            if (th.includes('開催場所')) {
                data.venueName = td.replace(/\[地図\]/g, '').trim();
            }
            else if (th.includes('開催日')) {
                data.eventPeriod = td;
            }
            else if (th.includes('開催時間')) {
                data.timeText = td;
            }
            else if (th.includes('予約')) {
                data.reservationText = td;
            }
            else if (th.includes('電話番号')) {
                data.contactTel = td.replace(/tel:/g, '').trim();
            }
            else if (th.includes('住所')) {
                data.venueAddress = td;
            }
            else if (th.includes('交通アクセス')) {
                data.accessText = td;
            }
            else if (th.includes('駐車場')) {
                data.parkingText = td;
            }
            else if (th.includes('カテゴリ')) {
                const categories = [];
                $(row).find('td.m-infotable__td a.m-detailmain-table__taglink').each((_, link) => {
                    const category = $(link).text().trim();
                    if (category) {
                        categories.push(category);
                    }
                });
                data.categories = categories;
            }
            else if (th.includes('公式サイト')) {
                const link = $(row).find('td.m-infotable__td a').attr('href');
                if (link) {
                    data.officialUrl = link;
                }
            }
            else if (th.includes('駅近')) {
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
        }
        else if (dt.includes('おすすめビューポイント')) {
            data.viewPoint = dd;
        }
    });
    return data;
}
/**
 * ページネーションの「次へ」リンクがあるかチェック
 */
function hasNextPage(html) {
    const $ = cheerio.load(html);
    const nextLink = $('a.m-pager__next[rel="next"]');
    return nextLink.length > 0;
}
/**
 * 現在のページ番号を取得
 */
function getCurrentPageNumber(html) {
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
function parseHtmlList(html) {
    const eventIds = extractEventIds(html);
    const jsonLdEvents = parseJsonLd(html);
    return {
        eventIds,
        events: jsonLdEvents,
    };
}
//# sourceMappingURL=html.js.map