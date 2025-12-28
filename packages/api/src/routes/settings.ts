/**
 * ユーザー設定API
 * 04_API_SPEC.md セクション4, 5 に準拠
 */

import { Router, Request, Response } from 'express';
import { UserPreference } from '../repositories';

/**
 * ユーザー設定（簡易実装、実際はDBに保存）
 */
const userSettings: Map<string, UserPreference & { notifyEnabled: boolean }> = new Map();

export function createSettingsRouter(): Router {
  const router = Router();

  /**
   * GET /api/users/me/settings
   * ユーザー設定取得
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      // TODO: 認証ミドルウェアからuserIdを取得
      const userId = (req as any).userId || 'anonymous';
      const settings = userSettings.get(userId) || {
        notifyEnabled: false,
      };

      res.json(settings);
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * POST /api/users/me/settings
   * ユーザー設定保存
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      // TODO: 認証ミドルウェアからuserIdを取得
      const userId = (req as any).userId || 'anonymous';
      const settings = {
        ...req.body,
        notifyEnabled: req.body.notifyEnabled ?? false,
      };

      userSettings.set(userId, settings);

      res.json(settings);
    } catch (error: any) {
      const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}
