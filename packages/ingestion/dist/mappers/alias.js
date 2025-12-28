"use strict";
/**
 * CSV alias表
 * 16_MAPPING_RULES.md セクション1.2 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCsvColumn = mapCsvColumn;
exports.mapCsvRow = mapCsvRow;
/**
 * alias表の定義（優先順位順）
 */
const ALIAS_MAP = {
    // title
    イベント名: 'title',
    名称: 'title',
    タイトル: 'title',
    title: 'title',
    event_name: 'title',
    eventname: 'title',
    イベントタイトル: 'title',
    イベント名称: 'title',
    行事名: 'title',
    // description
    概要: 'description',
    説明: 'description',
    内容: 'description',
    description: 'description',
    イベント概要: 'description',
    詳細: 'description',
    detail: 'description',
    詳細説明: 'description',
    イベント内容: 'description',
    // startAt
    開始日: 'startAt',
    開始: 'startAt',
    start_date: 'startAt',
    開始日時: 'startAt',
    開催開始: 'startAt',
    カレンダー掲載開始日時: 'startAt',
    startdate: 'startAt',
    開始年月日: 'startAt',
    開催日開始: 'startAt',
    開始年月日時: 'startAt',
    予定月日: 'startAt',
    // endAt
    終了日: 'endAt',
    終了: 'endAt',
    end_date: 'endAt',
    終了日時: 'endAt',
    開催終了: 'endAt',
    カレンダー掲載終了日時: 'endAt',
    enddate: 'endAt',
    終了年月日: 'endAt',
    開催日終了: 'endAt',
    期間終了: 'endAt',
    終了年月日時: 'endAt',
    // timeText
    開催時間: 'timeText',
    時間: 'timeText',
    time: 'timeText',
    イベント開催時間: 'timeText',
    開催時刻: 'timeText',
    時間帯: 'timeText',
    開場時間: 'timeText',
    開演時間: 'timeText',
    時間開始: 'timeText',
    時間終了: 'timeText',
    // venueName
    会場: 'venueName',
    場所: 'venueName',
    開催場所: 'venueName',
    venue: 'venueName',
    イベント開催場所: 'venueName',
    会場名: 'venueName',
    開催地: 'venueName',
    location: 'venueName',
    会場名称: 'venueName',
    会場名正式: 'venueName',
    // venueAddress
    住所: 'venueAddress',
    所在地: 'venueAddress',
    address: 'venueAddress',
    会場住所: 'venueAddress',
    開催地住所: 'venueAddress',
    所在地住所: 'venueAddress',
    会場所在地: 'venueAddress',
    // venueCity
    市区町村: 'venueCity',
    市: 'venueCity',
    行政区: 'venueCity',
    venue_city: 'venueCity',
    市町村: 'venueCity',
    自治体: 'venueCity',
    市区町村名: 'venueCity',
    市名: 'venueCity',
    // venuePref
    都道府県: 'venuePref',
    県: 'venuePref',
    pref: 'venuePref',
    都道府県名: 'venuePref',
    prefecture: 'venuePref',
    県名: 'venuePref',
    // url
    url: 'url',
    リンク: 'url',
    詳細url: 'url',
    web: 'url',
    詳細ページ: 'url',
    詳細リンク: 'url',
    イベントurl: 'url',
    関連url: 'url',
    ホームページ: 'url',
    コンテンツurl: 'url',
    コンテンツURL: 'url',
    公開url: 'url',
    公開URL: 'url',
    // priceText
    料金: 'priceText',
    参加費: 'priceText',
    費用: 'priceText',
    入場料: 'priceText',
    参加費用: 'priceText',
    価格: 'priceText',
    price: 'priceText',
    fee: 'priceText',
    料金詳細: 'priceText',
    // isFree
    無料: 'isFree',
    無料有料: 'isFree',
    料金区分: 'isFree',
    有料無料: 'isFree',
    入場料区分: 'isFree',
    // targetAges
    対象: 'targetAges',
    対象年齢: 'targetAges',
    年齢: 'targetAges',
    対象者: 'targetAges',
    対象年齢層: 'targetAges',
    年齢層: 'targetAges',
    対象年齢帯: 'targetAges',
    対象年齢開始: 'targetAges',
    対象年齢終了: 'targetAges',
    // categories
    カテゴリ: 'categories',
    分類: 'categories',
    ジャンル: 'categories',
    種別: 'categories',
    イベント種別: 'categories',
    category: 'categories',
    type: 'categories',
    イベント分類: 'categories',
    分類名: 'categories',
    // contactName
    問い合わせ: 'contactName',
    連絡先: 'contactName',
    担当: 'contactName',
    所属情報: 'contactName',
    主催: 'contactName',
    主催者: 'contactName',
    主催団体: 'contactName',
    問い合わせ先: 'contactName',
    連絡先名称: 'contactName',
    主催者名: 'contactName',
    // contactTel
    電話: 'contactTel',
    tel: 'contactTel',
    電話番号: 'contactTel',
    連絡先電話: 'contactTel',
    問い合わせ電話: 'contactTel',
    // contactEmail
    メール: 'contactEmail',
    email: 'contactEmail',
    メールアドレス: 'contactEmail',
    連絡先メール: 'contactEmail',
    問い合わせメール: 'contactEmail',
    // applyStartAt
    申込開始: 'applyStartAt',
    申し込み期間開始: 'applyStartAt',
    申込期間開始: 'applyStartAt',
    応募開始: 'applyStartAt',
    予約開始: 'applyStartAt',
    受付開始: 'applyStartAt',
    // applyEndAt
    申込終了: 'applyEndAt',
    申し込み期間終了: 'applyEndAt',
    申込期間終了: 'applyEndAt',
    応募終了: 'applyEndAt',
    予約終了: 'applyEndAt',
    受付終了: 'applyEndAt',
    // imageUrls
    画像: 'imageUrls',
    画像url: 'imageUrls',
    image: 'imageUrls',
    imageurl: 'imageUrls',
    画像リンク: 'imageUrls',
    写真: 'imageUrls',
    写真url: 'imageUrls',
    画像1: 'imageUrls',
    画像2: 'imageUrls',
    // sourceEventId
    イベントid: 'sourceEventId',
    id: 'sourceEventId',
    event_id: 'sourceEventId',
    eventid: 'sourceEventId',
    イベント番号: 'sourceEventId',
    イベントno: 'sourceEventId',
    no: 'sourceEventId',
};
/**
 * 列名を正規化（全角/半角統一、空白除去、大文字小文字統一）
 */
function normalizeColumnName(columnName) {
    // 全角英数字を半角に変換
    let normalized = columnName.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    });
    // 空白を除去
    normalized = normalized.replace(/\s+/g, '');
    // 括弧を除去
    normalized = normalized.replace(/[（）()]/g, '');
    // 大文字小文字を統一（小文字に）
    normalized = normalized.toLowerCase();
    return normalized;
}
/**
 * CSV列名をEventNormalizedフィールドにマッピング
 */
function mapCsvColumn(columnName) {
    const normalized = normalizeColumnName(columnName);
    // 完全一致を優先
    if (ALIAS_MAP[normalized]) {
        return ALIAS_MAP[normalized];
    }
    // 部分一致を試す（alias表のキーに含まれるか）
    for (const [alias, field] of Object.entries(ALIAS_MAP)) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
            return field;
        }
    }
    return null; // マッピングできない
}
/**
 * CSV行をマッピング
 */
function mapCsvRow(row) {
    const mapped = {};
    const raw = {};
    for (const [columnName, value] of Object.entries(row)) {
        const field = mapCsvColumn(columnName);
        if (field) {
            // マッピング可能な列
            if (mapped[field]) {
                // 既にマッピングされている場合は配列にする
                if (!Array.isArray(mapped[field])) {
                    mapped[field] = [mapped[field]];
                }
                mapped[field].push(value);
            }
            else {
                mapped[field] = value;
            }
        }
        else {
            // マッピングできない列はrawに保持
            raw[columnName] = value;
        }
    }
    return { mapped, raw };
}
//# sourceMappingURL=alias.js.map