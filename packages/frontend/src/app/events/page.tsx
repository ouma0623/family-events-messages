/**
 * イベント検索・詳細ページ
 * クエリパラメータ `id` がある場合は詳細を表示、ない場合は検索画面を表示
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventNormalized } from '@ouma-family-event/common';
import { SearchForm, SearchFormData } from '../../components/SearchForm';
import { EventList } from '../../components/EventList';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { searchEvents, getEventById } from '../../lib/api';
import Link from 'next/link';

function EventsPageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  
  const [events, setEvents] = useState<EventNormalized[]>([]);
  const [event, setEvent] = useState<EventNormalized | null>(null);
  const [loading, setLoading] = useState(false);

  // イベント詳細を取得
  useEffect(() => {
    if (eventId) {
      setLoading(true);
      getEventById(eventId)
        .then(setEvent)
        .catch((error) => {
          console.error('Failed to fetch event:', error);
          setEvent(null);
        })
        .finally(() => setLoading(false));
    } else {
      setEvent(null);
    }
  }, [eventId]);

  const handleSearch = async (query: SearchFormData) => {
    setLoading(true);
    try {
      const data = await searchEvents({
        city: query.city,
        pref: query.pref,
        from: query.startDate,
        to: query.endDate,
        categories: query.categories,
        keyword: query.keyword,
      });
      setEvents(data.items);
    } catch (error) {
      console.error('Search failed:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // イベント詳細表示
  if (eventId) {
    if (loading) {
      return <LoadingSpinner size="lg" />;
    }

    if (!event) {
      return (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">イベントが見つかりませんでした</h2>
          <p className="text-gray-500 mb-6">指定されたイベントは存在しないか、削除された可能性があります。</p>
          <Link href="/events" className="btn-primary inline-block">
            検索画面に戻る
          </Link>
        </div>
      );
    }

    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);
    const isSameDay = startDate.toDateString() === endDate.toDateString();

    return (
      <div className="max-w-4xl mx-auto">
        {/* 戻るボタン */}
        <Link
          href="/events"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 transition-colors duration-200"
        >
          <span className="mr-2">←</span>
          <span>検索画面に戻る</span>
        </Link>

        {/* メインコンテンツ */}
        <div className="card">
          {/* ヘッダー */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex-1 mr-4">
                {event.title}
              </h1>
              {event.isFree === true && (
                <span className="badge-success flex-shrink-0">
                  💰 無料
                </span>
              )}
            </div>
            
            {/* おすすめ度 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">おすすめ度</span>
                <span className="text-xl font-bold text-primary-600">
                  {event.recommendScore}
                </span>
              </div>
              {event.categories && event.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((category, idx) => (
                    <span key={idx} className="badge-primary">
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 説明 */}
          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">📝 イベント概要</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* 開催情報 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📅 開催情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">開催期間</div>
                <div className="text-lg font-semibold text-gray-900">
                  {isSameDay
                    ? startDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })
                    : `${startDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} 〜 ${endDate.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}`}
                </div>
              </div>
              
              {event.timeText && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">時間</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {event.timeText}
                  </div>
                </div>
              )}
              
              {/* WalkerPlusイベントの追加情報 */}
              {event.sourceId === 'S8_WALKERPLUS' && event.durationDays !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">開催期間</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {event.durationDays}日間
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 会場情報 */}
          {(event.venueName || event.venueAddress || (event.venueCity && event.venueCity !== 'unknown')) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📍 会場情報</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {event.venueName && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">会場名</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {event.venueName}
                    </div>
                  </div>
                )}
                {event.venueAddress && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">住所</div>
                    <div className="text-gray-700">{event.venueAddress}</div>
                  </div>
                )}
                {event.venueCity && event.venueCity !== 'unknown' && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">場所</div>
                    <div className="text-gray-700">{event.venueCity}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 料金 */}
          {event.priceText && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💵 料金</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-lg text-gray-900">{event.priceText}</p>
              </div>
            </div>
          )}

          {/* アクセス情報 */}
          {event.accessText && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🚃 アクセス</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{event.accessText}</p>
              </div>
            </div>
          )}

          {/* 駐車場情報 */}
          {event.parkingText && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🅿️ 駐車場</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{event.parkingText}</p>
              </div>
            </div>
          )}

          {/* 申込期間 */}
          {(event.applyStartAt || event.applyEndAt) && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📞 申込期間</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                {event.applyStartAt && (
                  <p className="text-gray-700">
                    開始: {new Date(event.applyStartAt).toLocaleDateString('ja-JP')}
                  </p>
                )}
                {event.applyEndAt && (
                  <p className="text-gray-700">
                    終了: {new Date(event.applyEndAt).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 電話番号 */}
          {event.contactTel && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📞 お問い合わせ</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <a href={`tel:${event.contactTel}`} className="text-primary-600 hover:text-primary-700">
                    {event.contactTel}
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* 外部リンク */}
          {event.url && (
            <div className="pt-6 border-t border-gray-200">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center"
              >
                <span className="mr-2">🔗</span>
                <span>公式サイトで詳細を見る</span>
                <span className="ml-2">→</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // イベント検索画面
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          🔍 イベント検索
        </h1>
        <p className="text-gray-600">
          条件を指定して、お気に入りのイベントを見つけましょう
        </p>
      </div>
      
      <SearchForm onSearch={handleSearch} />
      
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : events.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              検索結果
            </h2>
            <span className="badge-primary">
              {events.length}件
            </span>
          </div>
          <EventList events={events} />
        </div>
      ) : null}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <EventsPageContent />
    </Suspense>
  );
}
