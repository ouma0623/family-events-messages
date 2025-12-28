/**
 * 認証ミドルウェア
 * Cognito JWT検証
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Cognito JWT認証ミドルウェア
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map