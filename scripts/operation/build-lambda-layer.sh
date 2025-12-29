#!/bin/bash

# Lambda Layer用の依存関係をビルドするスクリプト
# 共通の依存関係（@aws-sdk, axios, express等）をLayerに配置

set -e  # エラーが発生したら即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSETS_DIR="${PROJECT_ROOT}/assets"
LAYER_DIR="${ASSETS_DIR}/layer"

# ログ関数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# ディレクトリの準備
mkdir -p "${LAYER_DIR}/nodejs"

log_info "=========================================="
log_info "Lambda Layer用の依存関係をビルドしています..."
log_info "=========================================="

# 一時ディレクトリを作成
TEMP_DIR=$(mktemp -d)
cd "${TEMP_DIR}"

# package.jsonを作成（共通の依存関係のみ）
cat > package.json <<'EOF'
{
  "name": "lambda-layer-dependencies",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.957.0",
    "@aws-sdk/lib-dynamodb": "^3.957.0",
    "@aws-sdk/client-secrets-manager": "^3.957.0",
    "axios": "^1.6.0",
    "express": "^4.18.2",
    "aws-jwt-verify": "^3.0.0",
    "cheerio": "^1.0.0-rc.12",
    "csv-parse": "^5.5.0",
    "xml2js": "^0.6.2",
    "@xmldom/xmldom": "^0.9.0",
    "xpath": "^0.0.33",
    "iconv-lite": "^0.6.3"
  }
}
EOF

# 依存関係をインストール
log_info "依存関係をインストールしています..."
npm install --production --no-audit --no-fund --legacy-peer-deps 2>&1 | grep -v "npm WARN" | tail -10 || true

# node_modulesをLayerディレクトリにコピー
log_info "node_modulesをLayerディレクトリにコピーしています..."
cp -r node_modules "${LAYER_DIR}/nodejs/"

# ZIPファイルを作成
log_info "Layer ZIPファイルを作成しています..."
cd "${LAYER_DIR}"
zip -r "${ASSETS_DIR}/layer.zip" . -q

# サイズを確認
LAYER_SIZE=$(du -sm "${ASSETS_DIR}/layer.zip" 2>/dev/null | cut -f1 || echo "0")
log_info "Layer ZIPファイルサイズ: ${LAYER_SIZE}MB"

# 一時ディレクトリを削除
rm -rf "${TEMP_DIR}"

log_info "=========================================="
log_info "Lambda Layerのビルドが完了しました！"
log_info "=========================================="
log_info "Layer ZIPファイルの場所: ${ASSETS_DIR}/layer.zip"

