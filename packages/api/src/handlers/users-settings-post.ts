import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBEventRepository } from '../repositories/dynamodb';
import { UserPreference } from '../repositories/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // CognitoのuserIdを取得
    const authorizer = event.requestContext?.authorizer as any;
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
    const preferences: Partial<UserPreference> & { notifyEnabled?: boolean } = {
      city: body.city,
      pref: body.pref,
      ageRanges: body.ageRanges,
      indoorPreferred: body.indoorPreferred,
      notifyEnabled: body.notifyEnabled,
    };

    const repository = new DynamoDBEventRepository();
    await repository.updateUser(userId, preferences);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
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
