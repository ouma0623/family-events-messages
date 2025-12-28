/**
 * LINE Login コールバックページ
 * LINE Login認証後のコールバックを受け取り、認証コードをAPIに送信
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getIdToken, isAuthenticated } from '@/lib/cognito';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.oumasan.org/v1';

function LineCallbackContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setStatus('error');
        setMessage('ログインが必要です。先にログインしてください。');
        return;
      }
      await processLineCallback();
    };

    const processLineCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');

    // エラーチェック
    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'LINE認証に失敗しました');
      return;
    }

    // 認証コードがない場合
    if (!code) {
      setStatus('error');
      setMessage('認証コードが取得できませんでした');
      return;
    }

      // stateパラメータを検証（CSRF対策）
      const savedState = localStorage.getItem('line_oauth_state');
      
      if (state !== savedState) {
        setStatus('error');
        setMessage('認証エラーが発生しました。もう一度お試しください。');
        return;
      }
      
      // stateを削除
      localStorage.removeItem('line_oauth_state');

      try {
        const idToken = await getIdToken();
        if (!idToken) {
          setStatus('error');
          setMessage('ログインが必要です。先にログインしてください。');
          return;
        }

        // LINE連携APIを呼び出し（Cognito認証が必要）
        const response = await fetch(`${API_BASE_URL}/line/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ code }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[LINE Callback] LINE link successful:', { 
            lineUserId: data.lineUserId, 
            userId: data.userId 
          });
          
          // lineUserIdをセッション管理用に保存
          if (data.lineUserId) {
            localStorage.setItem('lineUserId', data.lineUserId);
            console.log('[LINE Callback] Saved lineUserId to localStorage');
          }
          
          setStatus('success');
          setMessage('LINE連携が完了しました！週末のおすすめイベントをLINEで受け取れます。');
          
          // 設定ページに遷移する際に連携完了フラグを付与（少し待ってから遷移）
          setTimeout(() => {
            console.log('[LINE Callback] Redirecting to settings page...');
            // router.pushを使う（window.location.hrefだとセッションが失われる可能性がある）
            router.push('/settings?lineLinked=true');
          }, 2000);
        } else {
          // エラーレスポンスの詳細を取得
          let errorMessage = 'LINE連携に失敗しました';
          try {
            const data = await response.json();
            errorMessage = data.details || data.error || `エラー: ${response.status} ${response.statusText}`;
            console.error('LINE連携APIエラー:', {
              status: response.status,
              statusText: response.statusText,
              data: data,
            });
          } catch (e) {
            errorMessage = `エラー: ${response.status} ${response.statusText}`;
            console.error('LINE連携APIエラー（JSON解析失敗）:', response.status, response.statusText);
          }
          setStatus('error');
          setMessage(errorMessage);
        }
      } catch (error: any) {
        console.error('Failed to link LINE:', error);
        setStatus('error');
        const errorMessage = error.message || 'LINE連携に失敗しました。もう一度お試しください。';
        setMessage(`エラーが発生しました: ${errorMessage}`);
      }
    };

    checkAuth();
  }, [searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">LINE連携を処理中...</h2>
          <p className="text-gray-500">少々お待ちください</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">LINE連携が完了しました！</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/settings?lineLinked=true" className="btn-primary">
              設定ページに戻る
            </Link>
            <Link href="/" className="btn-secondary">
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">LINE連携に失敗しました</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/settings" className="btn-primary">
            設定ページに戻る
          </Link>
          <Link href="/line/link" className="btn-secondary">
            もう一度試す
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LineCallbackPage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">読み込み中...</h2>
        </div>
      </div>
    }>
      <LineCallbackContent />
    </Suspense>
  );
}
