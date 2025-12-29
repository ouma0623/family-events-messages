#!/bin/bash

# バッチ処理コードをS3にアップロードするスクリプト

set -e

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGION="ap-northeast-1"
ENV="prd"
BUCKET_NAME="ouma-fe-${ENV}-static-web"
S3_KEY="batch-code.zip"
TEMP_DIR=$(mktemp -d)

# ログ関数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# クリーンアップ
cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

log_info "=== バッチ処理コードのビルドとS3アップロード ==="
log_info "プロジェクトルート: $PROJECT_ROOT"
log_info "S3バケット: $BUCKET_NAME"
log_info "S3キー: $S3_KEY"

# 作業ディレクトリに移動
cd "$TEMP_DIR"

# バッチ処理のコードをコピー
log_info "バッチ処理のコードをコピー中..."
cp -r "$PROJECT_ROOT/packages/batch" ./batch
cp -r "$PROJECT_ROOT/packages/common" ./common
cp -r "$PROJECT_ROOT/packages/ingestion" ./ingestion
cp -r "$PROJECT_ROOT/packages/api" ./api

# package.jsonをルートにコピー
cp "$PROJECT_ROOT/package.json" ./package.json
cp "$PROJECT_ROOT/package-lock.json" ./package-lock.json 2>/dev/null || true

# node_modulesをコピー（必要なパッケージのみ）
log_info "必要なパッケージをインストール中..."
npm install --production --no-save

# ローカルパッケージをnode_modulesにコピー（package.jsonとdistを含める）
log_info "ローカルパッケージをnode_modulesにコピー中..."
mkdir -p node_modules/@ouma-family-event

# 各パッケージをコピー（package.jsonとdistを含める）
for pkg in api common ingestion batch; do
  if [ -d "$pkg" ]; then
    log_info "  $pkg をコピー中..."
    mkdir -p "node_modules/@ouma-family-event/$pkg"
    # package.jsonをコピー
    cp "$pkg/package.json" "node_modules/@ouma-family-event/$pkg/" 2>/dev/null || log_warn "  $pkg/package.json が見つかりません"
    # distディレクトリをコピー
    if [ -d "$pkg/dist" ]; then
      cp -r "$pkg/dist" "node_modules/@ouma-family-event/$pkg/" 2>/dev/null || log_warn "  $pkg/dist のコピーに失敗しました"
    else
      log_warn "  $pkg/dist が見つかりません"
    fi
  else
    log_warn "  $pkg ディレクトリが見つかりません"
  fi
done

# ビルド
log_info "TypeScriptのビルド中..."
cd batch
npm run build 2>/dev/null || true
cd ../common
npm run build 2>/dev/null || true
cd ../ingestion
npm run build 2>/dev/null || true
cd ../api
npm run build 2>/dev/null || true

# tsxをインストール（CLI実行用）
log_info "tsxをインストール中..."
cd "$TEMP_DIR"
npm install tsx --save-dev --no-save 2>/dev/null || true

# ルートに戻る
cd "$TEMP_DIR"

# ZIPファイルを作成
log_info "ZIPファイルを作成中..."
zip -r "$S3_KEY" . -q -x "*.git*" -x "*.test.*" -x "*.spec.*" -x "node_modules/.cache/*"

ZIP_SIZE=$(du -sm "$S3_KEY" 2>/dev/null | cut -f1 || echo "0")
log_info "ZIPファイルサイズ: ${ZIP_SIZE}MB"

# S3にアップロード
log_info "S3にアップロード中..."
aws s3 cp "$S3_KEY" "s3://${BUCKET_NAME}/${S3_KEY}" --region "$REGION"

log_info "=== アップロード完了 ==="
log_info "S3パス: s3://${BUCKET_NAME}/${S3_KEY}"

