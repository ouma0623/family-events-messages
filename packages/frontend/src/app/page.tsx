/**
 * トップページ
 * 02_BASIC_DESIGN.md セクション2 に準拠
 */

'use client';

import { useEffect, useState } from 'react';
import { EventNormalized } from '@ouma-family-event/common';
import { EventList } from '../components/EventList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getWeekendEvents, searchEvents, getUserSettings } from '../lib/api';
import { isAuthenticated } from '../lib/cognito';
import Link from 'next/link';
import { 
  FiCalendar, 
  FiStar, 
  FiLock, 
  FiSearch, 
  FiSettings, 
  FiEdit3, 
  FiInbox,
  FiZap
} from 'react-icons/fi';

type ViewMode = 'today' | 'tomorrow' | 'thisWeekend' | 'nextWeekend';

export default function HomePage() {
  const [todayEvents, setTodayEvents] = useState<EventNormalized[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<EventNormalized[]>([]);
  const [weekendEvents, setWeekendEvents] = useState<EventNormalized[]>([]);
  const [nextWeekendEvents, setNextWeekendEvents] = useState<EventNormalized[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPref, setUserPref] = useState<string>('');
  const [userCity, setUserCity] = useState<string>('');
  const [hasSettings, setHasSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  useEffect(() => {
    // ログイン状態を確認
    isAuthenticated().then(async (authenticated) => {
      setIsLoggedIn(authenticated);
      
      if (authenticated) {
        // ユーザー設定を取得
        const settings = await getUserSettings();
        if (settings && settings.pref) {
          setUserPref(settings.pref);
          setUserCity(settings.city || '');
          setHasSettings(true);
          
          // 設定に基づいてイベントを取得
          await loadEvents(settings.pref, settings.city || '', settings.ageRanges || [], settings.indoorPreferred || false);
        } else {
          setHasSettings(false);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadEvents = async (pref: string, city: string, ageRanges: string[], indoorPreferred: boolean) => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // 今週末の日付を計算（今週の土曜日）
      // 今日が土曜日以降の場合は来週の週末、それ以外は今週の週末
      const thisSaturday = new Date(today);
      const dayOfWeek = today.getDay(); // 0=日曜日, 6=土曜日
      let daysUntilSaturday: number;
      if (dayOfWeek === 0) {
        // 日曜日の場合は今週の土曜日（昨日）ではなく、来週の土曜日
        daysUntilSaturday = 6;
      } else if (dayOfWeek === 6) {
        // 土曜日の場合は今日
        daysUntilSaturday = 0;
      } else {
        // 月曜日〜金曜日は今週の土曜日まで
        daysUntilSaturday = 6 - dayOfWeek;
      }
      thisSaturday.setDate(today.getDate() + daysUntilSaturday);
      const thisWeekendStr = thisSaturday.toISOString().split('T')[0];

      // 翌週末の日付を計算（来週の土曜日）
      const nextSaturday = new Date(thisSaturday);
      nextSaturday.setDate(nextSaturday.getDate() + 7);
      const nextWeekendStr = nextSaturday.toISOString().split('T')[0];
      
      console.log('[loadEvents] Today:', todayStr, 'Day of week:', dayOfWeek);
      console.log('[loadEvents] This weekend (Saturday):', thisWeekendStr);
      console.log('[loadEvents] Next weekend (Saturday):', nextWeekendStr);

      // 今日のイベントを取得
      const todayData = await searchEvents({ 
        from: todayStr, 
        to: todayStr,
        pref,
        city: city || undefined,
      });
      setTodayEvents(todayData.items);

      // 明日のイベントを取得
      const tomorrowData = await searchEvents({ 
        from: tomorrowStr, 
        to: tomorrowStr,
        pref,
        city: city || undefined,
      });
      setTomorrowEvents(tomorrowData.items);

      // 今週末のイベントを取得
      const weekendData = await getWeekendEvents({
        pref,
        city: city || undefined,
        ageRanges,
        indoorPreferred,
        weekendOf: thisWeekendStr,
      });
      setWeekendEvents(weekendData.items);

      // 翌週末のイベントを取得
      const nextWeekendData = await getWeekendEvents({
        pref,
        city: city || undefined,
        ageRanges,
        indoorPreferred,
        weekendOf: nextWeekendStr,
      });
      setNextWeekendEvents(nextWeekendData.items);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const getCurrentEvents = (): EventNormalized[] => {
    switch (viewMode) {
      case 'today':
        return todayEvents;
      case 'tomorrow':
        return tomorrowEvents;
      case 'thisWeekend':
        return weekendEvents;
      case 'nextWeekend':
        return nextWeekendEvents;
      default:
        return todayEvents;
    }
  };

  const getCurrentTitle = (): string => {
    switch (viewMode) {
      case 'today':
        return '今日のイベント';
      case 'tomorrow':
        return '明日のイベント';
      case 'thisWeekend':
        return '今週末のおすすめ';
      case 'nextWeekend':
        return '翌週末のおすすめ';
      default:
        return '今日のイベント';
    }
  };

  const getCurrentCount = (): number => {
    return getCurrentEvents().length;
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  // ログインしていない場合
  if (!isLoggedIn) {
    return (
      <div className="space-y-12">
        {/* ヒーローセクション */}
        <div className="relative overflow-hidden text-center py-20 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="inline-block mb-6 p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
              <FiZap className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              家族で楽しむイベントを探そう
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 drop-shadow-md">
              愛知県の家族向け・子供向けイベントを簡単に検索
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/login" 
                className="flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 hover:bg-gray-50 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
              >
                <FiLock className="w-5 h-5" />
                <span>ログイン / 会員登録</span>
              </Link>
              <Link 
                href="/events" 
                className="flex items-center space-x-2 px-8 py-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-white/30"
              >
                <FiSearch className="w-5 h-5" />
                <span>イベントを検索する</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 登録を促すメッセージ */}
        <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <FiEdit3 className="w-16 h-16 text-yellow-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              イベントを見るには登録が必要です
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              ログインして、お住まいの県を登録すると、<br />
              あなたに合ったイベントをおすすめします
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <FiLock className="w-5 h-5" />
              <span>ログイン / 会員登録</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ログインしているが設定がない場合
  if (!hasSettings) {
    return (
      <div className="space-y-12">
        {/* ヒーローセクション */}
        <div className="relative overflow-hidden text-center py-20 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="inline-block mb-6 p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
              <FiZap className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              家族で楽しむイベントを探そう
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 drop-shadow-md">
              愛知県の家族向け・子供向けイベントを簡単に検索
            </p>
          </div>
        </div>

        {/* 設定を促すメッセージ */}
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <FiSettings className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              イベントを見るには県の登録が必要です
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              設定画面で、お住まいの県を登録してください。<br />
              登録すると、あなたに合ったイベントをおすすめします
            </p>
            <Link 
              href="/settings" 
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <FiSettings className="w-5 h-5" />
              <span>設定画面へ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ログイン済みで設定がある場合
  return (
    <div className="space-y-12">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden text-center py-20 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="inline-block mb-6 p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
              <FiZap className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            家族で楽しむイベントを探そう
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-white/90 drop-shadow-md">
            {userPref === 'aichi' ? '愛知県' : userPref === 'mie' ? '三重県' : userPref === 'gifu' ? '岐阜県' : userPref === 'shizuoka' ? '静岡県' : '愛知県'}の家族向け・子供向けイベントを簡単に検索
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/events" 
              className="flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 hover:bg-gray-50 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
            >
              <FiSearch className="w-5 h-5" />
              <span>イベントを検索する</span>
            </Link>
            <Link 
              href="/settings" 
              className="flex items-center space-x-2 px-8 py-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 border-2 border-white/30"
            >
              <FiSettings className="w-5 h-5" />
              <span>設定・LINE連携</span>
            </Link>
          </div>
        </div>
      </div>

      {/* イベント表示セクション */}
      <section className="animate-fade-in">
        {/* ビューモード切り替えボタン */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => handleViewModeChange('today')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
              viewMode === 'today'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <FiCalendar className="w-5 h-5" />
            <span>今日</span>
          </button>
          <button
            onClick={() => handleViewModeChange('tomorrow')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
              viewMode === 'tomorrow'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <FiCalendar className="w-5 h-5" />
            <span>明日</span>
          </button>
          <button
            onClick={() => handleViewModeChange('thisWeekend')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
              viewMode === 'thisWeekend'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <FiStar className="w-5 h-5" />
            <span>今週末</span>
          </button>
          <button
            onClick={() => handleViewModeChange('nextWeekend')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
              viewMode === 'nextWeekend'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            <FiStar className="w-5 h-5" />
            <span>翌週末</span>
          </button>
        </div>

        {/* イベントタイトルと件数 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl shadow-lg ${
              viewMode === 'today' || viewMode === 'tomorrow'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {viewMode === 'today' ? (
                <FiCalendar className="w-8 h-8 text-white" />
              ) : viewMode === 'tomorrow' ? (
                <FiCalendar className="w-8 h-8 text-white" />
              ) : (
                <FiStar className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {getCurrentTitle()}
            </h2>
          </div>
          {getCurrentCount() > 0 && (
            <span className="badge-primary text-lg px-4 py-2">
              {getCurrentCount()}件
            </span>
          )}
        </div>

        {/* イベントリスト */}
        {getCurrentEvents().length > 0 ? (
          <EventList events={getCurrentEvents()} />
        ) : (
          <div className={`card text-center py-16 ${
            viewMode === 'today' || viewMode === 'tomorrow'
              ? 'bg-gradient-to-br from-gray-50 to-blue-50'
              : 'bg-gradient-to-br from-purple-50 to-pink-50'
          }`}>
            <div className="flex justify-center mb-4">
              <FiInbox className={`w-16 h-16 ${
                viewMode === 'today' || viewMode === 'tomorrow'
                  ? 'text-blue-400'
                  : 'text-purple-400'
              }`} />
            </div>
            <p className="text-gray-600 text-xl font-medium mb-4">
              {viewMode === 'today' ? '今日開催のイベントはありません' :
               viewMode === 'tomorrow' ? '明日開催のイベントはありません' :
               viewMode === 'thisWeekend' ? '今週末のおすすめイベントはありません' :
               '翌週末のおすすめイベントはありません'}
            </p>
            <Link 
              href="/events" 
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <span>他の日付を検索する</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
