#!/bin/bash

# Lambda関数のビルドとZIPファイル作成スクリプト
# 依存関係を含むZIPファイルを作成します

set -e  # エラーが発生したら即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="${PROJECT_ROOT}/assets"

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

# エラーハンドリング
trap 'log_error "ビルド中にエラーが発生しました。"; exit 1' ERR

# 引数チェック
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  --api-only      API Lambda関数のみビルド"
  echo "  --batch-only    バッチ Lambda関数のみビルド"
  echo "  --help, -h      このヘルプを表示します"
  echo ""
  echo "例:"
  echo "  $0              # 全てのLambda関数をビルド"
  echo "  $0 --api-only   # API Lambda関数のみビルド"
  echo "  $0 --batch-only # バッチ Lambda関数のみビルド"
  exit 0
fi

cd "$PROJECT_ROOT"

log_info "プロジェクトルート: $PROJECT_ROOT"

# assetsディレクトリの作成
mkdir -p "${ASSETS_DIR}/api"
mkdir -p "${ASSETS_DIR}/batch"

# オプション解析
BUILD_API=true
BUILD_BATCH=true

for arg in "$@"; do
  case $arg in
    --api-only)
      BUILD_BATCH=false
      log_info "API Lambda関数のみビルドします"
      ;;
    --batch-only)
      BUILD_API=false
      log_info "バッチ Lambda関数のみビルドします"
      ;;
  esac
done

# 依存関係のインストール
if [ ! -d "node_modules" ]; then
  log_info "依存関係をインストールしています..."
  npm install
fi

# API Lambda関数のビルド
if [ "$BUILD_API" = true ]; then
  log_info "=========================================="
  log_info "API Lambda関数をビルドしています..."
  log_info "=========================================="

  # APIパッケージのビルド
  log_info "APIパッケージをビルドしています..."
  cd packages/api
  npm install
  npm run build
  cd "$PROJECT_ROOT"

  # 共通パッケージのビルド
  log_info "共通パッケージをビルドしています..."
  cd packages/common
  npm install
  npm run build
  cd "$PROJECT_ROOT"

  # ZIPファイルの作成
  log_info "API Lambda関数のZIPファイルを作成しています..."
  TEMP_DIR=$(mktemp -d)
  
  # distディレクトリをコピー
  cp -r packages/api/dist/* "${TEMP_DIR}/"
  
  # node_modulesをコピー（依存関係のみ）
  mkdir -p "${TEMP_DIR}/node_modules"
  
  # @ouma-family-event/common をコピー
  if [ -d "packages/common/dist" ]; then
    mkdir -p "${TEMP_DIR}/node_modules/@ouma-family-event"
    cp -r packages/common "${TEMP_DIR}/node_modules/@ouma-family-event/"
    # distディレクトリのみを使用
    rm -rf "${TEMP_DIR}/node_modules/@ouma-family-event/common/dist"
    cp -r packages/common/dist "${TEMP_DIR}/node_modules/@ouma-family-event/common/dist"
    # package.jsonをコピー
    cp packages/common/package.json "${TEMP_DIR}/node_modules/@ouma-family-event/common/"
  fi
  
  # 外部依存関係をコピー
  if [ -d "packages/api/node_modules" ]; then
    # AWS SDKなどの外部依存関係をコピー
    for dep in "@aws-sdk" "aws-jwt-verify" "axios" "express"; do
      if [ -d "packages/api/node_modules/${dep}" ]; then
        cp -r "packages/api/node_modules/${dep}" "${TEMP_DIR}/node_modules/" 2>/dev/null || true
      fi
    done
  fi
  
  # ルートのnode_modulesからもコピー（monorepoの場合）
  if [ -d "node_modules" ]; then
    for dep in "@aws-sdk" "aws-jwt-verify" "axios" "express"; do
      if [ -d "node_modules/${dep}" ] && [ ! -d "${TEMP_DIR}/node_modules/${dep}" ]; then
        cp -r "node_modules/${dep}" "${TEMP_DIR}/node_modules/" 2>/dev/null || true
      fi
    done
  fi
  
  # ZIPファイルを作成
  cd "${TEMP_DIR}"
  zip -r "${ASSETS_DIR}/api/dist.zip" . -q
  cd "$PROJECT_ROOT"
  
  # 一時ディレクトリを削除
  rm -rf "${TEMP_DIR}"
  
  log_info "API Lambda関数のZIPファイルを作成しました: ${ASSETS_DIR}/api/dist.zip"
fi

# バッチ Lambda関数のビルド
if [ "$BUILD_BATCH" = true ]; then
  log_info "=========================================="
  log_info "バッチ Lambda関数をビルドしています..."
  log_info "=========================================="

  # バッチパッケージのビルド
  log_info "バッチパッケージをビルドしています..."
  cd packages/batch
  npm install
  npm run build
  cd "$PROJECT_ROOT"

  # 依存パッケージのビルド
  log_info "依存パッケージをビルドしています..."
  
  # common
  if [ ! -d "packages/common/dist" ]; then
    cd packages/common
    npm install
    npm run build
    cd "$PROJECT_ROOT"
  fi
  
  # ingestion
  if [ ! -d "packages/ingestion/dist" ]; then
    cd packages/ingestion
    npm install
    npm run build
    cd "$PROJECT_ROOT"
  fi
  
  # api
  if [ ! -d "packages/api/dist" ]; then
    cd packages/api
    npm install
    npm run build
    cd "$PROJECT_ROOT"
  fi

  # ZIPファイルの作成
  log_info "バッチ Lambda関数のZIPファイルを作成しています..."
  TEMP_DIR=$(mktemp -d)
  PACK_DIR="${TEMP_DIR}/pack"
  mkdir -p "${PACK_DIR}"
  
  # ローカルパッケージをtarballにパック
  log_info "ローカルパッケージをパックしています..."
  cd packages/common && npm pack --pack-destination "${PACK_DIR}" > /dev/null 2>&1 && cd "$PROJECT_ROOT"
  cd packages/ingestion && npm pack --pack-destination "${PACK_DIR}" > /dev/null 2>&1 && cd "$PROJECT_ROOT"
  cd packages/api && npm pack --pack-destination "${PACK_DIR}" > /dev/null 2>&1 && cd "$PROJECT_ROOT"
  
  # package.jsonを作成（ローカルパッケージのみ、外部依存関係はLayerに配置）
  COMMON_TGZ=$(ls -1 ${PACK_DIR} | grep '@ouma-family-event-common' | head -1)
  INGESTION_TGZ=$(ls -1 ${PACK_DIR} | grep '@ouma-family-event-ingestion' | head -1)
  API_TGZ=$(ls -1 ${PACK_DIR} | grep '@ouma-family-event-api' | head -1)
  
  cat > "${TEMP_DIR}/package.json" <<EOF
{
  "name": "lambda-batch",
  "version": "1.0.0",
  "dependencies": {
    "@ouma-family-event/common": "file:pack/${COMMON_TGZ}",
    "@ouma-family-event/ingestion": "file:pack/${INGESTION_TGZ}",
    "@ouma-family-event/api": "file:pack/${API_TGZ}"
  }
}
EOF
  
  # ローカルパッケージのみをインストール（外部依存関係はLayerから取得）
  log_info "ローカルパッケージをインストールしています..."
  cd "${TEMP_DIR}"
  export NODE_PATH=""
  npm install --production --no-audit --no-fund --legacy-peer-deps --no-package-lock 2>&1 | grep -v "npm WARN" | tail -10 || true
  
  # インストールされたnode_modulesのサイズを確認
  INSTALLED_SIZE=$(du -sm "${TEMP_DIR}/node_modules" 2>/dev/null | cut -f1 || echo "0")
  log_info "インストールされたnode_modulesサイズ: ${INSTALLED_SIZE}MB"
  
  # Layerに含まれる外部依存関係を削除（Layerから取得するため）
  log_info "Layerに含まれる外部依存関係を削除しています..."
  for dep in "@aws-sdk" "axios" "express" "aws-jwt-verify" "cheerio" "csv-parse" "xml2js" "@xmldom/xmldom" "xpath"; do
    if [ -d "${TEMP_DIR}/node_modules/${dep}" ]; then
      rm -rf "${TEMP_DIR}/node_modules/${dep}"
      log_info "削除: ${dep}"
    fi
  done
  
  # @aws-sdk配下のすべてのパッケージを削除
  if [ -d "${TEMP_DIR}/node_modules/@aws-sdk" ]; then
    rm -rf "${TEMP_DIR}/node_modules/@aws-sdk"
    log_info "削除: @aws-sdk/*"
  fi
  
  # 削除後のnode_modulesサイズを確認
  INSTALLED_SIZE_AFTER=$(du -sm "${TEMP_DIR}/node_modules" 2>/dev/null | cut -f1 || echo "0")
  log_info "削除後のnode_modulesサイズ: ${INSTALLED_SIZE_AFTER}MB"
  
  cd "$PROJECT_ROOT"
  
  # distディレクトリをコピー
  cp -r packages/batch/dist/* "${TEMP_DIR}/"
  
  # @ouma-family-event/* パッケージのdistを正しく配置
  for pkg in common ingestion api; do
    if [ -d "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}" ] && [ -d "packages/${pkg}/dist" ]; then
      rm -rf "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}/dist"
      cp -r "packages/${pkg}/dist" "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}/dist"
    fi
  done
  
  # 一時ファイルを削除
  rm -rf "${PACK_DIR}" "${TEMP_DIR}/package.json" "${TEMP_DIR}/package-lock.json" 2>/dev/null || true
  
  # ZIPファイルを作成
  cd "${TEMP_DIR}"
  zip -r "${ASSETS_DIR}/batch/dist.zip" . -q
  cd "$PROJECT_ROOT"
  
  # ZIPファイルのサイズを確認
  ZIP_SIZE=$(du -sm "${ASSETS_DIR}/batch/dist.zip" 2>/dev/null | cut -f1 || echo "0")
  if [ "$ZIP_SIZE" -gt 0 ]; then
    log_info "ZIPファイルサイズ: ${ZIP_SIZE}MB"
    if [ "$ZIP_SIZE" -gt 50 ]; then
      log_warn "ZIPファイルが大きいです（${ZIP_SIZE}MB）。Lambda関数の制限（50MB）を超える可能性があります。"
      log_warn "Lambda Layerの使用を検討してください。"
    fi
  fi
  
  # 一時ディレクトリを削除
  rm -rf "${TEMP_DIR}"
  
  log_info "バッチ Lambda関数のZIPファイルを作成しました: ${ASSETS_DIR}/batch/dist.zip"
fi

# 完了メッセージ
log_info "=========================================="
log_info "ビルドが完了しました！"
log_info "=========================================="
log_info "ZIPファイルの場所:"
if [ "$BUILD_API" = true ]; then
  log_info "  API: ${ASSETS_DIR}/api/dist.zip"
fi
if [ "$BUILD_BATCH" = true ]; then
  log_info "  バッチ: ${ASSETS_DIR}/batch/dist.zip"
fi
log_info ""
log_info "次のステップ:"
log_info "  ./scripts/deploy-backend.sh を実行してデプロイしてください"

