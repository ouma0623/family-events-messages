/**
 * 検索フォームコンポーネント（タグ選択式）
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { classifyCategory, MajorGenre } from '@ouma-family-event/common';
import { searchEvents } from '../lib/api';
import { EventNormalized } from '@ouma-family-event/common';

export interface SearchFormData {
  city?: string;
  pref?: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  isFree?: boolean | null;
  keyword?: string;
}

interface CategoryGroup {
  majorGenre: MajorGenre;
  categories: string[];
}

export function SearchForm({ onSearch }: { onSearch: (data: SearchFormData) => void }) {
  const [formData, setFormData] = useState<SearchFormData>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedMajorGenres, setSelectedMajorGenres] = useState<Set<MajorGenre>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isFree, setIsFree] = useState<boolean | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // 利用可能なカテゴリを取得
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        // 全件検索（制限付き）でカテゴリを取得
        const result = await searchEvents({ limit: 100 });
        const categoriesSet = new Set<string>();
        
        result.items.forEach((event: EventNormalized) => {
          if (event.categories) {
            event.categories.forEach((cat) => categoriesSet.add(cat));
          }
        });

        const categories = Array.from(categoriesSet).sort();
        setAvailableCategories(categories);

        // 大ジャンルごとにグループ化
        const groups: CategoryGroup[] = [
          { majorGenre: '食べる', categories: [] },
          { majorGenre: '遊ぶ', categories: [] },
          { majorGenre: '見る・学ぶ', categories: [] },
        ];

        categories.forEach((category) => {
          const classification = classifyCategory(category);
          const group = groups.find((g) => g.majorGenre === classification.majorGenre);
          if (group) {
            group.categories.push(classification.minorGenre);
          }
        });

        setCategoryGroups(groups);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const searchData: SearchFormData = {
      ...formData,
      categories: selectedCategories.size > 0 ? Array.from(selectedCategories) : undefined,
      isFree: isFree !== null ? isFree : undefined,
    };
    onSearch(searchData);
  };

  const handleReset = () => {
    setFormData({});
    setSelectedMajorGenres(new Set());
    setSelectedCategories(new Set());
    setIsFree(null);
    onSearch({});
  };

  const toggleMajorGenre = (genre: MajorGenre) => {
    const newSelected = new Set(selectedMajorGenres);
    if (newSelected.has(genre)) {
      newSelected.delete(genre);
      // 大ジャンルを解除したら、その大ジャンルのカテゴリも解除
      const group = categoryGroups.find((g) => g.majorGenre === genre);
      if (group) {
        const newCategories = new Set(selectedCategories);
        group.categories.forEach((cat) => newCategories.delete(cat));
        setSelectedCategories(newCategories);
      }
    } else {
      newSelected.add(genre);
    }
    setSelectedMajorGenres(newSelected);
  };

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
      // カテゴリを選択したら、その大ジャンルも選択
      const classification = classifyCategory(category);
      const newMajorGenres = new Set(selectedMajorGenres);
      newMajorGenres.add(classification.majorGenre);
      setSelectedMajorGenres(newMajorGenres);
    }
    setSelectedCategories(newSelected);
  };

  const getGenreColor = (genre: MajorGenre): string => {
    switch (genre) {
      case '食べる':
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
      case '遊ぶ':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      case '見る・学ぶ':
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
    }
  };

  const getGenreSelectedColor = (genre: MajorGenre): string => {
    switch (genre) {
      case '食べる':
        return 'bg-orange-500 text-white border-orange-600 shadow-md';
      case '遊ぶ':
        return 'bg-blue-500 text-white border-blue-600 shadow-md';
      case '見る・学ぶ':
        return 'bg-purple-500 text-white border-purple-600 shadow-md';
      default:
        return 'bg-gray-500 text-white border-gray-600 shadow-md';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-8 bg-gradient-to-br from-white to-gray-50 shadow-lg">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
        <span className="mr-2">🔍</span>
        検索条件
      </h3>
      
      <div className="space-y-8">
        {/* 大ジャンル選択 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            📚 大ジャンル
          </label>
          <div className="flex flex-wrap gap-3">
            {categoryGroups.map((group) => (
              <button
                key={group.majorGenre}
                type="button"
                onClick={() => toggleMajorGenre(group.majorGenre)}
                className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 transform hover:scale-105 ${
                  selectedMajorGenres.has(group.majorGenre)
                    ? getGenreSelectedColor(group.majorGenre)
                    : getGenreColor(group.majorGenre)
                }`}
              >
                {group.majorGenre}
                {group.categories.length > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    ({group.categories.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 小ジャンル（カテゴリ）選択 */}
        {selectedMajorGenres.size > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              🏷️ 小ジャンル（カテゴリ）
            </label>
            <div className="space-y-4">
              {categoryGroups
                .filter((group) => selectedMajorGenres.has(group.majorGenre))
                .map((group) => (
                  <div key={group.majorGenre}>
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      {group.majorGenre}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                            selectedCategories.has(category)
                              ? 'bg-primary-500 text-white border-primary-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 無料・有料選択 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            💰 料金
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsFree(isFree === true ? null : true)}
              className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 transform hover:scale-105 ${
                isFree === true
                  ? 'bg-green-500 text-white border-green-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
              }`}
            >
              💰 無料
            </button>
            <button
              type="button"
              onClick={() => setIsFree(isFree === false ? null : false)}
              className={`px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200 transform hover:scale-105 ${
                isFree === false
                  ? 'bg-yellow-500 text-white border-yellow-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50'
              }`}
            >
              💵 有料
            </button>
          </div>
        </div>

        {/* その他の検索条件 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          {/* 市 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏙️ 市
            </label>
            <input
              type="text"
              placeholder="例: 名古屋市"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input-field w-full"
            />
          </div>

          {/* 都道府県 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🗾 都道府県
            </label>
            <select
              value={formData.pref || ''}
              onChange={(e) => setFormData({ ...formData, pref: e.target.value })}
              className="input-field w-full"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 開始日
            </label>
            <input
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="input-field w-full"
            />
          </div>

          {/* 終了日 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 終了日
            </label>
            <input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
        >
          リセット
        </button>
        <button
          type="submit"
          className="btn-primary px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          検索する
        </button>
      </div>

      {/* ローディング表示 */}
      {loadingCategories && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          カテゴリを読み込み中...
        </div>
      )}
    </form>
  );
}
