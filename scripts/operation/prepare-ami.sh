#!/bin/bash

# AMI準備スクリプト
# EC2インスタンス上で実行し、バッチ処理用のAMIを作成する

set -e

echo "=== AMI準備スクリプト開始 ==="

# Node.js 20.xをインストール
if ! command -v node &> /dev/null; then
  echo "Node.jsをインストール中..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  yum install -y nodejs
fi

echo "Node.jsバージョン: $(node --version)"
echo "npmバージョン: $(npm --version)"

# 作業ディレクトリの作成
mkdir -p /opt/batch
cd /opt/batch

# バッチ処理のコードを配置
# ここでは、S3から取得するか、git cloneすることを想定
# 実際のデプロイ時は、S3から取得するか、AMI作成時にコードを含める

echo "バッチ処理のコードを配置中..."
# 例: git clone または S3から取得
# git clone https://github.com/your-repo/ouma-family-event.git .
# または
# aws s3 sync s3://your-bucket/batch-code/ /opt/batch/

# 必要なパッケージをインストール
if [ -f "package.json" ]; then
  echo "npmパッケージをインストール中..."
  npm install --production
else
  echo "警告: package.jsonが見つかりません。コードを配置してください。"
fi

# CloudWatch Logs Agentの設定（オプション）
echo "CloudWatch Logs Agentの設定..."
# 必要に応じてCloudWatch Logs Agentを設定

echo "=== AMI準備完了 ==="
echo ""
echo "次のステップ:"
echo "1. EC2インスタンスを停止"
echo "2. AMIを作成"
echo "3. AMI IDをCDKスタックの環境変数に設定"

