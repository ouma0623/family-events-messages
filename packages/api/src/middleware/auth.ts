/**
 * 認証ミドルウェア
 * Cognito JWT検証
 */

import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

/**
 * Cognito JWT認証ミドルウェア
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 環境変数が設定されていない場合は認証をスキップ（開発用）
    if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
      (req as any).userId = 'anonymous';
      next();
      return;
    }

    // 初回のみverifierを作成
    if (!verifier) {
      verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: 'id',
        clientId: process.env.COGNITO_CLIENT_ID,
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = await verifier.verify(token);

    // userIdをリクエストに追加
    (req as any).userId = payload.sub;

    next();
  } catch (error: any) {
    const errorMessage = (error as any)?.message || (error as any)?.toString() || String(error);
    res.status(401).json({ error: `Unauthorized: ${errorMessage}` });
  }
}
