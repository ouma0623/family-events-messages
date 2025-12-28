"use strict";
/**
 * 認証ミドルウェア
 * Cognito JWT検証
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const aws_jwt_verify_1 = require("aws-jwt-verify");
let verifier = null;
/**
 * Cognito JWT認証ミドルウェア
 */
async function authenticate(req, res, next) {
    try {
        // 環境変数が設定されていない場合は認証をスキップ（開発用）
        if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
            req.userId = 'anonymous';
            next();
            return;
        }
        // 初回のみverifierを作成
        if (!verifier) {
            verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
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
        req.userId = payload.sub;
        next();
    }
    catch (error) {
        const errorMessage = error?.message || error?.toString() || String(error);
        res.status(401).json({ error: `Unauthorized: ${errorMessage}` });
    }
}
//# sourceMappingURL=auth.js.map