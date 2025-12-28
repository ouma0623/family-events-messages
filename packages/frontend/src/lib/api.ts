/**
 * API呼び出しライブラリ
 */

import { EventNormalized } from '@ouma-family-event/common';

// APIエンドポイントの設定
// 本番環境では api.oumasan.org を使用
// 開発環境では環境変数 NEXT_PUBLIC_API_URL で上書き可能
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.oumasan.org/v1';

/**
 * イベント検索（認証トークンがあれば送信）
 */
export async function searchEvents(params: {
  city?: string;
  pref?: string;
  from?: string;
  to?: string;
  categories?: string[];
  indoorOutdoor?: string;
  isFree?: boolean;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: EventNormalized[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params.city) queryParams.append('cities', params.city);
  if (params.pref) queryParams.append('prefectures', params.pref);
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  if (params.categories) queryParams.append('categories', params.categories.join(','));
  if (params.indoorOutdoor) queryParams.append('indoor', params.indoorOutdoor);
  if (params.isFree !== undefined) queryParams.append('freeOnly', String(params.isFree));
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.limit) queryParams.append('limit', String(params.limit));
  if (params.offset) queryParams.append('offset', String(params.offset));

  // 認証トークンを取得して送信（オプション）
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  try {
    const { getIdToken } = await import('./cognito');
    const token = await getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[searchEvents] Sending request with auth token');
    } else {
      console.log('[searchEvents] No auth token available');
    }
  } catch (error) {
    // 認証トークンが取得できない場合は認証なしでリクエスト
    console.log('[searchEvents] Failed to get auth token:', error);
  }

  const response = await fetch(`${API_BASE_URL}/events?${queryParams.toString()}`, {
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[searchEvents] API error:', response.status, response.statusText, errorText);
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * イベント詳細取得
 */
export async function getEventById(eventId: string): Promise<EventNormalized> {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 週末イベント取得（認証不要）
 */
export async function getWeekendEvents(params?: {
  city?: string;
  pref?: string;
  ageRanges?: string[];
  indoorPreferred?: boolean;
  weekendOf?: string; // YYYY-MM-DD形式の日付（指定しない場合は今週末）
}): Promise<{ items: EventNormalized[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.city) queryParams.append('cities', params.city);
  if (params?.pref) queryParams.append('prefectures', params.pref);
  if (params?.ageRanges) queryParams.append('ageRanges', params.ageRanges.join(','));
  if (params?.indoorPreferred) queryParams.append('indoorPreferred', 'true');
  if (params?.weekendOf) queryParams.append('weekendOf', params.weekendOf);

  // 認証不要でリクエスト
  const response = await fetch(`${API_BASE_URL}/weekend?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

/**
 * ユーザー設定取得
 */
export async function getUserSettings(): Promise<{
  city?: string;
  pref?: string;
  ageRanges?: string[];
  indoorPreferred?: boolean;
  notifyEnabled?: boolean;
  lineUserId?: string | null;
} | null> {
  try {
    const { getIdToken } = await import('./cognito');
    const token = await getIdToken();
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      // ユーザーが存在しない場合はnullを返す
      return null;
    } else {
      return null;
    }
  } catch (error) {
    console.error('[getUserSettings] Failed to fetch settings:', error);
    return null;
  }
}
