#!/bin/bash

# タグ選択式検索UI確認スクリプト
# T-08の動作確認用

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

log_info "=========================================="
log_info "タグ選択式検索UI確認テスト"
log_info "=========================================="
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

# T-08: タグ選択式検索UIの確認
log_info "--- T-08: タグ選択式検索UIの確認 ---"
test_check "SearchForm.tsxがタグ選択式に変更されている" \
  "grep -q '大ジャンル\|小ジャンル' packages/frontend/src/components/SearchForm.tsx 2>/dev/null"
test_check "大ジャンル選択機能が実装されている" \
  "grep -q 'toggleMajorGenre\|selectedMajorGenres' packages/frontend/src/components/SearchForm.tsx 2>/dev/null"
test_check "小ジャンル選択機能が実装されている" \
  "grep -q 'toggleCategory\|selectedCategories' packages/frontend/src/components/SearchForm.tsx 2>/dev/null"
test_check "無料・有料選択機能が実装されている" \
  "grep -q 'isFree\|無料\|有料' packages/frontend/src/components/SearchForm.tsx 2>/dev/null"
test_check "classifyCategory関数がインポートされている" \
  "grep -q 'classifyCategory' packages/frontend/src/components/SearchForm.tsx 2>/dev/null"
test_check "events/page.tsxでisFreeパラメータが渡されている" \
  "grep -q 'isFree.*query' packages/frontend/src/app/events/page.tsx 2>/dev/null"

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

