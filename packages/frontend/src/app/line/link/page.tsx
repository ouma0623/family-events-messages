/**
 * LINE連携ページ
 * LINE Login OAuth認証を開始するページ
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/cognito';

// LINE Login Channel IDは環境変数から取得
// 注意: ユーザーID（Ubf3ee18692c697343a2955dbc0865b14）ではなく、LINE Login Channel ID（数字のみ）を設定してください
const LINE_LOGIN_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;

export default function LineLinkPage(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/login');
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">認証を確認中...</h2>
        </div>
      </div>
    );
  }

  const handleLink = (): void => {
    if (!LINE_LOGIN_CHANNEL_ID) {
      alert('LINE Login Channel IDが設定されていません。\n\nLINE Developersコンソールの「LINE Login」チャネルの「基本情報」タブから「チャネルID」を確認し、環境変数 NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID に設定してください。\n\n注意: ユーザーIDではなく、Channel ID（数字のみ）を設定してください。');
      return;
    }
    
    // Channel IDが数字のみか確認（ユーザーIDと混同していないかチェック）
    if (!/^\d+$/.test(LINE_LOGIN_CHANNEL_ID)) {
      alert('LINE Login Channel IDの形式が正しくありません。\n\nLINE Login Channel IDは数字のみの文字列です。\nLINE Developersコンソールで正しいChannel IDを確認してください。');
      return;
    }

    setLoading(true);

    // stateパラメータを生成（CSRF対策）
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('line_oauth_state', state);

    // LINE Login認証URL
    const redirectUri = encodeURIComponent('https://web.oumasan.org/line/callback');
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code&` +
      `client_id=${LINE_LOGIN_CHANNEL_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `state=${state}&` +
      `scope=profile%20openid%20email`;

    // LINE Login認証ページにリダイレクト
    window.location.href = lineLoginUrl;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors duration-200"
        >
          <span className="mr-2">←</span>
          <span>設定ページに戻る</span>
        </Link>
      </div>

      <div className="card">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💬</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">LINE連携</h1>
          <p className="text-gray-600">
            週末のおすすめイベントをLINEで受け取れます
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">📋 LINE連携のメリット</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>毎週金曜19時に週末のおすすめイベントを通知</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>あなたの設定（都道府県、年齢範囲など）に合わせたイベントを提案</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>LINEアプリで簡単にイベント詳細を確認</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLink}
            disabled={loading || !LINE_LOGIN_CHANNEL_ID}
            className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                処理中...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">💬</span>
                LINEで連携する
              </span>
            )}
          </button>

          {!LINE_LOGIN_CHANNEL_ID && (
            <p className="text-sm text-red-600 text-center">
              LINE Login Channel IDが設定されていません。管理者にお問い合わせください。
            </p>
          )}

          <div className="text-sm text-gray-500 text-center">
            <p>LINE連携ボタンをクリックすると、LINE Login認証ページに移動します。</p>
            <p>LINEアカウントでログインすると、自動的に連携が完了します。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
