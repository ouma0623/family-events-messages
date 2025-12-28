#!/bin/bash

# バッチLambda関数を手動実行するスクリプト

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

# 引数チェック
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  weekly-ingest   weekly-ingestバッチを実行（デフォルト）"
  echo "  friday-notify   friday-notifyバッチを実行"
  echo "  --help, -h      このヘルプを表示"
  echo ""
  echo "例:"
  echo "  $0                    # weekly-ingestを実行"
  echo "  $0 weekly-ingest      # weekly-ingestを実行"
  echo "  $0 friday-notify      # friday-notifyを実行"
  exit 0
fi

# バッチタイプの決定
BATCH_TYPE="${1:-weekly-ingest}"

case "$BATCH_TYPE" in
  weekly-ingest)
    FUNCTION_NAME="ouma-fe-${ENV}-ec2-launcher-weekly-ingest"
    ;;
  friday-notify)
    FUNCTION_NAME="ouma-fe-${ENV}-ec2-launcher-friday-notify"
    ;;
  *)
    log_error "不明なバッチタイプ: $BATCH_TYPE"
    echo "使用可能なバッチタイプ: weekly-ingest, friday-notify"
    exit 1
    ;;
esac

log_info "EC2起動用Lambda関数: ${FUNCTION_NAME}"
log_info "リージョン: ${REGION}"

# EC2インスタンス起動用Lambda関数を実行
log_info "EC2インスタンスを起動しています..."

if aws lambda invoke \
  --function-name "${FUNCTION_NAME}" \
  --invocation-type RequestResponse \
  --payload '{}' \
  --region "${REGION}" \
  /tmp/lambda-invoke-output.json 2>&1; then

  log_info "EC2インスタンス起動のリクエストを送信しました。"
  log_info ""
  
  # レスポンスを確認
  if [ -f "/tmp/lambda-invoke-output.json" ]; then
    INSTANCE_ID=$(cat /tmp/lambda-invoke-output.json | jq -r '.body' | jq -r '.instanceId' 2>/dev/null || echo "")
    if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "null" ]; then
      log_info "EC2インスタンスID: ${INSTANCE_ID}"
      log_info ""
      log_info "EC2インスタンスのログを確認するには:"
      log_info "  aws ec2 get-console-output --instance-id ${INSTANCE_ID} --region ${REGION}"
      log_info ""
      log_info "CloudWatch Logsで詳細なログを確認してください:"
      log_info "  ./scripts/check-logs.sh ${BATCH_TYPE} --follow"
    fi
  fi
  
  log_info ""
  log_info "バッチ処理はEC2インスタンス上で実行されます。"
  log_info "実行完了後、インスタンスは自動的に終了します。"
else
  log_error "EC2インスタンス起動用Lambda関数の実行に失敗しました"
  exit 1
fi

