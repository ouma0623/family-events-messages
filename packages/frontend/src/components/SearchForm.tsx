/**
 * 検索フォームコンポーネント
 */

'use client';

import { useState, FormEvent } from 'react';

export interface SearchFormData {
  city?: string;
  pref?: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  keyword?: string;
}

export function SearchForm({ onSearch }: { onSearch: (data: SearchFormData) => void }) {
  const [formData, setFormData] = useState<SearchFormData>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleReset = () => {
    setFormData({});
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-8">
      <h3 className="text-xl font-bold mb-6 text-gray-900">検索条件</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* キーワード検索 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 キーワード
          </label>
          <input
            type="text"
            placeholder="イベント名、会場名など"
            value={formData.keyword || ''}
            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
            className="input-field"
          />
        </div>

        {/* 市 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏙️ 市
          </label>
          <input
            type="text"
            placeholder="例: 名古屋市"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="input-field"
          />
        </div>

        {/* 都道府県 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🗾 都道府県
          </label>
          <select
            value={formData.pref || ''}
            onChange={(e) => setFormData({ ...formData, pref: e.target.value })}
            className="input-field"
          >
            <option value="">すべて</option>
            <option value="aichi">愛知県</option>
            <option value="mie">三重県</option>
            <option value="gifu">岐阜県</option>
            <option value="shizuoka">静岡県</option>
          </select>
        </div>

        {/* 開始日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 開始日
          </label>
          <input
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="input-field"
          />
        </div>

        {/* 終了日 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 終了日
          </label>
          <input
            type="date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary"
        >
          リセット
        </button>
        <button type="submit" className="btn-primary">
          検索する
        </button>
      </div>
    </form>
  );
}
