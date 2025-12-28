/**
 * Cognito認証ユーティリティ
 */

import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'ap-northeast-1_haKWQuUi2',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '1koi5j5f5vnedhnccibv14nh5p',
};

export const userPool = new CognitoUserPool(poolData);

/**
 * サインイン
 */
export async function signIn(email: string, password: string): Promise<{ idToken: string; userId: string }> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const userId = result.getIdToken().payload.sub;
        localStorage.setItem('cognito_token', idToken);
        localStorage.setItem('cognito_user_id', userId);
        resolve({ idToken, userId });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * サインアップ
 */
export async function signUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attributeList: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    userPool.signUp(email, password, attributeList, [], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): Promise<CognitoUser | null> {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((err: any, session: any) => {
        if (err || !session.isValid()) {
          resolve(null);
        } else {
          resolve(cognitoUser);
        }
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * IDトークンを取得
 */
export async function getIdToken(): Promise<string | null> {
  const cognitoUser = await getCurrentUser();
  if (!cognitoUser) {
    return null;
  }

  return new Promise((resolve) => {
    cognitoUser.getSession((err: any, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
      } else {
        resolve(session.getIdToken().getJwtToken());
      }
    });
  });
}

/**
 * ユーザーIDを取得
 */
export async function getUserId(): Promise<string | null> {
  const cognitoUser = await getCurrentUser();
  if (!cognitoUser) {
    return null;
  }

  return new Promise((resolve) => {
    cognitoUser.getSession((err: any, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
      } else {
        resolve(session.getIdToken().payload.sub);
      }
    });
  });
}

/**
 * サインアップ確認
 */
export async function confirmSignUp(email: string, confirmationCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(confirmationCode, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * サインアウト
 */
export function signOut(): void {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('cognito_token');
  localStorage.removeItem('cognito_user_id');
  localStorage.removeItem('lineUserId');
}

/**
 * ログイン状態を確認
 */
export async function isAuthenticated(): Promise<boolean> {
  const cognitoUser = await getCurrentUser();
  return cognitoUser !== null;
}

