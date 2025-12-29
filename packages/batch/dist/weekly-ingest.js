"use strict";
/**
 * 週次収集バッチ
 * 18_DATA_PIPELINE.md に準拠
 * 06_BATCH_JOBS.md セクション1 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWeeklyIngest = runWeeklyIngest;
const common_1 = require("@ouma-family-event/common");
const ingestion_1 = require("@ouma-family-event/ingestion");
/**
 * 週次収集バッチを実行
 */
async function runWeeklyIngest(repository, enableDiscovery = false, clearExisting = true) {
    const sources = (0, common_1.getAllSources)();
    const results = [];
    // 既存データの削除（洗い替え）
    if (clearExisting) {
        try {
            ingestion_1.errorHandler.info('Deleting all existing events before ingestion', {});
            await repository.deleteAll();
            ingestion_1.errorHandler.info('All existing events deleted', {});
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            ingestion_1.errorHandler.warn('Failed to delete existing events, continuing with ingestion', {
                error: errorMessage,
            });
        }
    }
    for (const source of sources) {
        const result = {
            sourceId: source.sourceId,
            success: false,
            fetched: 0,
            normalized: 0,
            saved: 0,
            errors: [],
        };
        try {
            // 1. データ取得
            const fetcher = (0, ingestion_1.createFetcher)(source);
            const buffer = await fetcher.fetch();
            result.fetched = 1;
            // 2. パース（HTMLフォーマットのみ）
            let rows = [];
            if (source.format === 'html') {
                // HTMLフォーマットの場合は特別処理
                const htmlFetcher = fetcher;
                const htmlEvents = [];
                let displayOrder = 1;
                let pageNumber = 1;
                let hasMorePages = true;
                // ページネーション処理: 全てのページを取得
                while (hasMorePages) {
                    // 一覧ページを取得
                    const listBuffer = await htmlFetcher.fetchListPage(pageNumber);
                    const listHtml = listBuffer.toString('utf-8');
                    const parseResult = (0, ingestion_1.parseHtmlList)(listHtml);
                    // 各イベントIDに対して詳細ページとdata.htmlを取得
                    for (const eventId of parseResult.eventIds) {
                        try {
                            // 詳細ページを取得
                            const detailBuffer = await htmlFetcher.fetchDetail(eventId);
                            const detailHtml = detailBuffer.toString('utf-8');
                            const detailJsonLd = (0, ingestion_1.extractFromDetailPage)(detailHtml);
                            if (!detailJsonLd) {
                                ingestion_1.errorHandler.warn(`JSON-LD data not found for ${eventId}`, {
                                    sourceId: source.sourceId,
                                    eventId,
                                });
                                continue;
                            }
                            // data.htmlを取得
                            const dataBuffer = await htmlFetcher.fetchData(eventId);
                            const dataHtml = dataBuffer.toString('utf-8');
                            // マッピング
                            const mapped = (0, ingestion_1.mapHtmlEvent)(detailJsonLd, dataHtml, eventId, displayOrder);
                            htmlEvents.push(mapped);
                            displayOrder++;
                        }
                        catch (error) {
                            const errorMessage = error?.message || error?.toString() || String(error);
                            ingestion_1.errorHandler.warn(`Failed to fetch detail/data for ${eventId}`, {
                                sourceId: source.sourceId,
                                eventId,
                                error: errorMessage,
                            });
                        }
                    }
                    // 次のページがあるかチェック
                    hasMorePages = (0, ingestion_1.hasNextPage)(listHtml);
                    if (hasMorePages) {
                        pageNumber++;
                        // 日付フィルタリング: 未来30日以内のイベントがなくなったら終了
                        // （簡易実装: 最大100ページまで取得）
                        if (pageNumber > 100) {
                            ingestion_1.errorHandler.warn(`Reached maximum page limit (100) for ${source.sourceId}`, {
                                sourceId: source.sourceId,
                            });
                            hasMorePages = false;
                        }
                    }
                }
                rows = htmlEvents;
                result.fetched = pageNumber; // 取得したページ数
            }
            // 3. 正規化（HTMLフォーマットのみ）
            const normalized = [];
            for (const row of rows) {
                try {
                    // HTMLフォーマットの正規化
                    const htmlEventData = row;
                    const normalizer = new ingestion_1.HtmlNormalizer(source);
                    const event = normalizer.normalize(htmlEventData, htmlEventData);
                    // フィルタリング: 日付条件をチェック
                    if (!shouldIncludeEvent(event)) {
                        continue;
                    }
                    // 4. バリデーション
                    const validation = (0, ingestion_1.validateSchema)(event);
                    if (!validation.isValid) {
                        ingestion_1.errorHandler.warn(`Skipping event due to validation errors`, {
                            sourceId: source.sourceId,
                            eventId: event.eventId,
                            error: validation.errors.join('; '),
                        });
                        continue;
                    }
                    // 5. データ品質スコア更新
                    const eventWithConfidence = (0, ingestion_1.updateDataConfidence)(event);
                    // 6. タグ付け
                    const categories = (0, ingestion_1.tagCategories)(eventWithConfidence);
                    const targetAges = (0, ingestion_1.tagTargetAges)(eventWithConfidence);
                    const indoorOutdoor = (0, ingestion_1.tagIndoorOutdoor)(eventWithConfidence);
                    const isFree = (0, ingestion_1.tagIsFree)(eventWithConfidence);
                    const taggedEvent = {
                        ...eventWithConfidence,
                        categories: categories.length > 0 ? categories : eventWithConfidence.categories,
                        targetAges: targetAges.length > 0 ? targetAges : eventWithConfidence.targetAges,
                        indoorOutdoor: indoorOutdoor !== 'unknown' ? indoorOutdoor : eventWithConfidence.indoorOutdoor,
                        isFree: isFree !== null ? isFree : eventWithConfidence.isFree,
                    };
                    normalized.push(taggedEvent);
                    result.normalized++;
                }
                catch (error) {
                    const errorMessage = error?.message || error?.toString() || String(error);
                    result.errors.push(errorMessage);
                    ingestion_1.errorHandler.warn(`Failed to normalize row for ${source.sourceId}`, {
                        sourceId: source.sourceId,
                        error: errorMessage,
                    });
                }
            }
            // 4. Upsert保存
            if (normalized.length > 0) {
                await repository.upsertMany(normalized);
                result.saved = normalized.length;
            }
            result.success = true;
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            result.errors.push(errorMessage);
            ingestion_1.errorHandler.error(`Failed to ingest ${source.sourceId}`, {
                sourceId: source.sourceId,
                error: errorMessage,
            });
        }
        results.push(result);
    }
    return results;
}
/**
 * イベントをフィルタリング（日付条件）
 */
function shouldIncludeEvent(event) {
    if (!event.startAt || !event.endAt) {
        return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneMonthLater = new Date(today);
    oneMonthLater.setDate(today.getDate() + 30);
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);
    // 条件1: スタート日が直近1ヶ月以内
    const isFuture30Days = startDate >= today && startDate <= oneMonthLater;
    // 条件2: 既に始まっているもの（開催中）
    const isOngoing = startDate <= today && endDate >= today;
    return isFuture30Days || isOngoing;
}
//# sourceMappingURL=weekly-ingest.js.map