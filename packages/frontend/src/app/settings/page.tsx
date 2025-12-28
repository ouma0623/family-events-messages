/**
 * 設定ページ - モダンでリッチなUI
 */

'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getIdToken, isAuthenticated, signOut } from '@/lib/cognito';
import { 
  FiSettings, 
  FiLogOut, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiMapPin, 
  FiCalendar, 
  FiUsers, 
  FiHome, 
  FiBell, 
  FiSave, 
  FiX,
  FiMessageCircle,
  FiSearch,
  FiGlobe,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.oumasan.org/v1';

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState({
    city: '',
    pref: '',
    ageRanges: [] as string[],
    indoorPreferred: false,
    notifyEnabled: false,
  });
  const [lineLinked, setLineLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSettings = async () => {
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        router.push('/login');
        return;
      }

      console.log('[Settings] Fetching settings...');
      const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Settings] Settings data received:', { 
          lineUserId: data.lineUserId, 
          hasLineUserId: !!data.lineUserId 
        });
        
        setSettings({
          city: data.city || '',
          pref: data.pref || '',
          ageRanges: data.ageRanges || [],
          indoorPreferred: data.indoorPreferred || false,
          notifyEnabled: data.notifyEnabled || false,
        });
        
        // lineUserIdがあれば連携済みと判定
        const hasLineUserId = data.lineUserId && data.lineUserId !== null && data.lineUserId !== '';
        console.log('[Settings] LINE linked status:', hasLineUserId);
        
        if (hasLineUserId) {
          setLineLinked(true);
          localStorage.setItem('lineUserId', data.lineUserId);
        } else {
          setLineLinked(false);
          localStorage.removeItem('lineUserId');
        }
      } else if (response.status === 404) {
        // ユーザーが存在しない場合は新規ユーザー（設定は空のまま）
        console.log('[Settings] User not found (404)');
        setLineLinked(false);
      } else {
        console.error('[Settings] Failed to fetch settings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[Settings] Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ログイン状態を確認
    const checkAuth = async () => {
      // URLパラメータでリフレッシュ中の場合はスキップ
      if (isRefreshing) {
        console.log('[Settings] Skipping checkAuth because refreshing...');
        return;
      }
      
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/login');
        return;
      }

      // ユーザー設定を取得
      await fetchSettings();
    };

    checkAuth();
  }, [router, isRefreshing]);

  // URLパラメータでLINE連携完了を検知
  useEffect(() => {
    const lineLinkedParam = searchParams.get('lineLinked');
    console.log('[Settings] URL param lineLinked:', lineLinkedParam);
    
    if (lineLinkedParam === 'true' && !isRefreshing) {
      console.log('[Settings] LINE linked detected, refreshing settings...');
      setIsRefreshing(true);
      
      // まず設定を取得してからURLパラメータを削除
      const refreshSettings = async () => {
        try {
          // 少し待ってからトークンを取得（Cognitoセッションが確立されるまで）
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const idToken = await getIdToken();
          if (!idToken) {
            console.error('[Settings] No token available, redirecting to login');
            setIsRefreshing(false);
            router.push('/login');
            return;
          }
          
          console.log('[Settings] Token available, fetching settings...', { 
            tokenLength: idToken.length,
            tokenPreview: idToken.substring(0, 20) + '...',
            tokenEnd: '...' + idToken.substring(idToken.length - 20)
          });
          
          // トークンの有効性を確認（JWT形式かどうか）
          const tokenParts = idToken.split('.');
          if (tokenParts.length !== 3) {
            console.error('[Settings] Invalid token format:', tokenParts.length, 'parts');
            setIsRefreshing(false);
            return;
          }
          
          // JWTペイロードをデコードして確認
          try {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('[Settings] Token payload:', {
              sub: payload.sub,
              exp: payload.exp,
              expDate: new Date(payload.exp * 1000).toISOString(),
              now: new Date().toISOString(),
              isExpired: payload.exp * 1000 < Date.now()
            });
            
            if (payload.exp * 1000 < Date.now()) {
              console.error('[Settings] Token expired');
              setIsRefreshing(false);
              router.push('/login');
              return;
            }
          } catch (e) {
            console.error('[Settings] Failed to decode token:', e);
          }
          
          const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          console.log('[Settings] Response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Settings] Error response:', errorText);
            try {
              const errorJson = JSON.parse(errorText);
              console.error('[Settings] Error JSON:', errorJson);
            } catch (e) {
              // JSON解析失敗
            }
            setIsRefreshing(false);
            return;
          }
          
          if (response.ok) {
            const data = await response.json();
            console.log('[Settings] Settings data received:', { 
              lineUserId: data.lineUserId, 
              hasLineUserId: !!data.lineUserId 
            });
            
            setSettings({
              city: data.city || '',
              pref: data.pref || '',
              ageRanges: data.ageRanges || [],
              indoorPreferred: data.indoorPreferred || false,
              notifyEnabled: data.notifyEnabled || false,
            });
            
            const hasLineUserId = data.lineUserId && data.lineUserId !== null && data.lineUserId !== '';
            console.log('[Settings] LINE linked status:', hasLineUserId);
            
            if (hasLineUserId) {
              setLineLinked(true);
              localStorage.setItem('lineUserId', data.lineUserId);
            } else {
              setLineLinked(false);
              localStorage.removeItem('lineUserId');
            }
            
            setIsRefreshing(false);
            // 設定取得成功後にURLパラメータを削除
            router.replace('/settings', { scroll: false });
          } else {
            const errorText = await response.text();
            console.error('[Settings] Failed to fetch settings:', response.status, response.statusText, errorText);
            setIsRefreshing(false);
          }
        } catch (error) {
          console.error('[Settings] Error refreshing settings:', error);
          setIsRefreshing(false);
        }
      };
      
      refreshSettings();
    }
  }, [searchParams, router, isRefreshing]);

  // LINE連携コールバックページから戻ってきた時に設定を再取得
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setSaveError('ログインが必要です');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        // 5秒後に自動的に閉じる
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        const data = await response.json();
        setSaveError(data.error || data.details || '設定の保存に失敗しました');
        setTimeout(() => setSaveError(null), 5000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError('設定の保存に失敗しました');
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-lg">設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4">
      {/* 成功トースト通知 */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 min-w-[300px] border-2 border-green-600">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">設定を保存しました</p>
              <p className="text-sm text-green-100">設定が正常に保存されました</p>
            </div>
            <button
              onClick={() => setSaveSuccess(false)}
              className="flex-shrink-0 text-white hover:text-green-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* エラートースト通知 */}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 min-w-[300px] border-2 border-red-600">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">エラーが発生しました</p>
              <p className="text-sm text-red-100">{saveError}</p>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="flex-shrink-0 text-white hover:text-red-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <FiSettings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  設定
                </h1>
                <p className="text-gray-600 mt-1">イベント検索の設定とLINE通知の設定を行えます</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>

        {/* 通知メッセージ */}
        {saveSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md animate-slide-in">
            <div className="flex items-center">
              <FiCheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <p className="text-green-800 font-medium">設定を保存しました</p>
            </div>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-slide-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiAlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <p className="text-red-800 font-medium">{saveError}</p>
              </div>
              <button onClick={() => setSaveError(null)} className="text-red-500 hover:text-red-700">
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* LINE連携セクション */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
            <div className="flex items-center space-x-3">
              <FiMessageCircle className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">LINE連携</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              週末のおすすめイベントをLINEで受け取れます
            </p>
            
            {lineLinked ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500 rounded-full shadow-lg">
                    <FiCheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">LINE連携済み</p>
                    <p className="text-sm text-gray-600 mt-1">週末のおすすめイベントをLINEで受け取れます</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg mb-1">LINE連携がまだです</p>
                    <p className="text-sm text-gray-600">LINE連携すると、週末のおすすめイベントをLINEで受け取れます</p>
                  </div>
                  <Link 
                    href="/line/link" 
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    <span>LINE連携する</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 検索設定セクション */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-6">
            <div className="flex items-center space-x-3">
              <FiSearch className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">検索設定</h2>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 都道府県 */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FiGlobe className="w-4 h-4 text-primary-600" />
                  <span>都道府県</span>
                </label>
                <select
                  value={settings.pref}
                  onChange={(e) => setSettings({ ...settings, pref: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                >
                  <option value="">すべて</option>
                  <option value="aichi">愛知県</option>
                  <option value="mie">三重県</option>
                  <option value="gifu">岐阜県</option>
                  <option value="shizuoka">静岡県</option>
                </select>
              </div>

              {/* 市 */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <FiMapPin className="w-4 h-4 text-primary-600" />
                  <span>市</span>
                </label>
                <input
                  type="text"
                  placeholder="例: 名古屋市"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-300"
                />
              </div>
            </div>

            {/* 年齢範囲 */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <FiUsers className="w-4 h-4 text-primary-600" />
                <span>対象年齢</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '0-2', label: '0-2歳', icon: '👶' },
                  { value: '3-6', label: '3-6歳', icon: '🧒' },
                  { value: '7-12', label: '7-12歳', icon: '👦' },
                  { value: '13-15', label: '13-15歳', icon: '🧑' },
                  { value: '16+', label: '16歳以上', icon: '👤' },
                ].map((age) => (
                  <label 
                    key={age.value} 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      settings.ageRanges.includes(age.value)
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings.ageRanges.includes(age.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            ageRanges: [...settings.ageRanges, age.value],
                          });
                        } else {
                          setSettings({
                            ...settings,
                            ageRanges: settings.ageRanges.filter((a) => a !== age.value),
                          });
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-lg">{age.icon}</span>
                    <span className="font-medium">{age.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 屋内/屋外 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FiHome className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-gray-700">屋内イベントを優先する</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.indoorPreferred}
                    onChange={(e) => setSettings({ ...settings, indoorPreferred: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-14 h-7 rounded-full transition-all duration-200 ${
                    settings.indoorPreferred ? 'bg-primary-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.indoorPreferred ? 'translate-x-7' : 'translate-x-1'
                    } mt-0.5`}></div>
                  </div>
                </div>
              </label>
            </div>

            {/* 通知設定 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FiBell className={`w-5 h-5 ${lineLinked ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <span className="font-semibold text-gray-700 block">LINE通知を有効にする</span>
                    {!lineLinked && (
                      <span className="text-xs text-gray-500 mt-1 block">LINE連携が必要です</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.notifyEnabled}
                    onChange={(e) => setSettings({ ...settings, notifyEnabled: e.target.checked })}
                    disabled={!lineLinked}
                    className="sr-only"
                  />
                  <div className={`w-14 h-7 rounded-full transition-all duration-200 ${
                    settings.notifyEnabled && lineLinked ? 'bg-purple-500' : 'bg-gray-300'
                  } ${!lineLinked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      settings.notifyEnabled && lineLinked ? 'translate-x-7' : 'translate-x-1'
                    } mt-0.5`}></div>
                  </div>
                </div>
              </label>
            </div>

            {/* 保存ボタン */}
            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button 
                type="submit" 
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <FiSave className="w-5 h-5" />
                <span>設定を保存</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-lg">設定を読み込み中...</p>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
