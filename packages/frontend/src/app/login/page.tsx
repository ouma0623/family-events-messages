/**
 * ログイン/会員作成ページ
 */

'use client';

import { useState, FormEvent } from 'react';
import { signIn, signUp, confirmSignUp } from '@/lib/cognito';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (needsConfirmation) {
        // 確認コードでサインアップを完了
        await confirmSignUp(email, confirmationCode);
        alert('アカウントの確認が完了しました。ログインしてください。');
        setNeedsConfirmation(false);
        setIsSignUp(false);
        setPassword('');
        setConfirmationCode('');
      } else if (isSignUp) {
        // サインアップ
        await signUp(email, password);
        setNeedsConfirmation(true);
        setError('');
      } else {
        // ログイン
        await signIn(email, password);
        router.push('/settings');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorMessage = err.message || err.code || 'エラーが発生しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors duration-200"
        >
          <span className="mr-2">←</span>
          <span>ホームに戻る</span>
        </Link>
      </div>

      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h1>
          <p className="text-gray-600">
            {isSignUp
              ? 'アカウントを作成して、イベント通知を受け取ろう'
              : 'ログインして、イベント通知を受け取ろう'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {needsConfirmation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-semibold mb-2">
              確認コードを送信しました
            </p>
            <p className="text-blue-700 text-sm">
              {email} に送信された確認コードを入力してください
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
              placeholder="example@email.com"
              disabled={needsConfirmation}
            />
          </div>
          {!needsConfirmation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                placeholder="パスワードを入力"
                minLength={8}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  パスワードは8文字以上、数字を含む必要があります
                </p>
              )}
            </div>
          )}
          {needsConfirmation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                確認コード
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="input-field"
                required
                placeholder="6桁の確認コードを入力"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                メールに送信された6桁の確認コードを入力してください
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⏳</span>
                処理中...
              </span>
            ) : needsConfirmation ? (
              '確認コードを送信'
            ) : isSignUp ? (
              'アカウントを作成'
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        {!needsConfirmation && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setPassword('');
              }}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {isSignUp ? '既にアカウントをお持ちの方はログイン' : 'アカウントを作成'}
            </button>
          </div>
        )}
        {needsConfirmation && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setNeedsConfirmation(false);
                setError('');
                setConfirmationCode('');
              }}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              確認コードを再送信する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

