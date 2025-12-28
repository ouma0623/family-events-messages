import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBEventRepository } from '../repositories/dynamodb';
import { UserPreference } from '../repositories/types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const repository = new DynamoDBEventRepository();
    
    // API Gateway HTTP APIのJWT認証では、authorizer.jwt.claimsにクレームが含まれる
    // 認証はオプショナル（ログイン済みユーザーの場合はユーザー設定を使用）
    const authorizer = event.requestContext?.authorizer as any;
    const userId = authorizer?.jwt?.claims?.sub || authorizer?.claims?.sub;
    
    console.log('Weekend handler - authorizer:', JSON.stringify(authorizer));
    console.log('Weekend handler - userId:', userId);
    
    let userPref: UserPreference | undefined;
    
    // ユーザーがログイン済みの場合はユーザー設定を使用
    if (userId) {
      const user = await repository.getUser(userId);
      if (user) {
        userPref = {
          city: user.preferences?.city || user.city,
          pref: user.preferences?.pref || user.pref,
          ageRanges: user.preferences?.ageRanges || user.ageRanges,
          indoorPreferred: user.preferences?.indoorPreferred || user.indoorPreferred,
        };
      }
    }
    
    // クエリパラメータからも設定を取得（認証なしでも使用可能）
    const params = event.queryStringParameters || {};
    const pref = params.pref || params.prefectures;
    const city = params.city || params.cities;
    const ageRanges = params.ageRanges?.split(',');
    const indoorPreferred = params.indoorPreferred === 'true';
    const weekendOf = params.weekendOf; // YYYY-MM-DD形式の日付（指定しない場合は今週末）
    
    // クエリパラメータが指定されている場合はそれを使用、なければユーザー設定を使用
    const finalPref: UserPreference = {
      city: city || userPref?.city,
      pref: pref || userPref?.pref,
      ageRanges: ageRanges || userPref?.ageRanges,
      indoorPreferred: indoorPreferred !== undefined ? indoorPreferred : (userPref?.indoorPreferred || false),
    };

    const results = await repository.listWeekendRecommendations(finalPref, weekendOf);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        items: results,
        total: results.length,
      }),
    };
  } catch (error) {
    console.error('weekend error:', error);
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
