import { Router } from 'express';
import { EventRepository } from '../repositories';
import { createEventsRouter } from './events';
import { createWeekendRouter } from './weekend';
import { createSettingsRouter } from './settings';
import { createLineRouter } from './line';
import { authenticate } from '../middleware/auth';

/**
 * APIルーターを作成
 */
export function createApiRouter(repository: EventRepository): Router {
  const router = Router();

  // イベント検索API（認証不要）
  router.use('/events', createEventsRouter(repository));

  // 週末イベントAPI（認証不要）
  router.use('/weekend', createWeekendRouter(repository));

  // ユーザー設定API（認証必要）
  router.use('/users/me/settings', authenticate, createSettingsRouter());

  // LINE連携API（認証必要）
  router.use('/line', authenticate, createLineRouter());

  return router;
}
