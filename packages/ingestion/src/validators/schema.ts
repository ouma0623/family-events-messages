/**
 * スキーマ検証
 * 15_NORMALIZED_SCHEMA.md セクション4 に準拠
 * 21_DATA_QUALITY.md セクション2 に準拠
 */

import { EventNormalized } from '@ouma-family-event/common';
import { errorHandler } from '../errors/handler';

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * EventNormalizedを検証
 */
export function validateSchema(event: EventNormalized): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須フィールドチェック
  if (!event.eventId) errors.push('eventId is required');
  if (!event.sourceId) errors.push('sourceId is required');
  if (!event.title) errors.push('title is required');
  if (!event.startAt) errors.push('startAt is required');
  if (!event.endAt) errors.push('endAt is required');
  if (!event.venueCity) errors.push('venueCity is required');
  if (!event.venuePref) errors.push('venuePref is required');
  if (!event.url) errors.push('url is required');
  if (event.recommendScore === undefined || event.recommendScore === null)
    errors.push('recommendScore is required');
  if (!event.recommendReasons) errors.push('recommendReasons is required');
  if (event.dataConfidence === undefined || event.dataConfidence === null)
    errors.push('dataConfidence is required');
  if (!event.raw) errors.push('raw is required');
  if (!event.ingestedAt) errors.push('ingestedAt is required');
  if (!event.updatedAt) errors.push('updatedAt is required');

  // 型チェック
  if (
    event.recommendScore !== undefined &&
    (event.recommendScore < 0 || event.recommendScore > 100)
  ) {
    errors.push('recommendScore must be between 0 and 100');
  }
  if (
    event.dataConfidence !== undefined &&
    (event.dataConfidence < 0 || event.dataConfidence > 1)
  ) {
    errors.push('dataConfidence must be between 0 and 1');
  }

  // 文字列長チェック
  if (event.title && event.title.length > 500) {
    warnings.push('title exceeds 500 characters');
  }
  if (event.description && event.description.length > 5000) {
    warnings.push('description exceeds 5000 characters');
  }

  // 日付妥当性チェック
  if (event.startAt && event.endAt) {
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);
    if (isNaN(startDate.getTime())) {
      errors.push(`Invalid startAt format: ${event.startAt}`);
    }
    if (isNaN(endDate.getTime())) {
      errors.push(`Invalid endAt format: ${event.endAt}`);
    }
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate > endDate) {
      errors.push('startAt must be <= endAt');
    }
  }

  // URL形式チェック
  if (event.url && !event.url.match(/^https?:\/\//)) {
    warnings.push(`URL does not start with http:// or https://: ${event.url}`);
  }

  // venueCityがunknownの場合
  if (event.venueCity === 'unknown') {
    warnings.push('venueCity is unknown (will be excluded from search)');
  }

  // エラーがある場合はログ出力
  if (errors.length > 0) {
    errorHandler.error(`Validation failed for event ${event.eventId}`, {
      sourceId: event.sourceId,
      eventId: event.eventId,
      error: errors.join('; '),
    });
  }

  // 警告がある場合はログ出力
  if (warnings.length > 0) {
    errorHandler.warn(`Validation warnings for event ${event.eventId}`, {
      sourceId: event.sourceId,
      eventId: event.eventId,
      error: warnings.join('; '),
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
