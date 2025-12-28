/**
 * Expressアプリケーション
 */

import express, { Express } from 'express';
import { EventRepository } from './repositories';
import { createApiRouter } from './routes';

/**
 * Expressアプリケーションを作成
 */
export function createApp(repository: EventRepository): Express {
  const app = express();

  // JSONパーサー
  app.use(express.json());

  // CORS設定（開発用）
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // APIルーター
  app.use('/api', createApiRouter(repository));

  // ヘルスチェック
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
