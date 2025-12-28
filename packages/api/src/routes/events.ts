/**
 * イベント検索API
 * 04_API_SPEC.md セクション1 に準拠
 */

import { Router, Request, Response } from 'express';
import { EventRepository, SearchQuery } from '../repositories';

export function createEventsRouter(repository: EventRepository): Router {
  const router = Router();

  /**
   * GET /api/events
   * イベント検索
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const query: SearchQuery = {
        city: req.query.cities as string | undefined,
        pref: req.query.prefectures as string | undefined,
        startDate: req.query.from ? `${req.query.from}T00:00:00+09:00` : undefined,
        endDate: req.query.to ? `${req.query.to}T23:59:59+09:00` : undefined,
        categories: req.query.categories ? (req.query.categories as string).split(',') : undefined,
        indoorOutdoor: req.query.indoor as string | undefined,
        isFree: req.query.freeOnly === 'true' ? true : undefined,
        keyword: req.query.keyword as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 30,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      };

      const events = await repository.search(query);

      res.json({
        items: events,
        total: events.length,
      });
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * GET /api/events/:id
   * イベント詳細
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const event = await repository.getById(req.params.id);
      if (!event) {
        res.status(404).json({ error: 'Event not found' });
        return;
      }
      res.json(event);
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}
