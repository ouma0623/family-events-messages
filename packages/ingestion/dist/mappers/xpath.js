"use strict";
/**
 * XML XPath候補
 * 16_MAPPING_RULES.md セクション2.2 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractXmlValue = extractXmlValue;
exports.mapXmlEvent = mapXmlEvent;
/**
 * XPath候補の定義（優先順位順）
 */
const XPATH_MAP = {
    title: [
        '//event/title/text()',
        '//item/title/text()',
        '//events/event/title/text()',
        '//title/text()',
        '//event/name/text()',
        '//event/eventtitle/text()',
        '//eventtitle/text()',
        '//rdf:RDF//item/title/text()',
        '//rdf:RDF//title/text()',
    ],
    description: [
        '//event/description/text()',
        '//event/summary/text()',
        '//event/content/text()',
        '//description/text()',
        '//event/detail/text()',
    ],
    startAt: [
        '//event/startDate/text()',
        '//event/start/text()',
        '//event/start_date/text()',
        '//startDate/text()',
        '//event/startDateTime/text()',
        '//event/開始日/text()',
        '//event/opendays/date/text()',
        '//event/kikandays/span/text()',
        '//opendays/date/text()',
        '//kikandays/span/text()',
        '//item/dc:date/text()',
        '//item/pubDate/text()',
        '//dc:date/text()',
        '//pubDate/text()',
    ],
    endAt: [
        '//event/endDate/text()',
        '//event/end/text()',
        '//event/end_date/text()',
        '//endDate/text()',
        '//event/endDateTime/text()',
        '//event/終了日/text()',
        '//event/kikandays/span/text()',
        '//kikandays/span/text()',
    ],
    timeText: [
        '//event/time/text()',
        '//event/timeText/text()',
        '//event/時間/text()',
        '//event/開催時間/text()',
        '//time/text()',
    ],
    venueName: [
        '//event/place/text()',
        '//event/location/text()',
        '//event/venue/text()',
        '//place/text()',
        '//event/会場/text()',
        '//event/開催場所/text()',
    ],
    venueAddress: [
        '//event/address/text()',
        '//event/address_text/text()',
        '//address/text()',
        '//event/住所/text()',
        '//event/所在地/text()',
    ],
    venueCity: [
        '//event/city/text()',
        '//event/venue_city/text()',
        '//event/市/text()',
        '//city/text()',
        '//event/市区町村/text()',
    ],
    venuePref: [
        '//event/prefecture/text()',
        '//event/pref/text()',
        '//event/都道府県/text()',
        '//prefecture/text()',
    ],
    url: [
        '//event/url/text()',
        '//event/link/text()',
        '//event/href/text()',
        '//url/text()',
        '//event/URL/text()',
        '//event/詳細URL/text()',
        '//item/link/text()',
        '//item/@rdf:about',
        '//rdf:RDF//item/link/text()',
        '//rdf:RDF//item/@rdf:about',
        '//item/link/text()',
        '//item/@rdf:about',
    ],
    priceText: [
        '//event/price/text()',
        '//event/fee/text()',
        '//event/料金/text()',
        '//event/参加費/text()',
        '//price/text()',
    ],
    isFree: [
        '//event/free/text()',
        '//event/isFree/text()',
        '//event/無料/text()',
        '//event/料金区分/text()',
    ],
    targetAges: [
        '//event/target/text()',
        '//event/targetAges/text()',
        '//event/対象年齢/text()',
        '//event/対象者/text()',
    ],
    categories: [
        '//event/category/text()',
        '//event/type/text()',
        '//event/分類/text()',
        '//category/text()',
        '//event/ジャンル/text()',
    ],
    contactName: [
        '//event/contact/text()',
        '//event/organizer/text()',
        '//event/主催/text()',
        '//event/問い合わせ/text()',
        '//event/連絡先/text()',
    ],
    contactTel: [
        '//event/tel/text()',
        '//event/phone/text()',
        '//event/電話/text()',
        '//event/TEL/text()',
    ],
    contactEmail: [
        '//event/email/text()',
        '//event/mail/text()',
        '//event/メール/text()',
        '//event/Email/text()',
    ],
    applyStartAt: [
        '//event/applyStart/text()',
        '//event/申込開始/text()',
        '//event/応募開始/text()',
        '//event/予約開始/text()',
    ],
    applyEndAt: [
        '//event/applyEnd/text()',
        '//event/申込終了/text()',
        '//event/応募終了/text()',
        '//event/予約終了/text()',
    ],
    imageUrls: [
        '//event/image/text()',
        '//event/imageUrl/text()',
        '//event/画像/text()',
        '//event/画像URL/text()',
        '//event/images/image/text()',
    ],
    sourceEventId: [
        '//event/id/text()',
        '//event/eventId/text()',
        '//event/ID/text()',
        '//event/イベントID/text()',
    ],
};
/**
 * XML要素から値を抽出（XPath候補を順に試行）
 */
function extractXmlValue(event, field) {
    const xpaths = XPATH_MAP[field];
    if (!xpaths) {
        return null;
    }
    // XPathではなく、オブジェクトから直接値を取得
    // XMLは既にparseXmlでオブジェクトに変換されているため
    for (const xpath of xpaths) {
        // XPathを簡易的にパース（//event/title/text() -> event.title）
        // itemやeventなどのコンテナ要素はスキップ（既にitem要素が渡されているため）
        // @attribute形式も処理（@rdf:about -> rdf:about）
        const path = xpath
            .replace(/^\/\//, '')
            .replace(/\/text\(\)$/, '')
            .replace(/^@/, '') // @attribute形式の@を削除
            .split('/')
            .filter((p) => p && p !== 'event' && p !== 'item')
            .map((p) => p.replace(/^@/, '')); // パス内の@も削除
        // eventオブジェクトから直接値を取得
        let value = event;
        for (const key of path) {
            if (value && typeof value === 'object') {
                // オブジェクトのキーを確認（大文字小文字を区別しない、名前空間も考慮）
                let foundKey = Object.keys(value).find((k) => k.toLowerCase() === key.toLowerCase());
                // 名前空間付きのキーも検索（例: dc:date）
                if (!foundKey && key.includes(':')) {
                    const [ns, localName] = key.split(':');
                    foundKey = Object.keys(value).find((k) => {
                        const kLower = k.toLowerCase();
                        return kLower === key.toLowerCase() ||
                            kLower.endsWith(`:${localName.toLowerCase()}`) ||
                            kLower === `${ns.toLowerCase()}:${localName.toLowerCase()}` ||
                            kLower.includes(`:${localName.toLowerCase()}`);
                    });
                }
                if (foundKey) {
                    value = value[foundKey];
                }
                else {
                    value = null;
                    break;
                }
            }
            else {
                value = null;
                break;
            }
        }
        if (value !== null && value !== undefined) {
            // 配列の場合は最初の要素を返す
            if (Array.isArray(value)) {
                return value.length > 0 ? String(value[0]) : null;
            }
            // オブジェクトの場合は、その中のテキストを探す
            if (typeof value === 'object') {
                // CDATAセクションやテキストノードを探す
                if ('_' in value) {
                    return String(value._);
                }
                // 直接テキストが含まれている場合
                const textKeys = ['text', '_text', 'value', '_value'];
                for (const textKey of textKeys) {
                    if (textKey in value) {
                        return String(value[textKey]);
                    }
                }
                // オブジェクトの最初のプロパティが文字列の場合
                const firstKey = Object.keys(value)[0];
                if (firstKey && typeof value[firstKey] === 'string') {
                    return String(value[firstKey]);
                }
                return null;
            }
            return String(value);
        }
    }
    return null;
}
/**
 * XMLイベント要素をマッピング
 */
function mapXmlEvent(event) {
    const mapped = {};
    const raw = { ...event };
    // 各フィールドをマッピング
    for (const field of Object.keys(XPATH_MAP)) {
        const value = extractXmlValue(event, field);
        if (value !== null) {
            mapped[field] = value;
            // rawから削除（マッピング済み）
            delete raw[field];
        }
    }
    return { mapped, raw };
}
//# sourceMappingURL=xpath.js.map