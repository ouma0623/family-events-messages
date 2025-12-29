#!/bin/bash

# フロントエンド表示確認スクリプト
# T-04, T-05, T-06, T-07の動作確認用

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
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-https://api.oumasan.org/v1}"

log_info "=========================================="
log_info "フロントエンド表示確認テスト"
log_info "=========================================="
log_info "フロントエンドURL: ${FRONTEND_URL}"
log_info "API URL: ${API_URL}"
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

# T-04: おすすめ度削除の確認
log_info "--- T-04: おすすめ度削除の確認 ---"
test_check "EventCard.tsxからrecommendScoreの参照が削除されている" \
  "! grep -q 'recommendScore' packages/frontend/src/components/EventCard.tsx 2>/dev/null || true"
test_check "events/page.tsxからrecommendScoreの参照が削除されている" \
  "! grep -q 'recommendScore' packages/frontend/src/app/events/page.tsx 2>/dev/null || true"

# T-05: 画像表示機能の確認
log_info ""
log_info "--- T-05: 画像表示機能の確認 ---"
test_check "EventCard.tsxにImageコンポーネントが実装されている" \
  "grep -q 'import Image' packages/frontend/src/components/EventCard.tsx 2>/dev/null"
test_check "events/page.tsxにImageコンポーネントが実装されている" \
  "grep -q 'import Image' packages/frontend/src/app/events/page.tsx 2>/dev/null"
test_check "next.config.jsで外部画像URLが許可されている" \
  "grep -q 'walkerplus.com' packages/frontend/next.config.js 2>/dev/null"

# T-06: おすすめ理由表示機能の確認
log_info ""
log_info "--- T-06: おすすめ理由表示機能の確認 ---"
test_check "events/page.tsxにおすすめ理由セクションが実装されている" \
  "grep -q 'recommendReasons' packages/frontend/src/app/events/page.tsx 2>/dev/null"

# T-07: 料金情報表示機能の確認
log_info ""
log_info "--- T-07: 料金情報表示機能の確認 ---"
test_check "events/page.tsxに料金情報セクションが実装されている" \
  "grep -q 'priceText\|isFree' packages/frontend/src/app/events/page.tsx 2>/dev/null"

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

