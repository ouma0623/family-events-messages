/**
 * EC2インスタンス起動用Lambda関数
 * EventBridgeから呼び出され、EC2スポットインスタンスを起動する
 */

import { EC2Client, RunInstancesCommand } from '@aws-sdk/client-ec2';
import { EventBridgeEvent } from 'aws-lambda';

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });

interface Ec2LaunchEvent extends EventBridgeEvent<'Scheduled Event', any> {}

export async function handler(event: Ec2LaunchEvent) {
  const batchType = process.env.BATCH_TYPE || 'weekly-ingest';
  const instanceType = process.env.INSTANCE_TYPE || 't3.micro';
  const amiId = process.env.AMI_ID || 'ami-0c3fd0f5d33134a76'; // Amazon Linux 2023 (ap-northeast-1)
  const securityGroupId = process.env.SECURITY_GROUP_ID!;
  const subnetId = process.env.SUBNET_ID!;
  const iamRoleArn = process.env.IAM_ROLE_ARN!;

  console.log(`EC2インスタンスを起動します: batchType=${batchType}, instanceType=${instanceType}`);

  // User Dataスクリプトを生成
  const userDataScript = getUserDataScript(batchType);

  try {
    // EC2スポットインスタンスを起動
    const command = new RunInstancesCommand({
      ImageId: amiId,
      InstanceType: instanceType as any,
      MinCount: 1,
      MaxCount: 1,
      SecurityGroupIds: [securityGroupId],
      SubnetId: subnetId,
      IamInstanceProfile: {
        Arn: iamRoleArn,
      },
      InstanceMarketOptions: {
        MarketType: 'spot',
        SpotOptions: {
          MaxPrice: '0.01', // 最大価格（オンデマンドの50%以下）
          SpotInstanceType: 'one-time',
        },
      },
      UserData: Buffer.from(userDataScript).toString('base64'),
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: `batch-${batchType}` },
            { Key: 'BatchType', Value: batchType },
            { Key: 'Environment', Value: 'prd' },
            { Key: 'ManagedBy', Value: 'Lambda' },
          ],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const instanceId = response.Instances?.[0]?.InstanceId;

    if (!instanceId) {
      throw new Error('EC2インスタンスの起動に失敗しました: InstanceIdが取得できませんでした');
    }

    console.log(`EC2インスタンスを起動しました: ${instanceId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        instanceId,
        batchType,
        instanceType,
      }),
    };
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || String(error);
    console.error(`EC2インスタンスの起動に失敗しました: ${errorMessage}`);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    };
  }
}

/**
 * User Dataスクリプトを生成
 */
function getUserDataScript(batchType: string): string {
  if (batchType === 'weekly-ingest') {
    return `#!/bin/bash
# ログ出力（teeコマンドが失敗しても続行するため、|| trueを追加）
exec > >(tee /var/log/batch-weekly-ingest.log || true)
exec 2>&1

# スクリプト終了時に必ずインスタンスを終了する（エラー時も含む）
cleanup() {
  EXIT_CODE=$?
  echo ""
  echo "=== クリーンアップ開始 ==="
  echo "終了コード: $EXIT_CODE"
  echo "終了時刻: $(date)"
  echo "=== weekly-ingestバッチ終了 ==="
  # 少し待ってからシャットダウン（ログが書き込まれるのを待つ）
  sleep 2
  shutdown -h now
}
trap cleanup EXIT INT TERM

echo "=== weekly-ingestバッチ開始 ==="
echo "開始時刻: $(date)"

# 環境変数の設定
export AWS_REGION=ap-northeast-1
export DYNAMODB_TABLE_EVENTS=ouma-fe-prd-events
export DYNAMODB_TABLE_USERS=ouma-fe-prd-users
export NODE_ENV=production

# Node.jsのインストール（Amazon Linux 2023）
if ! command -v node &> /dev/null; then
  echo "Node.jsをインストール中..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  yum install -y nodejs
fi

# AWS CLIのインストール（Amazon Linux 2023には既にインストール済み）
# yum install -y aws-cli

# 作業ディレクトリの作成
mkdir -p /opt/batch
cd /opt/batch

# バッチ処理のコードをS3から取得
# S3_BUCKETとS3_KEYは環境変数から取得（EC2インスタンス起動時に設定）
S3_BUCKET="\${S3_BUCKET:-ouma-fe-prd-static-web}"
S3_KEY="\${S3_KEY:-batch-code.zip}"

echo "バッチ処理のコードをS3から取得中: s3://\${S3_BUCKET}/\${S3_KEY}"
if aws s3 cp "s3://\${S3_BUCKET}/\${S3_KEY}" "/tmp/batch-code.zip" --region ap-northeast-1; then
  echo "コードの展開中..."
  unzip -q /tmp/batch-code.zip -d /opt/batch
  rm /tmp/batch-code.zip
  echo "コードの取得が完了しました"
else
  echo "警告: S3からコードを取得できませんでした。AMIに含まれているコードを使用します。"
fi

# バッチ処理の実行
echo "バッチ処理を実行中..."
# 現在のディレクトリを確認（確実に設定するため）
CURRENT_DIR=$(pwd)
echo "現在のディレクトリ: $CURRENT_DIR"

# ローカルパッケージをnode_modulesにコピー（package.jsonとdistを含める）
echo "ローカルパッケージをnode_modulesにコピー中..."
mkdir -p node_modules/@ouma-family-event

# 各パッケージをコピー（package.jsonとdistを含める）
for pkg in api common ingestion batch; do
  if [ -d "$pkg" ]; then
    echo "  $pkg をコピー中..."
    mkdir -p "node_modules/@ouma-family-event/$pkg"
    # package.jsonをコピー
    cp "$pkg/package.json" "node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: $pkg/package.json が見つかりません"
    # distディレクトリをコピー
    if [ -d "$pkg/dist" ]; then
      cp -r "$pkg/dist" "node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: $pkg/dist のコピーに失敗しました"
    else
      echo "警告: $pkg/dist が見つかりません"
    fi
  else
    echo "警告: $pkg ディレクトリが見つかりません"
  fi
done

# batchディレクトリにもコピー（batchディレクトリから実行する際に必要）
mkdir -p batch/node_modules/@ouma-family-event
for pkg in api common ingestion batch; do
  if [ -d "$pkg" ]; then
    echo "  batch/$pkg をコピー中..."
    mkdir -p "batch/node_modules/@ouma-family-event/$pkg"
    # package.jsonをコピー
    cp "$pkg/package.json" "batch/node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: batch/$pkg/package.json のコピーに失敗"
    # distディレクトリをコピー
    if [ -d "$pkg/dist" ]; then
      cp -r "$pkg/dist" "batch/node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: batch/$pkg/dist のコピーに失敗"
    fi
  fi
done

# リンクの確認
echo "コピーしたパッケージの確認:"
ls -la node_modules/@ouma-family-event/ || echo "警告: パッケージのコピーに失敗しました"
echo "batch/node_modules/@ouma-family-event/の確認:"
ls -la batch/node_modules/@ouma-family-event/ || echo "警告: batch/node_modules/@ouma-family-event/の作成に失敗しました"

# 依存関係をインストール（ローカルパッケージの依存関係を含む）
echo "依存関係をインストール中..."
npm install || echo "警告: npm installに失敗しましたが、続行します"

# tsxとその依存関係を確実にインストール
echo "tsxをインストール中..."
npm install tsx --save-dev --no-save || echo "警告: tsxのインストールに失敗しましたが、続行します"

# tsxのパスを確認
TSX_PATH=""
if [ -f "node_modules/.bin/tsx" ]; then
  TSX_PATH="node_modules/.bin/tsx"
elif [ -f "/opt/batch/node_modules/.bin/tsx" ]; then
  TSX_PATH="/opt/batch/node_modules/.bin/tsx"
else
  echo "警告: tsxが見つかりません。npxを使用します"
  TSX_PATH="npx --yes tsx"
fi

# batchディレクトリに移動して実行
BATCH_EXIT_CODE=0
if [ -f "batch/package.json" ]; then
  cd batch
  echo "batchディレクトリで依存関係をインストール中..."
  # batchディレクトリでもnpm installを実行（依存関係を確実にインストール）
  npm install || echo "警告: batchディレクトリでのnpm installに失敗しましたが、続行します"
  
  echo "バッチ処理を実行します..."
  # NODE_PATHを設定して親ディレクトリと現在のディレクトリのnode_modulesを参照できるようにする
  export NODE_PATH="/opt/batch/batch/node_modules:/opt/batch/node_modules:$NODE_PATH"
  echo "NODE_PATH=$NODE_PATH"
  # tsxを実行（パスが設定されている場合は直接実行、そうでなければnpx）
  if [ -n "$TSX_PATH" ] && [ "$TSX_PATH" != "npx --yes tsx" ]; then
    "$TSX_PATH" src/cli/weekly-ingest.ts
    BATCH_EXIT_CODE=$?
  else
    npx --yes tsx src/cli/weekly-ingest.ts
    BATCH_EXIT_CODE=$?
  fi
  
  # 実行結果をログに出力
  echo ""
  echo "=== バッチ処理実行結果 ==="
  if [ $BATCH_EXIT_CODE -eq 0 ]; then
    echo "✅ バッチ処理が正常に完了しました（終了コード: $BATCH_EXIT_CODE）"
  else
    echo "❌ バッチ処理がエラーで終了しました（終了コード: $BATCH_EXIT_CODE）"
  fi
else
  echo "❌ エラー: batch/package.jsonが見つかりません"
  BATCH_EXIT_CODE=1
fi

# 終了コードを設定（cleanup関数で使用される）
exit $BATCH_EXIT_CODE`;
  } else {
    // friday-notify
    return `#!/bin/bash
# ログ出力（teeコマンドが失敗しても続行するため、|| trueを追加）
exec > >(tee /var/log/batch-friday-notify.log || true)
exec 2>&1

# スクリプト終了時に必ずインスタンスを終了する（エラー時も含む）
cleanup() {
  EXIT_CODE=$?
  echo ""
  echo "=== クリーンアップ開始 ==="
  echo "終了コード: $EXIT_CODE"
  echo "終了時刻: $(date)"
  echo "=== friday-notifyバッチ終了 ==="
  # 少し待ってからシャットダウン（ログが書き込まれるのを待つ）
  sleep 2
  shutdown -h now
}
trap cleanup EXIT INT TERM

echo "=== friday-notifyバッチ開始 ==="
echo "開始時刻: $(date)"

# 環境変数の設定
export AWS_REGION=ap-northeast-1
export DYNAMODB_TABLE_EVENTS=ouma-fe-prd-events
export DYNAMODB_TABLE_USERS=ouma-fe-prd-users
export NODE_ENV=production

# Node.jsのインストール（Amazon Linux 2023）
if ! command -v node &> /dev/null; then
  echo "Node.jsをインストール中..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  yum install -y nodejs
fi

# Secrets ManagerからLINE認証情報を取得
export LINE_CHANNEL_ACCESS_TOKEN=$(aws secretsmanager get-secret-value \\
  --secret-id ouma-fe-prd-line-channel-access-token \\
  --region ap-northeast-1 \\
  --query SecretString --output text)

# AWS CLIのインストール（Amazon Linux 2023には既にインストール済み）
# yum install -y aws-cli

# 作業ディレクトリの作成
mkdir -p /opt/batch
cd /opt/batch

# バッチ処理のコードをS3から取得
# S3_BUCKETとS3_KEYは環境変数から取得（EC2インスタンス起動時に設定）
S3_BUCKET="\${S3_BUCKET:-ouma-fe-prd-static-web}"
S3_KEY="\${S3_KEY:-batch-code.zip}"

echo "バッチ処理のコードをS3から取得中: s3://\${S3_BUCKET}/\${S3_KEY}"
if aws s3 cp "s3://\${S3_BUCKET}/\${S3_KEY}" "/tmp/batch-code.zip" --region ap-northeast-1; then
  echo "コードの展開中..."
  unzip -q /tmp/batch-code.zip -d /opt/batch
  rm /tmp/batch-code.zip
  echo "コードの取得が完了しました"
else
  echo "警告: S3からコードを取得できませんでした。AMIに含まれているコードを使用します。"
fi

# バッチ処理の実行
echo "バッチ処理を実行中..."
# 現在のディレクトリを確認
CURRENT_DIR=$(pwd)
echo "現在のディレクトリ: $CURRENT_DIR"

# ローカルパッケージをnode_modulesにコピー（package.jsonとdistを含める）
echo "ローカルパッケージをnode_modulesにコピー中..."
mkdir -p node_modules/@ouma-family-event

# 各パッケージをコピー（package.jsonとdistを含める）
for pkg in api common ingestion batch; do
  if [ -d "$pkg" ]; then
    echo "  $pkg をコピー中..."
    mkdir -p "node_modules/@ouma-family-event/$pkg"
    # package.jsonをコピー
    cp "$pkg/package.json" "node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: $pkg/package.json が見つかりません"
    # distディレクトリをコピー
    if [ -d "$pkg/dist" ]; then
      cp -r "$pkg/dist" "node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: $pkg/dist のコピーに失敗しました"
    else
      echo "警告: $pkg/dist が見つかりません"
    fi
  else
    echo "警告: $pkg ディレクトリが見つかりません"
  fi
done

# batchディレクトリにもコピー（batchディレクトリから実行する際に必要）
mkdir -p batch/node_modules/@ouma-family-event
for pkg in api common ingestion batch; do
  if [ -d "$pkg" ]; then
    echo "  batch/$pkg をコピー中..."
    mkdir -p "batch/node_modules/@ouma-family-event/$pkg"
    # package.jsonをコピー
    cp "$pkg/package.json" "batch/node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: batch/$pkg/package.json のコピーに失敗"
    # distディレクトリをコピー
    if [ -d "$pkg/dist" ]; then
      cp -r "$pkg/dist" "batch/node_modules/@ouma-family-event/$pkg/" 2>/dev/null || echo "警告: batch/$pkg/dist のコピーに失敗"
    fi
  fi
done

# リンクの確認
echo "コピーしたパッケージの確認:"
ls -la node_modules/@ouma-family-event/ || echo "警告: パッケージのコピーに失敗しました"
echo "batch/node_modules/@ouma-family-event/の確認:"
ls -la batch/node_modules/@ouma-family-event/ || echo "警告: batch/node_modules/@ouma-family-event/の作成に失敗しました"

# tsxとその依存関係を確実にインストール
echo "tsxをインストール中..."
npm install tsx --save-dev --no-save || echo "警告: tsxのインストールに失敗しましたが、続行します"

# tsxのパスを確認
TSX_PATH=""
if [ -f "node_modules/.bin/tsx" ]; then
  TSX_PATH="node_modules/.bin/tsx"
elif [ -f "/opt/batch/node_modules/.bin/tsx" ]; then
  TSX_PATH="/opt/batch/node_modules/.bin/tsx"
else
  echo "警告: tsxが見つかりません。npxを使用します"
  TSX_PATH="npx --yes tsx"
fi

# batchディレクトリに移動して実行
BATCH_EXIT_CODE=0
if [ -f "batch/package.json" ]; then
  cd batch
  echo "batchディレクトリで依存関係をインストール中..."
  # batchディレクトリでもnpm installを実行（依存関係を確実にインストール）
  npm install || echo "警告: batchディレクトリでのnpm installに失敗しましたが、続行します"
  
  echo "バッチ処理を実行します..."
  # NODE_PATHを設定して親ディレクトリと現在のディレクトリのnode_modulesを参照できるようにする
  export NODE_PATH="/opt/batch/batch/node_modules:/opt/batch/node_modules:$NODE_PATH"
  echo "NODE_PATH=$NODE_PATH"
  # tsxを実行（パスが設定されている場合は直接実行、そうでなければnpx）
  if [ -n "$TSX_PATH" ] && [ "$TSX_PATH" != "npx --yes tsx" ]; then
    "$TSX_PATH" src/cli/friday-notify.ts
    BATCH_EXIT_CODE=$?
  else
    npx --yes tsx src/cli/friday-notify.ts
    BATCH_EXIT_CODE=$?
  fi
  
  # 実行結果をログに出力
  echo ""
  echo "=== バッチ処理実行結果 ==="
  if [ $BATCH_EXIT_CODE -eq 0 ]; then
    echo "✅ バッチ処理が正常に完了しました（終了コード: $BATCH_EXIT_CODE）"
  else
    echo "❌ バッチ処理がエラーで終了しました（終了コード: $BATCH_EXIT_CODE）"
  fi
else
  echo "❌ エラー: batch/package.jsonが見つかりません"
  BATCH_EXIT_CODE=1
fi

# 終了コードを設定（cleanup関数で使用される）
exit $BATCH_EXIT_CODE`;
  }
}

