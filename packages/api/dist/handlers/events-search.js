"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const dynamodb_1 = require("../repositories/dynamodb");
async function handler(event) {
    try {
        const repository = new dynamodb_1.DynamoDBEventRepository();
        // クエリパラメータを取得（複数のパラメータ名に対応）
        const params = event.queryStringParameters || {};
        const multiValueParams = event.multiValueQueryStringParameters || {};
        // パラメータ名のマッピング（API仕様に合わせて複数の名前をサポート）
        const city = params.city || params.cities || (multiValueParams.cities && multiValueParams.cities[0]);
        const pref = params.pref || params.prefectures || (multiValueParams.prefectures && multiValueParams.prefectures[0]);
        const categories = params.categories?.split(',') ||
            (multiValueParams.categories && multiValueParams.categories.flatMap(c => c.split(',')));
        const ageRanges = params.ageRanges?.split(',') ||
            (multiValueParams.ageRanges && multiValueParams.ageRanges.flatMap(a => a.split(',')));
        // URLエンコーディングされたパラメータをデコード（エラー処理付き）
        let decodedCity;
        if (city) {
            try {
                decodedCity = decodeURIComponent(city);
            }
            catch (e) {
                // デコードに失敗した場合は元の値をそのまま使用
                decodedCity = city;
            }
        }
        let decodedPref;
        if (pref) {
            try {
                decodedPref = decodeURIComponent(pref);
            }
            catch (e) {
                decodedPref = pref;
            }
        }
        let decodedKeyword;
        if (params.keyword) {
            try {
                decodedKeyword = decodeURIComponent(params.keyword);
            }
            catch (e) {
                decodedKeyword = params.keyword;
            }
        }
        // indoor/freeOnlyパラメータの処理
        const indoorOutdoor = params.indoor;
        const isFree = params.freeOnly === 'true' ? true : params.freeOnly === 'false' ? false : undefined;
        // 日付形式を変換（YYYY-MM-DD → YYYY-MM-DDTHH:mm:ss+09:00）
        let startDate;
        let endDate;
        if (params.from) {
            // YYYY-MM-DD形式の場合は、その日の00:00:00+09:00に変換
            startDate = params.from.includes('T') ? params.from : `${params.from}T00:00:00+09:00`;
        }
        if (params.to) {
            // YYYY-MM-DD形式の場合は、その日の23:59:59+09:00に変換
            endDate = params.to.includes('T') ? params.to : `${params.to}T23:59:59+09:00`;
        }
        const query = {
            city: decodedCity,
            pref: decodedPref,
            startDate,
            endDate,
            categories: categories && categories.length > 0 ? categories : undefined,
            ageRanges: ageRanges && ageRanges.length > 0 ? ageRanges : undefined,
            keyword: decodedKeyword,
            indoorOutdoor: indoorOutdoor,
            isFree: isFree,
            limit: params.limit
                ? parseInt(params.limit, 10)
                : 30, // デフォルト30件
            offset: params.offset
                ? parseInt(params.offset, 10)
                : undefined,
        };
        console.log('[events-search] Query params:', JSON.stringify({
            from: params.from,
            to: params.to,
            startDate,
            endDate,
            pref: decodedPref,
            city: decodedCity,
        }));
        const results = await repository.search(query);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                items: results,
                total: results.length,
            }),
        };
    }
    catch (error) {
        console.error('events-search error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
}
//# sourceMappingURL=events-search.js.map