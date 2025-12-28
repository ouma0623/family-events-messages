/**
 * イベント一覧コンポーネント
 */

import { EventNormalized } from '@ouma-family-event/common';
import { EventCard } from './EventCard';

export function EventList({ events }: { events: EventNormalized[] }) {
  if (events.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-500 text-lg mb-2">イベントが見つかりませんでした</p>
        <p className="text-gray-400 text-sm">検索条件を変更してお試しください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.eventId} event={event} />
      ))}
    </div>
  );
}
