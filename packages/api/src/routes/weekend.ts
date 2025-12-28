/**
 * 週末イベントAPI
 * 04_API_SPEC.md セクション3 に準拠
 */

import { Router, Request, Response } from 'express';
import { EventRepository, UserPreference } from '../repositories';

export function createWeekendRouter(repository: EventRepository): Router {
  const router = Router();

  /**
   * GET /api/weekend
   * 週末イベント取得
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const userPref: UserPreference = {
        city: req.query.cities as string | undefined,
        pref: req.query.prefectures as string | undefined,
        ageRanges: req.query.ageRanges ? (req.query.ageRanges as string).split(',') : undefined,
        indoorPreferred: req.query.indoorPreferred === 'true',
      };

      const events = await repository.listWeekendRecommendations(userPref);

      res.json({
        items: events,
        total: events.length,
      });
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}
