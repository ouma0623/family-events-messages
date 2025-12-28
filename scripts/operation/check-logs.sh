#!/bin/bash

# CloudWatch Logsを確認するスクリプト

set -e

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 設定
REGION="ap-northeast-1"
ENV="prd"

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

# 引数チェック
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  weekly-ingest   weekly-ingestバッチのログを表示（デフォルト）"
  echo "  friday-notify   friday-notifyバッチのログを表示"
  echo "  api             API Lambda関数のログを表示"
  echo "  --follow, -f   ログをリアルタイムで追跡"
  echo "  --tail N        最新N行を表示（デフォルト: 50）"
  echo "  --help, -h      このヘルプを表示"
  echo ""
  echo "例:"
  echo "  $0                      # weekly-ingestの最新50行を表示"
  echo "  $0 weekly-ingest        # weekly-ingestの最新50行を表示"
  echo "  $0 --follow             # weekly-ingestのログをリアルタイム追跡"
  echo "  $0 --tail 100           # 最新100行を表示"
  exit 0
fi

# ログタイプの決定
LOG_TYPE="${1:-weekly-ingest}"
FOLLOW=false
TAIL_LINES=50

# オプション解析
args=("$@")
for i in "${!args[@]}"; do
  case "${args[$i]}" in
    --follow|-f)
      FOLLOW=true
      ;;
    --tail)
      if [[ -n "${args[$((i+1))]}" && "${args[$((i+1))]}" != --* ]]; then
        TAIL_LINES="${args[$((i+1))]}"
      fi
      ;;
  esac
done

case "$LOG_TYPE" in
  weekly-ingest)
    LOG_GROUP="/ouma/fe/${ENV}/batch"
    FUNCTION_NAME="ouma-fe-${ENV}-batch-weekly-ingest"
    ;;
  friday-notify)
    LOG_GROUP="/ouma/fe/${ENV}/batch"
    FUNCTION_NAME="ouma-fe-${ENV}-batch-friday-notify"
    ;;
  api)
    LOG_GROUP="/ouma/fe/${ENV}/api"
    FUNCTION_NAME=""
    ;;
  *)
    log_error "不明なログタイプ: $LOG_TYPE"
    echo "使用可能なログタイプ: weekly-ingest, friday-notify, api"
    exit 1
    ;;
esac

log_info "ロググループ: ${LOG_GROUP}"
log_info "リージョン: ${REGION}"

# ログストリームを取得（Lambda関数名でフィルタリング）
if [ -n "$FUNCTION_NAME" ]; then
  log_info "Lambda関数名: ${FUNCTION_NAME}"
  log_info "ログストリームを検索しています..."
  
  # 最新のログストリームを取得（関数名を含むもの、またはweekly-ingest/friday-notifyを含むもの）
  # 複数のストリームが返される可能性があるため、最初の1つだけを取得
  LOG_STREAM=$(aws logs describe-log-streams \
    --log-group-name "${LOG_GROUP}" \
    --order-by LastEventTime \
    --descending \
    --max-items 20 \
    --region "${REGION}" \
    --query "logStreams[?contains(logStreamName, '${FUNCTION_NAME}') || contains(logStreamName, '${LOG_TYPE}')].logStreamName" \
    --output text | tr '\t' '\n' | head -1)
  
  if [ -z "$LOG_STREAM" ] || [ "$LOG_STREAM" = "None" ]; then
    log_warn "ログストリームが見つかりません。ロググループ全体を表示します。"
    log_warn "利用可能なログストリーム:"
    aws logs describe-log-streams \
      --log-group-name "${LOG_GROUP}" \
      --order-by LastEventTime \
      --descending \
      --max-items 5 \
      --region "${REGION}" \
      --query "logStreams[*].logStreamName" \
      --output text 2>/dev/null | head -5 || true
    LOG_STREAM_OPTION=""
  else
    log_info "ログストリーム: ${LOG_STREAM}"
    LOG_STREAM_OPTION="--log-stream-names ${LOG_STREAM}"
  fi
else
  LOG_STREAM_OPTION=""
fi

if [ "$FOLLOW" = true ]; then
  log_info "ログをリアルタイムで追跡しています（Ctrl+Cで終了）..."
  if [ -n "$LOG_STREAM_OPTION" ]; then
    aws logs tail "${LOG_GROUP}" --follow ${LOG_STREAM_OPTION} --region "${REGION}" || {
      log_error "ログの取得に失敗しました"
      exit 1
    }
  else
    aws logs tail "${LOG_GROUP}" --follow --region "${REGION}" || {
      log_error "ログの取得に失敗しました"
      exit 1
    }
  fi
else
  log_info "最新${TAIL_LINES}行のログを取得しています..."
  if [ -n "$LOG_STREAM_OPTION" ]; then
    aws logs tail "${LOG_GROUP}" --since 1h --format short ${LOG_STREAM_OPTION} --region "${REGION}" | tail -n "${TAIL_LINES}" || {
      log_error "ログの取得に失敗しました"
      exit 1
    }
  else
    aws logs tail "${LOG_GROUP}" --since 1h --format short --region "${REGION}" | tail -n "${TAIL_LINES}" || {
      log_error "ログの取得に失敗しました"
      exit 1
    }
  fi
fi

