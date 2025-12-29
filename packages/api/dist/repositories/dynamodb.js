"use strict";
/**
 * DynamoDB実装
 * フェーズ5で実装
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBEventRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
/**
 * DynamoDB実装
 */
class DynamoDBEventRepository {
    constructor() {
        const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
        this.client = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.eventsTableName = process.env.DYNAMODB_TABLE_EVENTS || '';
        this.usersTableName = process.env.DYNAMODB_TABLE_USERS || '';
        this.summariesTableName = process.env.DYNAMODB_TABLE_SUMMARIES || '';
    }
    /**
     * イベントを一括Upsert
     */
    async upsertMany(events) {
        if (events.length === 0)
            return;
        // 重複を除去（eventIdで）
        const uniqueEvents = Array.from(new Map(events.map(event => [event.eventId, event])).values());
        if (uniqueEvents.length === 0) {
            console.log('[upsertMany] 重複除去後、保存するイベントがありません');
            return;
        }
        console.log(`[upsertMany] 重複除去: ${events.length}件 → ${uniqueEvents.length}件`);
        // BatchWriteItemは25件まで
        const batches = [];
        for (let i = 0; i < uniqueEvents.length; i += 25) {
            batches.push(uniqueEvents.slice(i, i + 25));
        }
        for (const batch of batches) {
            await this.client.send(new lib_dynamodb_1.BatchWriteCommand({
                RequestItems: {
                    [this.eventsTableName]: batch.map((event) => ({
                        PutRequest: { Item: this.normalizeEvent(event) },
                    })),
                },
            }));
        }
    }
    /**
     * イベントを検索
     */
    async search(query) {
        // 市で検索（優先度: 高）
        if (query.city) {
            return this.searchByCity(query);
        }
        // 都道府県で検索
        if (query.pref) {
            return this.searchByPref(query);
        }
        // カテゴリで検索
        if (query.categories && query.categories.length > 0) {
            return this.searchByCategory(query);
        }
        // 日付範囲のみ指定されている場合、全件スキャンしてフィルタリング
        if (query.startDate || query.endDate) {
            return this.searchByDateRange(query);
        }
        // デフォルト: 最近のイベントを取得（日付範囲指定なしの場合は直近30日）
        return this.searchRecent(query);
    }
    /**
     * eventIdでイベントを取得
     */
    async getById(eventId) {
        const result = await this.client.send(new lib_dynamodb_1.GetCommand({
            TableName: this.eventsTableName,
            Key: { eventId },
        }));
        if (!result.Item) {
            return null;
        }
        return this.denormalizeEvent(result.Item);
    }
    /**
     * 週末おすすめイベントを取得
     */
    async listWeekendRecommendations(userPref, weekendOf) {
        // 週末日付範囲を計算
        // weekendOfが指定されている場合はその日付を基準に、なければ今日を基準に
        const baseDate = weekendOf ? new Date(weekendOf + 'T00:00:00+09:00') : new Date();
        const dayOfWeek = baseDate.getDay(); // 0=日曜日, 6=土曜日
        // 指定された日付が週末（土日）の場合はその週末を使用
        // それ以外の場合は次の週末を計算
        let saturday;
        let sunday;
        if (dayOfWeek === 6) {
            // 土曜日の場合はその日と翌日（日曜日）
            saturday = new Date(baseDate);
            sunday = new Date(baseDate);
            sunday.setDate(saturday.getDate() + 1);
        }
        else if (dayOfWeek === 0) {
            // 日曜日の場合は前日（土曜日）とその日
            sunday = new Date(baseDate);
            saturday = new Date(baseDate);
            saturday.setDate(sunday.getDate() - 1);
        }
        else {
            // 平日の場合は次の週末を計算
            const daysUntilSaturday = (6 - dayOfWeek) % 7 || 7;
            saturday = new Date(baseDate);
            saturday.setDate(baseDate.getDate() + daysUntilSaturday);
            sunday = new Date(saturday);
            sunday.setDate(saturday.getDate() + 1);
        }
        const startDate = saturday.toISOString().split('T')[0] + 'T00:00:00+09:00';
        const endDate = sunday.toISOString().split('T')[0] + 'T23:59:59+09:00';
        console.log(`[listWeekendRecommendations] weekendOf: ${weekendOf}, baseDate: ${baseDate.toISOString()}, saturday: ${saturday.toISOString()}, sunday: ${sunday.toISOString()}`);
        // ユーザー設定に基づいて検索
        const searchQuery = {
            city: userPref.city,
            pref: userPref.pref,
            startDate,
            endDate,
            limit: 10,
        };
        const results = await this.search(searchQuery);
        // 表示順序でソート（イベント期間が3日以内を最優先、その他はdisplayOrder順）
        const sortedResults = this.sortEventsByDisplayOrder(results);
        // recommendScoreでソート（表示順序の後）
        return sortedResults.sort((a, b) => b.recommendScore - a.recommendScore).slice(0, 10);
    }
    /**
     * 市で検索
     */
    async searchByCity(query) {
        const params = {
            TableName: this.eventsTableName,
            IndexName: 'city-date-index',
            KeyConditionExpression: 'venueCity = :city',
            ExpressionAttributeValues: {
                ':city': query.city,
            },
        };
        if (query.startDate && query.endDate) {
            params.KeyConditionExpression += ' AND startAt BETWEEN :start AND :end';
            params.ExpressionAttributeValues[':start'] = query.startDate;
            params.ExpressionAttributeValues[':end'] = query.endDate;
        }
        else if (query.startDate) {
            params.KeyConditionExpression += ' AND startAt >= :start';
            params.ExpressionAttributeValues[':start'] = query.startDate;
        }
        else if (query.endDate) {
            params.KeyConditionExpression += ' AND startAt <= :end';
            params.ExpressionAttributeValues[':end'] = query.endDate;
        }
        // フィルタリング
        const filterExpressions = [];
        if (query.categories && query.categories.length > 0) {
            filterExpressions.push('contains(categories, :category)');
            params.ExpressionAttributeValues[':category'] = query.categories[0];
        }
        if (query.indoorOutdoor) {
            filterExpressions.push('indoorOutdoor = :indoorOutdoor');
            params.ExpressionAttributeValues[':indoorOutdoor'] = query.indoorOutdoor;
        }
        if (query.isFree !== undefined) {
            filterExpressions.push('isFree = :isFree');
            params.ExpressionAttributeValues[':isFree'] = query.isFree;
        }
        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
        }
        // ページネーション
        if (query.limit) {
            params.Limit = query.limit;
        }
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        let items = (result.Items || []).map((item) => this.denormalizeEvent(item));
        // キーワード検索（クライアント側でフィルタ）
        if (query.keyword) {
            const keyword = query.keyword.toLowerCase();
            items = items.filter((item) => item.title.toLowerCase().includes(keyword) ||
                (item.description && item.description.toLowerCase().includes(keyword)) ||
                (item.venueName && item.venueName.toLowerCase().includes(keyword)));
        }
        // オフセット
        if (query.offset) {
            items = items.slice(query.offset);
        }
        // 表示順序でソート（イベント期間が3日以内を最優先、その他はdisplayOrder順）
        items = this.sortEventsByDisplayOrder(items);
        return items;
    }
    /**
     * 都道府県で検索
     */
    async searchByPref(query) {
        // 都道府県名のマッピング（英語名 -> 日本語名）
        const prefMapping = {
            aichi: '愛知県',
            mie: '三重県',
            gifu: '岐阜県',
            shizuoka: '静岡県',
        };
        // 都道府県名を正規化（英語名 -> 日本語名）
        const normalizedPref = query.pref
            ? (prefMapping[query.pref.toLowerCase()] || query.pref)
            : undefined;
        if (!normalizedPref) {
            return [];
        }
        // 都道府県コードも検索対象に含める（230006 = 愛知県）
        const prefCodes = {
            aichi: '230006',
            '愛知県': '230006',
        };
        const prefCode = prefCodes[query.pref?.toLowerCase() || ''] || prefCodes[normalizedPref] || undefined;
        // 都道府県名または都道府県コードで検索（OR条件）
        const params = {
            TableName: this.eventsTableName,
            IndexName: 'pref-date-index',
            KeyConditionExpression: 'venuePref = :pref',
            ExpressionAttributeValues: {
                ':pref': normalizedPref,
            },
        };
        // 日付範囲の条件を追加
        if (query.startDate && query.endDate) {
            params.KeyConditionExpression += ' AND startAt BETWEEN :start AND :end';
            params.ExpressionAttributeValues[':start'] = query.startDate;
            params.ExpressionAttributeValues[':end'] = query.endDate;
        }
        else if (query.startDate) {
            params.KeyConditionExpression += ' AND startAt >= :start';
            params.ExpressionAttributeValues[':start'] = query.startDate;
        }
        else if (query.endDate) {
            params.KeyConditionExpression += ' AND startAt <= :end';
            params.ExpressionAttributeValues[':end'] = query.endDate;
        }
        if (query.limit) {
            params.Limit = query.limit;
        }
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        let items = (result.Items || []).map((item) => this.denormalizeEvent(item));
        // 都道府県コードでも検索（別クエリ）
        if (prefCode && prefCode !== normalizedPref) {
            const codeParams = {
                TableName: this.eventsTableName,
                IndexName: 'pref-date-index',
                KeyConditionExpression: 'venuePref = :pref',
                ExpressionAttributeValues: {
                    ':pref': prefCode,
                },
            };
            if (query.startDate && query.endDate) {
                codeParams.KeyConditionExpression += ' AND startAt BETWEEN :start AND :end';
                codeParams.ExpressionAttributeValues[':start'] = query.startDate;
                codeParams.ExpressionAttributeValues[':end'] = query.endDate;
            }
            if (query.limit) {
                codeParams.Limit = query.limit;
            }
            const codeResult = await this.client.send(new lib_dynamodb_1.QueryCommand(codeParams));
            const codeItems = (codeResult.Items || []).map((item) => this.denormalizeEvent(item));
            items = [...items, ...codeItems];
        }
        // 重複を除去（eventIdで）
        const uniqueItems = Array.from(new Map(items.map(item => [item.eventId, item])).values());
        // 表示順序でソート（イベント期間が3日以内を最優先、その他はdisplayOrder順）
        return this.sortEventsByDisplayOrder(uniqueItems);
    }
    /**
     * カテゴリで検索
     */
    async searchByCategory(query) {
        if (!query.categories || query.categories.length === 0) {
            return [];
        }
        const params = {
            TableName: this.eventsTableName,
            IndexName: 'category-date-index',
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: {
                ':category': query.categories[0],
            },
        };
        if (query.startDate && query.endDate) {
            params.KeyConditionExpression += ' AND startAt BETWEEN :start AND :end';
            params.ExpressionAttributeValues[':start'] = query.startDate;
            params.ExpressionAttributeValues[':end'] = query.endDate;
        }
        if (query.limit) {
            params.Limit = query.limit;
        }
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand(params));
        let items = (result.Items || []).map((item) => this.denormalizeEvent(item));
        // 表示順序でソート（イベント期間が3日以内を最優先、その他はdisplayOrder順）
        return this.sortEventsByDisplayOrder(items);
    }
    /**
     * 日付範囲で検索（全件スキャン）
     */
    async searchByDateRange(query) {
        const params = {
            TableName: this.eventsTableName,
            Limit: query.limit || 100,
        };
        const filterExpressions = [];
        if (query.startDate) {
            filterExpressions.push('startAt >= :start');
            params.ExpressionAttributeValues = params.ExpressionAttributeValues || {};
            params.ExpressionAttributeValues[':start'] = query.startDate;
        }
        if (query.endDate) {
            filterExpressions.push('startAt <= :end');
            params.ExpressionAttributeValues = params.ExpressionAttributeValues || {};
            params.ExpressionAttributeValues[':end'] = query.endDate;
        }
        if (filterExpressions.length > 0) {
            params.FilterExpression = filterExpressions.join(' AND ');
        }
        console.log('searchByDateRange - params:', JSON.stringify(params));
        const result = await this.client.send(new lib_dynamodb_1.ScanCommand(params));
        console.log('searchByDateRange - result count:', result.Items?.length || 0);
        let items = (result.Items || []).map((item) => this.denormalizeEvent(item));
        // キーワード検索
        if (query.keyword) {
            const keyword = query.keyword.toLowerCase();
            items = items.filter((item) => item.title.toLowerCase().includes(keyword) ||
                (item.description && item.description.toLowerCase().includes(keyword)) ||
                (item.venueName && item.venueName.toLowerCase().includes(keyword)));
        }
        // 表示順序でソート（イベント期間が3日以内を最優先、その他はdisplayOrder順）
        items = this.sortEventsByDisplayOrder(items);
        return items;
    }
    /**
     * 最近のイベントを取得（過去30日から未来30日）
     */
    async searchRecent(query) {
        // JST（UTC+9）で現在日時を取得
        const now = new Date();
        const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
        const jstNow = new Date(now.getTime() + jstOffset);
        // 30日前の00:00:00（JST）- 過去のイベントも含める
        const thirtyDaysAgo = new Date(jstNow);
        thirtyDaysAgo.setUTCDate(jstNow.getUTCDate() - 30);
        thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
        const startDate = thirtyDaysAgo.toISOString().replace('Z', '+09:00');
        // 30日後の23:59:59（JST）
        const thirtyDaysLater = new Date(jstNow);
        thirtyDaysLater.setUTCDate(jstNow.getUTCDate() + 30);
        thirtyDaysLater.setUTCHours(23, 59, 59, 999);
        const endDate = thirtyDaysLater.toISOString().replace('Z', '+09:00');
        console.log('searchRecent - startDate:', startDate, 'endDate:', endDate);
        return this.searchByDateRange({
            ...query,
            startDate,
            endDate,
        });
    }
    /**
     * イベントを表示順序でソート
     * 優先度1: イベント期間が3日以内を最優先
     * 優先度2: 同じ優先度の場合はdisplayOrder順
     */
    sortEventsByDisplayOrder(events) {
        return events.sort((a, b) => {
            const aDuration = a.durationDays || 999;
            const bDuration = b.durationDays || 999;
            const aIsShort = aDuration <= 3; // 3日以内
            const bIsShort = bDuration <= 3;
            // 優先度1: イベント期間が3日以内を最優先
            if (aIsShort && !bIsShort)
                return -1; // aを優先
            if (!aIsShort && bIsShort)
                return 1; // bを優先
            // 優先度2: 同じ優先度の場合はdisplayOrderでソート
            const aOrder = a.displayOrder || 999999;
            const bOrder = b.displayOrder || 999999;
            return aOrder - bOrder;
        });
    }
    /**
     * EventNormalizedをDynamoDB形式に変換
     */
    normalizeEvent(event) {
        // category属性を追加（GSI-3用）
        return {
            ...event,
            category: event.categories[0] || 'other',
            ttl: this.calculateTTL(event.endAt),
            // displayOrderとdurationDaysはそのまま保存（Phase8）
            displayOrder: event.displayOrder,
            durationDays: event.durationDays,
        };
    }
    /**
     * DynamoDB形式からEventNormalizedに変換
     */
    denormalizeEvent(item) {
        const { category, ttl, ...event } = item;
        return event;
    }
    /**
     * TTL計算（イベント終了日から30日後）
     */
    calculateTTL(endAt) {
        const endDate = new Date(endAt);
        const ttlDate = new Date(endDate);
        ttlDate.setDate(ttlDate.getDate() + 30);
        return Math.floor(ttlDate.getTime() / 1000);
    }
    /**
     * ユーザー情報を取得
     */
    async getUser(userId) {
        const result = await this.client.send(new lib_dynamodb_1.GetCommand({
            TableName: this.usersTableName,
            Key: { userId },
        }));
        return result.Item || null;
    }
    /**
     * ユーザー情報を更新
     */
    async updateUser(userId, preferences) {
        // 既存のユーザーデータを取得
        const existingUser = await this.getUser(userId);
        // 既存データとマージ
        const item = {
            userId,
            ...(existingUser || {}),
            ...preferences,
            updatedAt: new Date().toISOString(),
        };
        // notifyEnabledを文字列として保存（GSI用）
        if (preferences.notifyEnabled !== undefined) {
            item.notifyEnabled = String(preferences.notifyEnabled);
        }
        else if (existingUser?.notifyEnabled !== undefined) {
            item.notifyEnabled = String(existingUser.notifyEnabled);
        }
        await this.client.send(new lib_dynamodb_1.PutCommand({
            TableName: this.usersTableName,
            Item: item,
        }));
    }
    /**
     * 通知有効なユーザー一覧を取得
     */
    async getNotifyEnabledUsers() {
        // notifyEnabledがbooleanの場合は文字列に変換
        const result = await this.client.send(new lib_dynamodb_1.QueryCommand({
            TableName: this.usersTableName,
            IndexName: 'notify-enabled-index',
            KeyConditionExpression: 'notifyEnabled = :enabled',
            ExpressionAttributeValues: {
                ':enabled': 'true', // DynamoDBのGSIでは文字列として保存されている想定
            },
        }));
        // booleanのnotifyEnabledも対応
        const allUsers = await this.client.send(new lib_dynamodb_1.ScanCommand({
            TableName: this.usersTableName,
            FilterExpression: 'notifyEnabled = :enabled',
            ExpressionAttributeValues: {
                ':enabled': true,
            },
        }));
        // 重複を除去してマージ
        const usersMap = new Map();
        (result.Items || []).forEach((user) => {
            usersMap.set(user.userId, user);
        });
        (allUsers.Items || []).forEach((user) => {
            if (!usersMap.has(user.userId)) {
                usersMap.set(user.userId, user);
            }
        });
        return Array.from(usersMap.values());
    }
    /**
     * 全イベントを削除（洗い替え用）
     */
    async deleteAll() {
        let lastEvaluatedKey = undefined;
        let totalDeleted = 0;
        do {
            // スキャンでイベントを取得
            const scanParams = {
                TableName: this.eventsTableName,
                Limit: 100,
            };
            if (lastEvaluatedKey) {
                scanParams.ExclusiveStartKey = lastEvaluatedKey;
            }
            const scanResult = await this.client.send(new lib_dynamodb_1.ScanCommand(scanParams));
            const items = scanResult.Items || [];
            if (items.length > 0) {
                // バッチ削除（最大25件ずつ）
                const batchSize = 25;
                for (let i = 0; i < items.length; i += batchSize) {
                    const batch = items.slice(i, i + batchSize);
                    const deleteRequests = batch.map((item) => ({
                        DeleteRequest: {
                            Key: {
                                eventId: item.eventId,
                            },
                        },
                    }));
                    await this.client.send(new lib_dynamodb_1.BatchWriteCommand({
                        RequestItems: {
                            [this.eventsTableName]: deleteRequests,
                        },
                    }));
                    totalDeleted += batch.length;
                    console.log(`[deleteAll] 削除: ${totalDeleted}件`);
                }
            }
            lastEvaluatedKey = scanResult.LastEvaluatedKey;
        } while (lastEvaluatedKey);
        console.log(`[deleteAll] 削除完了: 合計 ${totalDeleted}件`);
    }
}
exports.DynamoDBEventRepository = DynamoDBEventRepository;
//# sourceMappingURL=dynamodb.js.map