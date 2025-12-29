/**
 * 週次収集バッチ
 * 18_DATA_PIPELINE.md に準拠
 * 06_BATCH_JOBS.md セクション1 に準拠
 */

import { getAllSources, Source, EventNormalized } from '@ouma-family-event/common';
import {
  createFetcher,
  parseHtmlList,
  hasNextPage,
  extractFromDetailPage,
  mapHtmlEvent,
  HtmlNormalizer,
  HtmlFetcher,
  validateSchema,
  updateDataConfidence,
  tagCategories,
  tagTargetAges,
  tagIndoorOutdoor,
  tagIsFree,
  isSameEvent,
  mergeEvents,
  errorHandler,
} from '@ouma-family-event/ingestion';
import { EventRepository } from '@ouma-family-event/api';

/**
 * 収集結果
 */
export interface IngestResult {
  sourceId: string;
  success: boolean;
  fetched: number; // 取得件数
  normalized: number; // 正規化件数
  saved: number; // 保存件数
  errors: string[];
}

/**
 * 週次収集バッチを実行
 */
export async function runWeeklyIngest(
  repository: EventRepository,
  enableDiscovery: boolean = false,
  clearExisting: boolean = true
): Promise<IngestResult[]> {
  const sources = getAllSources();
  const results: IngestResult[] = [];

  // 既存データの削除（洗い替え）
  if (clearExisting) {
    try {
      errorHandler.info('Deleting all existing events before ingestion', {});
      await repository.deleteAll();
      errorHandler.info('All existing events deleted', {});
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      errorHandler.warn('Failed to delete existing events, continuing with ingestion', {
        error: errorMessage,
      });
    }
  }

  for (const source of sources) {
    const result: IngestResult = {
      sourceId: source.sourceId,
      success: false,
      fetched: 0,
      normalized: 0,
      saved: 0,
      errors: [],
    };

    try {
      // 1. データ取得
      const fetcher = createFetcher(source);
      const buffer = await fetcher.fetch();
      result.fetched = 1;

      // 2. パース（HTMLフォーマットのみ）
      let rows: any[] = [];
      if (source.format === 'html') {
        // HTMLフォーマットの場合は特別処理
        const htmlFetcher = fetcher as HtmlFetcher;
        const htmlEvents: any[] = [];
        let displayOrder = 1;
        let pageNumber = 1;
        let hasMorePages = true;
        
        // ページネーション処理: 全てのページを取得
        while (hasMorePages) {
          // 一覧ページを取得
          const listBuffer = await htmlFetcher.fetchListPage(pageNumber);
          const listHtml = listBuffer.toString('utf-8');
          const parseResult = parseHtmlList(listHtml);
          
          // 各イベントIDに対して詳細ページとdata.htmlを取得
          for (const eventId of parseResult.eventIds) {
            try {
              // 詳細ページを取得
              const detailBuffer = await htmlFetcher.fetchDetail(eventId);
              const detailHtml = detailBuffer.toString('utf-8');
              const detailJsonLd = extractFromDetailPage(detailHtml);
              
              if (!detailJsonLd) {
                errorHandler.warn(`JSON-LD data not found for ${eventId}`, {
                  sourceId: source.sourceId,
                  eventId,
                });
                continue;
              }
              
              // data.htmlを取得
              const dataBuffer = await htmlFetcher.fetchData(eventId);
              const dataHtml = dataBuffer.toString('utf-8');
              
              // price.htmlを取得（エラーが発生しても処理を続行）
              let priceHtml: string | null = null;
              try {
                const priceBuffer = await htmlFetcher.fetchPrice(eventId);
                priceHtml = priceBuffer.toString('utf-8');
              } catch (priceError: any) {
                const priceErrorMessage = (priceError as any)?.message || (priceError as any)?.toString() || String(priceError);
                errorHandler.warn(`Failed to fetch price page for ${eventId}`, {
                  sourceId: source.sourceId,
                  eventId,
                  error: priceErrorMessage,
                });
                // 料金ページが取得できなくても処理を続行
              }
              
              // マッピング
              const mapped = mapHtmlEvent(detailJsonLd, dataHtml, priceHtml, eventId, displayOrder);
              htmlEvents.push(mapped);
              displayOrder++;
            } catch (error: any) {
              const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
              errorHandler.warn(`Failed to fetch detail/data for ${eventId}`, {
                sourceId: source.sourceId,
                eventId,
                error: errorMessage,
              });
            }
          }
          
          // 次のページがあるかチェック
          hasMorePages = hasNextPage(listHtml);
          
          if (hasMorePages) {
            pageNumber++;
            // 日付フィルタリング: 未来30日以内のイベントがなくなったら終了
            // （簡易実装: 最大100ページまで取得）
            if (pageNumber > 100) {
              errorHandler.warn(`Reached maximum page limit (100) for ${source.sourceId}`, {
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
      const normalized: EventNormalized[] = [];

      for (const row of rows) {
        try {
          // HTMLフォーマットの正規化
          const htmlEventData = row as any;
          const normalizer = new HtmlNormalizer(source);
          const event = normalizer.normalize(htmlEventData, htmlEventData);

          // フィルタリング: 日付条件をチェック
          if (!shouldIncludeEvent(event)) {
            continue;
          }

          // 4. バリデーション
          const validation = validateSchema(event);
          if (!validation.isValid) {
            errorHandler.warn(`Skipping event due to validation errors`, {
              sourceId: source.sourceId,
              eventId: event.eventId,
              error: validation.errors.join('; '),
            });
            continue;
          }

          // 5. データ品質スコア更新
          const eventWithConfidence = updateDataConfidence(event);

          // 6. タグ付け
          const categories = tagCategories(eventWithConfidence);
          const targetAges = tagTargetAges(eventWithConfidence);
          const indoorOutdoor = tagIndoorOutdoor(eventWithConfidence);
          const isFree = tagIsFree(eventWithConfidence);

          const taggedEvent: EventNormalized = {
            ...eventWithConfidence,
            categories: categories.length > 0 ? categories : eventWithConfidence.categories,
            targetAges: targetAges.length > 0 ? targetAges : eventWithConfidence.targetAges,
            indoorOutdoor:
              indoorOutdoor !== 'unknown' ? indoorOutdoor : eventWithConfidence.indoorOutdoor,
            isFree: isFree !== null ? isFree : eventWithConfidence.isFree,
          };

          normalized.push(taggedEvent);
          result.normalized++;
        } catch (error: any) {
          const errorMessage =
            (error as any)?.message || (error as any)?.toString() || String(error);
          result.errors.push(errorMessage);
          errorHandler.warn(`Failed to normalize row for ${source.sourceId}`, {
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
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      result.errors.push(errorMessage);
      errorHandler.error(`Failed to ingest ${source.sourceId}`, {
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
function shouldIncludeEvent(event: EventNormalized): boolean {
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
