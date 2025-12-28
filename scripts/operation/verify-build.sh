#!/bin/bash

# Lambda関数のZIPファイルを検証するスクリプト

set -e

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 設定
ASSETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/assets"

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

# ZIPファイルの検証
verify_zip() {
  local zip_file="$1"
  local zip_name="$2"
  
  if [ ! -f "$zip_file" ]; then
    log_error "${zip_name} ZIPファイルが見つかりません: $zip_file"
    return 1
  fi
  
  log_info "=========================================="
  log_info "${zip_name} ZIPファイルを検証しています..."
  log_info "=========================================="
  
  # ZIPファイルのサイズ
  local zip_size=$(du -sh "$zip_file" | cut -f1)
  log_info "ZIPファイルサイズ: ${zip_size}"
  
  # ZIPファイルの内容を確認
  log_info "ZIPファイルの内容を確認しています..."
  
  # node_modules/@ouma-family-event が存在するか
  if unzip -l "$zip_file" 2>/dev/null | grep -q "node_modules/@ouma-family-event"; then
    log_info "✓ node_modules/@ouma-family-event が存在します"
  else
    log_error "✗ node_modules/@ouma-family-event が見つかりません"
    return 1
  fi
  
  # 各パッケージの確認
  for pkg in common ingestion api; do
    if unzip -l "$zip_file" 2>/dev/null | grep -q "node_modules/@ouma-family-event/${pkg}"; then
      log_info "✓ @ouma-family-event/${pkg} が存在します"
      
      # package.jsonが存在するか
      if unzip -l "$zip_file" 2>/dev/null | grep -q "node_modules/@ouma-family-event/${pkg}/package.json"; then
        log_info "  ✓ package.json が存在します"
      else
        log_warn "  ⚠ package.json が見つかりません"
      fi
      
      # distディレクトリが存在するか
      if unzip -l "$zip_file" 2>/dev/null | grep -q "node_modules/@ouma-family-event/${pkg}/dist"; then
        log_info "  ✓ dist ディレクトリが存在します"
      else
        log_warn "  ⚠ dist ディレクトリが見つかりません"
      fi
    else
      log_error "✗ @ouma-family-event/${pkg} が見つかりません"
      return 1
    fi
  done
  
  log_info "=========================================="
  log_info "${zip_name} ZIPファイルの検証が完了しました"
  log_info "=========================================="
  
  return 0
}

# バッチZIPファイルの検証
if [ -f "${ASSETS_DIR}/batch/dist.zip" ]; then
  verify_zip "${ASSETS_DIR}/batch/dist.zip" "バッチ Lambda"
else
  log_error "バッチ Lambda ZIPファイルが見つかりません"
fi

# API ZIPファイルの検証（存在する場合）
if [ -f "${ASSETS_DIR}/api/dist.zip" ]; then
  verify_zip "${ASSETS_DIR}/api/dist.zip" "API Lambda"
fi

# Layer ZIPファイルの検証（存在する場合）
if [ -f "${ASSETS_DIR}/layer.zip" ]; then
  log_info "=========================================="
  log_info "Layer ZIPファイルを検証しています..."
  log_info "=========================================="
  local layer_size=$(du -sh "${ASSETS_DIR}/layer.zip" | cut -f1)
  log_info "Layer ZIPファイルサイズ: ${layer_size}"
  
  if unzip -l "${ASSETS_DIR}/layer.zip" 2>/dev/null | grep -q "nodejs/node_modules"; then
    log_info "✓ nodejs/node_modules が存在します"
  else
    log_warn "⚠ nodejs/node_modules が見つかりません"
  fi
fi

log_info "検証が完了しました"

