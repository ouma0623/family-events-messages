/**
 * イベントカードコンポーネント
 */

import { EventNormalized } from '@ouma-family-event/common';
import Link from 'next/link';
import Image from 'next/image';

// デフォルト画像（プレースホルダー）
const DEFAULT_EVENT_IMAGE = 'https://via.placeholder.com/400x300?text=Event+Image';

export function EventCard({ event }: { event: EventNormalized }) {
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  
  // WalkerPlusイベントの特徴を表示
  const isWalkerPlus = event.sourceId === 'S8_WALKERPLUS';
  const isShortEvent = event.durationDays !== undefined && event.durationDays <= 3;

  // 画像URLを取得（最初の画像、なければデフォルト）
  const imageUrl = event.imageUrls && event.imageUrls.length > 0 
    ? event.imageUrls[0] 
    : DEFAULT_EVENT_IMAGE;

  return (
    <Link href={`/events?id=${event.eventId}`} className="block">
      <div className="card hover:scale-[1.02] transition-transform duration-200 h-full">
        {/* 画像サムネイル */}
        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              // 画像読み込みエラー時はデフォルト画像にフォールバック
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_EVENT_IMAGE) {
                target.src = DEFAULT_EVENT_IMAGE;
              }
            }}
          />
        </div>

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

        {/* カテゴリ */}
        {event.categories && event.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
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
      </div>
    </Link>
  );
}
