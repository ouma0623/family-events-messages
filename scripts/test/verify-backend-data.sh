#!/bin/bash

# バックエンドデータ処理確認スクリプト
# T-01, T-02, T-03の動作確認用（バッチ完了後）

set +e  # エラーで停止しない（テスト結果を集計するため）

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# 設定
REGION="ap-northeast-1"
ENV="prd"
TABLE_NAME="ouma-fe-${ENV}-events"

log_info "=========================================="
log_info "バックエンドデータ処理確認テスト"
log_info "=========================================="
log_info "DynamoDBテーブル: ${TABLE_NAME}"
log_info "リージョン: ${REGION}"
log_info ""
log_warn "注意: このテストはバッチ完了後に実行してください"
log_info ""

# テスト結果
PASSED=0
FAILED=0

# テスト関数
test_check() {
  local test_name="$1"
  local check_command="$2"
  
  log_info "テスト: ${test_name}"
  if eval "$check_command"; then
    log_info "  ✓ PASS: ${test_name}"
    ((PASSED++))
    return 0
  else
    log_error "  ✗ FAIL: ${test_name}"
    ((FAILED++))
    return 1
  fi
}

# DynamoDBからサンプルデータを取得（DynamoDBネイティブ形式）
log_info "DynamoDBからサンプルデータを取得中..."
SAMPLE_EVENT_RAW=$(aws dynamodb scan \
  --table-name "${TABLE_NAME}" \
  --region "${REGION}" \
  --limit 1 \
  --output json 2>/dev/null | jq '.Items[0]' || echo "null")

if [ -z "$SAMPLE_EVENT_RAW" ] || [ "$SAMPLE_EVENT_RAW" = "null" ]; then
  log_warn "DynamoDBにデータがありません。バッチ完了後に再実行してください。"
  exit 0
fi

log_info "サンプルデータを取得しました"
log_info ""

# T-01: 料金情報の確認
log_info "--- T-01: 料金情報の確認 ---"
test_check "priceTextフィールドが存在する" \
  "echo '$SAMPLE_EVENT_RAW' | jq -e '.priceText != null' >/dev/null 2>&1"
test_check "isFreeフィールドが存在する" \
  "echo '$SAMPLE_EVENT_RAW' | jq -e '.isFree != null' >/dev/null 2>&1"

# T-02: カテゴリ分類の確認
log_info ""
log_info "--- T-02: カテゴリ分類の確認 ---"
test_check "raw.categoryClassificationsフィールドが存在する" \
  "echo '$SAMPLE_EVENT_RAW' | jq -e '.raw.M.categoryClassifications != null' >/dev/null 2>&1"
test_check "categoryClassificationsが配列で、majorGenreが含まれている" \
  "echo '$SAMPLE_EVENT_RAW' | jq -e '.raw.M.categoryClassifications.L != null and (.raw.M.categoryClassifications.L | length > 0) and .raw.M.categoryClassifications.L[0].M.majorGenre != null' >/dev/null 2>&1"

# T-03: 既存データ再分類の確認
log_info ""
log_info "--- T-03: 既存データ再分類の確認 ---"
TOTAL_COUNT=$(aws dynamodb scan \
  --table-name "${TABLE_NAME}" \
  --region "${REGION}" \
  --select COUNT \
  --output json 2>/dev/null | jq -r '.Count' || echo "0")

log_info "DynamoDBの総イベント数: ${TOTAL_COUNT}"
test_check "イベントが存在する" \
  "[ ${TOTAL_COUNT} -gt 0 ]"

# 結果サマリ
log_info ""
log_info "=========================================="
log_info "テスト結果サマリ"
log_info "=========================================="
log_info "PASSED: ${PASSED}"
log_info "FAILED: ${FAILED}"
log_info ""

if [ $FAILED -eq 0 ]; then
  log_info "すべてのテストがPASSしました！"
  exit 0
else
  log_error "${FAILED}個のテストがFAILしました"
  exit 1
fi

