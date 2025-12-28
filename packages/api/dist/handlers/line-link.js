"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const dynamodb_1 = require("../repositories/dynamodb");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const axios_1 = __importDefault(require("axios"));
async function handler(event) {
    try {
        // CognitoのuserIdを取得
        const authorizer = event.requestContext?.authorizer;
        const userId = authorizer?.jwt?.claims?.sub || authorizer?.claims?.sub;
        if (!userId) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'Unauthorized', message: 'ログインが必要です。' }),
            };
        }
        const body = JSON.parse(event.body || '{}');
        const { code } = body;
        if (!code) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ error: 'code is required' }),
            };
        }
        // Secrets Managerから認証情報を取得
        const secretsClient = new client_secrets_manager_1.SecretsManagerClient({});
        const secret = await secretsClient.send(new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: process.env.SECRET_NAME_LINE || 'ouma-fe-prd/line',
        }));
        const lineConfig = JSON.parse(secret.SecretString || '{}');
        // LINE Login Channel IDの検証
        if (!lineConfig.lineLoginChannelId) {
            console.error('lineLoginChannelId is not set in Secrets Manager');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'LINE連携の設定が不完全です',
                    details: 'LINE Login Channel IDが設定されていません。管理者にお問い合わせください。',
                }),
            };
        }
        // Channel IDが数字のみか確認（ユーザーIDと混同していないかチェック）
        if (!/^\d+$/.test(String(lineConfig.lineLoginChannelId))) {
            console.error('Invalid lineLoginChannelId format:', lineConfig.lineLoginChannelId);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'LINE連携の設定が不正です',
                    details: 'LINE Login Channel IDの形式が正しくありません。LINE Developersコンソールで正しいChannel IDを確認してください。',
                }),
            };
        }
        // LINE OAuth認証コードを検証
        const redirectUri = 'https://web.oumasan.org/line/callback';
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: String(lineConfig.lineLoginChannelId || ''),
            client_secret: String(lineConfig.lineLoginChannelSecret || ''),
        });
        console.log('LINE OAuth token request params:', {
            grant_type: 'authorization_code',
            code: code.substring(0, 10) + '...',
            redirect_uri: redirectUri,
            client_id: String(lineConfig.lineLoginChannelId || '').substring(0, 10) + '...',
            client_secret: '***',
        });
        const tokenResponse = await axios_1.default.post('https://api.line.me/oauth2/v2.1/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const { id_token } = tokenResponse.data;
        // ID Tokenを検証してlineUserIdを取得
        const idTokenPayload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
        const lineUserId = idTokenPayload.sub;
        // CognitoのuserIdをキーに、lineUserIdを保存
        const repository = new dynamodb_1.DynamoDBEventRepository();
        console.log('[line-link] Saving lineUserId:', { userId, lineUserId });
        // ユーザーが存在しない場合は作成、存在する場合は更新
        const existingUser = await repository.getUser(userId);
        console.log('[line-link] Existing user:', {
            exists: !!existingUser,
            existingLineUserId: existingUser?.lineUserId
        });
        if (!existingUser) {
            // 新規ユーザーを作成
            console.log('[line-link] Creating new user with lineUserId');
            await repository.updateUser(userId, {
                city: '',
                pref: '',
                ageRanges: [],
                indoorPreferred: false,
                lineUserId: lineUserId,
            });
        }
        else {
            // 既存ユーザーにlineUserIdを設定
            console.log('[line-link] Updating existing user with lineUserId');
            await repository.updateUser(userId, { lineUserId });
        }
        // 保存後に確認
        const savedUser = await repository.getUser(userId);
        console.log('[line-link] Saved user:', {
            userId: savedUser?.userId,
            lineUserId: savedUser?.lineUserId,
            hasLineUserId: !!savedUser?.lineUserId
        });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ success: true, lineUserId, userId }),
        };
    }
    catch (error) {
        console.error('line-link error:', error);
        // LINE OAuth APIのエラーレスポンスを詳細にログ出力
        if (error.response) {
            console.error('LINE OAuth API error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
            });
            // 400 Bad Requestの場合は詳細なエラーメッセージを返す
            if (error.response.status === 400) {
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify({
                        error: 'LINE連携に失敗しました',
                        details: error.response.data?.error_description || error.response.data?.error || 'Bad Request',
                        debug: process.env.NODE_ENV === 'development' ? error.response.data : undefined,
                    }),
                };
            }
        }
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                details: error.message || 'Unknown error',
            }),
        };
    }
}
//# sourceMappingURL=line-link.js.map