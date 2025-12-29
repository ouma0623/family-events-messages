#!/bin/bash

# フロントエンドデプロイスクリプト
# ビルド → S3アップロード → CloudFrontキャッシュ無効化を一括で実行

set -e  # エラーが発生したら即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
S3_BUCKET="ouma-fe-prd-static-web"
DISTRIBUTION_ID="EVW1DN25IS4WJ"
REGION="ap-northeast-1"
FRONTEND_DIR="packages/frontend"

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
trap 'log_error "デプロイ中にエラーが発生しました。ロールバックが必要な場合は手動で対応してください。"; exit 1' ERR

# 引数チェック
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  --dry-run    実際のデプロイは行わず、実行内容を確認します"
  echo "  --skip-build ビルドをスキップします（既にビルド済みの場合）"
  echo "  --help, -h   このヘルプを表示します"
  echo ""
  echo "例:"
  echo "  $0              # 通常のデプロイ"
  echo "  $0 --dry-run    # ドライラン（確認のみ）"
  echo "  $0 --skip-build # ビルドをスキップしてデプロイ"
  exit 0
fi

# オプション解析
DRY_RUN=false
SKIP_BUILD=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      log_warn "ドライランモード: 実際のデプロイは行いません"
      ;;
    --skip-build)
      SKIP_BUILD=true
      log_info "ビルドをスキップします"
      ;;
  esac
done

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

log_info "プロジェクトルート: $PROJECT_ROOT"

# フロントエンドディレクトリの存在確認
if [ ! -d "$FRONTEND_DIR" ]; then
  log_error "フロントエンドディレクトリが見つかりません: $FRONTEND_DIR"
  exit 1
fi

# AWS CLIの存在確認
if ! command -v aws &> /dev/null; then
  log_error "AWS CLIがインストールされていません"
  exit 1
fi

# AWS認証情報の確認
if ! aws sts get-caller-identity &> /dev/null; then
  log_error "AWS認証情報が設定されていません"
  exit 1
fi

log_info "AWS認証情報を確認しました"

# S3バケットの存在確認
if [ "$DRY_RUN" = false ]; then
  if ! aws s3 ls "s3://${S3_BUCKET}" --region "$REGION" &> /dev/null; then
    log_error "S3バケットが見つかりません: ${S3_BUCKET}"
    exit 1
  fi
  log_info "S3バケットを確認しました: ${S3_BUCKET}"
fi

# CloudFront Distributionの存在確認
if [ "$DRY_RUN" = false ]; then
  if ! aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --region "$REGION" &> /dev/null; then
    log_error "CloudFront Distributionが見つかりません: ${DISTRIBUTION_ID}"
    exit 1
  fi
  log_info "CloudFront Distributionを確認しました: ${DISTRIBUTION_ID}"
fi

# ステップ1: ビルド
if [ "$SKIP_BUILD" = false ]; then
  log_info "ステップ1: フロントエンドをビルドしています..."
  cd "$FRONTEND_DIR"

  # 依存関係のインストール
  if [ ! -d "node_modules" ]; then
    log_info "依存関係をインストールしています..."
    if [ "$DRY_RUN" = false ]; then
      npm install
    else
      log_warn "[DRY-RUN] npm install を実行します"
    fi
  fi

  # ビルド
  if [ "$DRY_RUN" = false ]; then
    npm run build
    log_info "ビルドが完了しました"
  else
    log_warn "[DRY-RUN] npm run build を実行します"
  fi

  cd "$PROJECT_ROOT"
else
  log_info "ステップ1: ビルドをスキップしました"
fi

# ビルド成果物の確認
if [ "$SKIP_BUILD" = false ]; then
  if [ -d "$FRONTEND_DIR/out" ]; then
    BUILD_DIR="$FRONTEND_DIR/out"
    log_info "静的エクスポート形式を検出しました: $BUILD_DIR"
  elif [ -d "$FRONTEND_DIR/.next" ]; then
    BUILD_DIR="$FRONTEND_DIR/.next"
    log_info "Next.js標準ビルド形式を検出しました: $BUILD_DIR"
    log_warn "注意: Next.js標準ビルド形式の場合、追加の設定が必要な場合があります"
  else
    log_error "ビルド成果物が見つかりません"
    exit 1
  fi
else
  # ビルドをスキップした場合、既存のビルド成果物を探す
  if [ -d "$FRONTEND_DIR/out" ]; then
    BUILD_DIR="$FRONTEND_DIR/out"
  elif [ -d "$FRONTEND_DIR/.next" ]; then
    BUILD_DIR="$FRONTEND_DIR/.next"
  else
    log_error "ビルド成果物が見つかりません。--skip-build を使用する場合は、事前にビルドを実行してください"
    exit 1
  fi
fi

# ステップ2: S3にアップロード
log_info "ステップ2: S3にアップロードしています..."

if [ "$BUILD_DIR" = "$FRONTEND_DIR/out" ]; then
  # 静的エクスポート形式
  if [ "$DRY_RUN" = false ]; then
    aws s3 sync "$BUILD_DIR" "s3://${S3_BUCKET}" \
      --delete \
      --region "$REGION" \
      --cache-control "public, max-age=31536000, immutable" \
      --exclude "*.html" \
      --exclude "*.json"
    
    # HTMLファイルは別途アップロード（キャッシュ設定なし）
    aws s3 sync "$BUILD_DIR" "s3://${S3_BUCKET}" \
      --delete \
      --region "$REGION" \
      --include "*.html" \
      --include "*.json" \
      --cache-control "public, max-age=0, must-revalidate"
    
    log_info "S3へのアップロードが完了しました"
  else
    log_warn "[DRY-RUN] aws s3 sync を実行します:"
    log_warn "  Source: $BUILD_DIR"
    log_warn "  Destination: s3://${S3_BUCKET}"
  fi
else
  # Next.js標準ビルド形式
  log_warn "Next.js標準ビルド形式の場合、手動でのアップロードが必要な場合があります"
  if [ "$DRY_RUN" = false ]; then
    # 静的ファイルをアップロード
    if [ -d "$BUILD_DIR/static" ]; then
      aws s3 sync "$BUILD_DIR/static" "s3://${S3_BUCKET}/_next/static" \
        --delete \
        --region "$REGION" \
        --cache-control "public, max-age=31536000, immutable"
    fi
    
    # publicディレクトリをアップロード
    if [ -d "$FRONTEND_DIR/public" ]; then
      aws s3 sync "$FRONTEND_DIR/public" "s3://${S3_BUCKET}/public" \
        --delete \
        --region "$REGION" \
        --cache-control "public, max-age=31536000, immutable"
    fi
    
    log_info "S3へのアップロードが完了しました"
  else
    log_warn "[DRY-RUN] aws s3 sync を実行します"
  fi
fi

# ステップ3: CloudFrontのキャッシュを無効化
log_info "ステップ3: CloudFrontのキャッシュを無効化しています..."

if [ "$DRY_RUN" = false ]; then
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --region "$REGION" \
    --query 'Invalidation.Id' \
    --output text)
  
  log_info "キャッシュ無効化が開始されました"
  log_info "Invalidation ID: ${INVALIDATION_ID}"
  log_info "キャッシュ無効化の完了には通常1-2分かかります"
  
  # 無効化の状態を確認（オプション）
  log_info "無効化の状態を確認しています..."
  aws cloudfront get-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID" \
    --region "$REGION" \
    --query 'Invalidation.Status' \
    --output text
else
  log_warn "[DRY-RUN] aws cloudfront create-invalidation を実行します"
  log_warn "  Distribution ID: $DISTRIBUTION_ID"
  log_warn "  Paths: /*"
fi

# 完了メッセージ
log_info "=========================================="
log_info "デプロイが完了しました！"
log_info "=========================================="
log_info "S3バケット: ${S3_BUCKET}"
log_info "CloudFront Distribution: ${DISTRIBUTION_ID}"
if [ "$DRY_RUN" = false ] && [ -n "$INVALIDATION_ID" ]; then
  log_info "Invalidation ID: ${INVALIDATION_ID}"
fi
log_info ""
log_info "デプロイの反映を確認するには:"
log_info "  https://web.oumasan.org にアクセスしてください"
log_info ""
if [ "$DRY_RUN" = false ] && [ -n "$INVALIDATION_ID" ]; then
  log_info "キャッシュ無効化の状態を確認するには:"
  log_info "  aws cloudfront get-invalidation --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID} --region ${REGION}"
fi

