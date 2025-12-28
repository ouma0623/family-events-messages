/**
 * イベントカードコンポーネント
 */

import { EventNormalized } from '@ouma-family-event/common';
import Link from 'next/link';

export function EventCard({ event }: { event: EventNormalized }) {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  
  // WalkerPlusイベントの特徴を表示
  const isWalkerPlus = event.sourceId === 'S8_WALKERPLUS';
  const isShortEvent = event.durationDays !== undefined && event.durationDays <= 3;

  return (
    <Link href={`/events?id=${event.eventId}`} className="block">
      <div className="card hover:scale-[1.02] transition-transform duration-200 h-full">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1 mr-4">
            {event.title}
          </h3>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {event.isFree === true && (
              <span className="badge-success">
                💰 無料
              </span>
            )}
            {isShortEvent && (
              <span className="badge-primary text-xs">
                ⚡ {event.durationDays}日間
              </span>
            )}
            {isWalkerPlus && (
              <span className="badge-gray text-xs">
                WalkerPlus
              </span>
            )}
          </div>
        </div>

        {/* 説明 */}
        {event.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* 日付 */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <span className="mr-2">📅</span>
          <span>
            {isSameDay
              ? startDate.toLocaleDateString('ja-JP', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })
              : `${startDate.toLocaleDateString('ja-JP')} 〜 ${endDate.toLocaleDateString('ja-JP')}`}
          </span>
        </div>

        {/* 会場情報 */}
        <div className="space-y-2 mb-4">
          {event.venueName && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">📍</span>
              <span className="line-clamp-1">{event.venueName}</span>
            </div>
          )}
          {event.venueCity && event.venueCity !== 'unknown' && (
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-2">🏙️</span>
              <span>{event.venueCity}</span>
            </div>
          )}
        </div>

        {/* カテゴリとおすすめ度 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {event.categories && event.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.categories.slice(0, 2).map((category, idx) => (
                <span key={idx} className="badge-gray text-xs">
                  {category}
                </span>
              ))}
              {event.categories.length > 2 && (
                <span className="badge-gray text-xs">
                  +{event.categories.length - 2}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">おすすめ度</span>
            <span className="text-sm font-bold text-primary-600">
              {event.recommendScore}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
