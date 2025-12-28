import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBEventRepository } from '../repositories/dynamodb';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    console.log('[users-settings-get] Event:', JSON.stringify({
      requestContext: event.requestContext,
      headers: event.headers,
    }));
    
    // CognitoのuserIdを取得
    const authorizer = event.requestContext?.authorizer as any;
    const userId = authorizer?.jwt?.claims?.sub || authorizer?.claims?.sub;

    console.log('[users-settings-get] Authorizer:', JSON.stringify(authorizer));
    console.log('[users-settings-get] UserId:', userId);

    if (!userId) {
      console.error('[users-settings-get] No userId found in authorizer');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized', message: 'ログインが必要です。' }),
      };
    }

    const repository = new DynamoDBEventRepository();
    const user = await repository.getUser(userId);
    console.log('[users-settings-get] User from DB:', JSON.stringify({
      userId: user?.userId,
      lineUserId: user?.lineUserId,
      hasLineUserId: !!user?.lineUserId,
    }));
    if (!user) {
      // ユーザーが存在しない場合は、空の設定を返す（新規ユーザーとして扱う）
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          userId, 
          city: '', 
          pref: '', 
          ageRanges: [], 
          indoorPreferred: false, 
          notifyEnabled: false,
          lineUserId: null,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        userId: user.userId,
        city: user.city || '',
        pref: user.pref || '',
        ageRanges: user.ageRanges || [],
        indoorPreferred: user.indoorPreferred || false,
        notifyEnabled: user.notifyEnabled === true || user.notifyEnabled === 'true',
        lineUserId: user.lineUserId || null,
      }),
    };
  } catch (error) {
    console.error('users-settings-get error:', error);
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
