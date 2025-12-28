/**
 * 正規化後のイベントデータ型
 * 15_NORMALIZED_SCHEMA.md に完全準拠
 */
export interface EventNormalizedRequired {
    /** 正規化後の一意ID（sourceId + ":" + sourceEventId の原則。sourceEventIdが無い場合はハッシュ） */
    eventId: string;
    /** 14_SOURCES_AICHI.md のソースID（例：S1_AICHI_PREF） */
    sourceId: string;
    /** イベント名（最大500文字） */
    title: string;
    /** ISO8601 (JST) 例: "2026-01-24T00:00:00+09:00"（日付のみなら00:00固定） */
    startAt: string;
    /** ISO8601 (JST) 例: "2026-01-26T23:59:59+09:00"（終日なら23:59:59固定） */
    endAt: string;
    /** 市（例: "名古屋市"、取得できない場合は "unknown"） */
    venueCity: string;
    /** 都道府県（初期は "愛知県" 固定） */
    venuePref: string;
    /** 原典URL（イベント詳細ページ or 公開データの該当リンク） */
    url: string;
    /** 8カテゴリの配列（空配列可） */
    categories: string[];
    /** 0〜100 */
    recommendScore: number;
    /** 推薦理由（空配列可） */
    recommendReasons: string[];
    /** 0〜1（必須情報が揃っているほど上げる） */
    dataConfidence: number;
    /** 元データ（必要最小限） */
    raw: object;
    /** 取得日時（ISO8601） */
    ingestedAt: string;
    /** 正規化更新日時（ISO8601） */
    updatedAt: string;
}
export interface EventNormalizedOptional {
    /** ソース側イベントID（あれば） */
    sourceEventId?: string;
    /** 概要（長文可、最大5000文字） */
    description?: string;
    /** 120〜200文字程度の要約 */
    summary?: string;
    /** イベントタイプ */
    eventType?: EventType;
    /** フリーテキストタグ */
    tags?: string[];
    /** 屋内/屋外 */
    indoorOutdoor?: IndoorOutdoor;
    /** 無料ならtrue（分からない場合はnull） */
    isFree?: boolean | null;
    /** 料金表現（例：大人500円 / 小学生200円） */
    priceText?: string;
    /** 対象年齢（例: ["0-2", "3-5"]） */
    targetAges?: string[];
    /** 開催時間の原文（例：10:00〜16:00） */
    timeText?: string;
    /** 複数回開催の内訳 */
    occurrences?: Occurrence[];
    /** 会場名 */
    venueName?: string;
    /** 住所（原文） */
    venueAddress?: string;
    /** 緯度 */
    lat?: number | null;
    /** 経度 */
    lng?: number | null;
    /** アクセス情報 */
    accessText?: string;
    /** 駐車場情報 */
    parkingText?: string;
    /** 画像URL */
    imageUrls?: string[];
    /** 申込開始（ISO8601） */
    applyStartAt?: string | null;
    /** 申込終了（ISO8601） */
    applyEndAt?: string | null;
    /** 問い合わせ先（組織名） */
    contactName?: string;
    /** 電話 */
    contactTel?: string;
    /** メール */
    contactEmail?: string;
    /** WalkerPlusでの表示順序（Phase8） */
    displayOrder?: number;
    /** イベント期間（日数）（Phase8） */
    durationDays?: number;
}
export type EventNormalized = EventNormalizedRequired & EventNormalizedOptional;
export type EventType = 'festival' | 'exhibition' | 'workshop' | 'lecture' | 'sports' | 'other';
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'both' | 'unknown';
export interface Occurrence {
    /** ISO8601 (JST) */
    startAt: string;
    /** ISO8601 (JST) */
    endAt: string;
    /** 開催時間の原文 */
    timeText?: string;
}
//# sourceMappingURL=EventNormalized.d.ts.map