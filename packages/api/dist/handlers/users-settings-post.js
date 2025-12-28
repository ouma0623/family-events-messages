"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const dynamodb_1 = require("../repositories/dynamodb");
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
        const preferences = {
            city: body.city,
            pref: body.pref,
            ageRanges: body.ageRanges,
            indoorPreferred: body.indoorPreferred,
            notifyEnabled: body.notifyEnabled,
        };
        const repository = new dynamodb_1.DynamoDBEventRepository();
        await repository.updateUser(userId, preferences);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ success: true }),
        };
    }
    catch (error) {
        console.error('users-settings-post error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
}
//# sourceMappingURL=users-settings-post.js.map