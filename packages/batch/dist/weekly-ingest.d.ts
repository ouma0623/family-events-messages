/**
 * 週次収集バッチ
 * 18_DATA_PIPELINE.md に準拠
 * 06_BATCH_JOBS.md セクション1 に準拠
 */
import { EventRepository } from '@ouma-family-event/api';
/**
 * 収集結果
 */
export interface IngestResult {
    sourceId: string;
    success: boolean;
    fetched: number;
    normalized: number;
    saved: number;
    errors: string[];
}
/**
 * 週次収集バッチを実行
 */
export declare function runWeeklyIngest(repository: EventRepository, enableDiscovery?: boolean, clearExisting?: boolean): Promise<IngestResult[]>;
//# sourceMappingURL=weekly-ingest.d.ts.map