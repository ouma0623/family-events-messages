#!/bin/bash

# バックエンド（Lambda関数）デプロイスクリプト
# Layerビルド → Lambda関数ビルド → CDKデプロイ → 必要に応じてバッチ実行を一括で実行

set -e  # エラーが発生したら即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 設定
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../infra" && pwd)"
REGION="ap-northeast-1"
ENV="prd"
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
trap 'log_error "デプロイ中にエラーが発生しました。"; exit 1' ERR

# 引数チェック
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  --dry-run          実際のデプロイは行わず、実行内容を確認します"
  echo "  --skip-build       ビルドをスキップします（既にビルド済みの場合）"
  echo "  --skip-deploy      デプロイをスキップします（ビルドのみ実行）"
  echo "  --run-batch        デプロイ後にweekly-ingestバッチを実行します"
  echo "  --stack STACK_NAME 特定のスタックのみデプロイします（デフォルト: app-stack）"
  echo "  --api-only         API Lambda関数のみビルドします"
  echo "  --batch-only       バッチ Lambda関数のみビルドします"
  echo "  --help, -h         このヘルプを表示します"
  echo ""
  echo "例:"
  echo "  $0                      # 通常のデプロイ（Layer + すべてのLambda関数 + app-stack）"
  echo "  $0 --dry-run            # ドライラン（確認のみ）"
  echo "  $0 --skip-build         # ビルドをスキップしてデプロイ"
  echo "  $0 --run-batch          # デプロイ後にバッチを実行"
  echo "  $0 --stack data-stack   # data-stackのみデプロイ"
  echo "  $0 --batch-only         # バッチLambda関数のみビルド"
  exit 0
fi

# オプション解析
DRY_RUN=false
SKIP_BUILD=false
SKIP_DEPLOY=false
RUN_BATCH=false
STACK_NAME="ouma-fe-${ENV}-app"
BUILD_API=true
BUILD_BATCH=true

args=("$@")
for i in "${!args[@]}"; do
  case "${args[$i]}" in
    --dry-run)
      DRY_RUN=true
      log_warn "ドライランモード: 実際のデプロイは行いません"
      ;;
    --skip-build)
      SKIP_BUILD=true
      log_info "ビルドをスキップします"
      ;;
    --skip-deploy)
      SKIP_DEPLOY=true
      log_info "デプロイをスキップします"
      ;;
    --run-batch)
      RUN_BATCH=true
      log_info "デプロイ後にバッチを実行します"
      ;;
    --stack=*)
      STACK_NAME="${args[$i]#*=}"
      log_info "デプロイ対象スタック: ${STACK_NAME}"
      ;;
    --stack)
      if [[ -n "${args[$((i+1))]}" && "${args[$((i+1))]}" != --* ]]; then
        STACK_NAME="${args[$((i+1))]}"
        log_info "デプロイ対象スタック: ${STACK_NAME}"
      fi
      ;;
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

cd "$PROJECT_ROOT"

log_info "プロジェクトルート: $PROJECT_ROOT"
log_info "インフラディレクトリ: $INFRA_DIR"
log_info "AWSリージョン: $REGION"
log_info "環境: $ENV"
log_info "ビルドをスキップ: $SKIP_BUILD"
log_info "デプロイをスキップ: $SKIP_DEPLOY"
log_info "バッチを実行: $RUN_BATCH"
log_info "対象スタック: $STACK_NAME"
log_info "API Lambda関数をビルド: $BUILD_API"
log_info "バッチ Lambda関数をビルド: $BUILD_BATCH"

# ==========================================
# ステップ1: Lambda Layerのビルド
# ==========================================
if [ "$SKIP_BUILD" = false ]; then
  log_info "=========================================="
  log_info "ステップ1: Lambda Layerをビルドしています..."
  log_info "=========================================="

  if [ "$DRY_RUN" = false ]; then
    LAYER_DIR="${ASSETS_DIR}/layer"
    mkdir -p "${LAYER_DIR}/nodejs"

    log_info "Lambda Layer用の依存関係をビルドしています..."
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
    cd "$PROJECT_ROOT"

    log_info "Lambda Layerのビルドが完了しました: ${ASSETS_DIR}/layer.zip"
  else
    log_warn "[DRY-RUN] Lambda Layerのビルドはスキップされます。"
  fi
else
  log_info "ステップ1: Lambda Layerのビルドをスキップしました"
fi

# ==========================================
# ステップ2: Lambda関数のビルド
# ==========================================
if [ "$SKIP_BUILD" = false ]; then
  log_info "=========================================="
  log_info "ステップ2: Lambda関数をビルドしています..."
  log_info "=========================================="

  # assetsディレクトリの作成
  mkdir -p "${ASSETS_DIR}/api"
  mkdir -p "${ASSETS_DIR}/batch"

  # API Lambda関数のビルド
  if [ "$BUILD_API" = true ]; then
    log_info "API Lambda関数をビルドしています..."

    if [ "$DRY_RUN" = false ]; then
      # APIパッケージのビルド
      cd packages/api
      npm install
      npm run build
      cd "$PROJECT_ROOT"

      # 共通パッケージのビルド
      cd packages/common
      npm install
      npm run build
      cd "$PROJECT_ROOT"

      # ZIPファイルの作成
      TEMP_DIR=$(mktemp -d)
      cp -r packages/api/dist/* "${TEMP_DIR}/"
      mkdir -p "${TEMP_DIR}/node_modules/@ouma-family-event"
      
      # @ouma-family-event/common をコピー
      if [ -d "packages/common/dist" ]; then
        mkdir -p "${TEMP_DIR}/node_modules/@ouma-family-event/common"
        cp -r packages/common/dist "${TEMP_DIR}/node_modules/@ouma-family-event/common/dist"
        cp packages/common/package.json "${TEMP_DIR}/node_modules/@ouma-family-event/common/"
      fi

      # ZIPファイルを作成
      cd "${TEMP_DIR}"
      zip -r "${ASSETS_DIR}/api/dist.zip" . -q
      cd "$PROJECT_ROOT"
      rm -rf "${TEMP_DIR}"

      API_ZIP_SIZE=$(du -sm "${ASSETS_DIR}/api/dist.zip" 2>/dev/null | cut -f1 || echo "0")
      log_info "API Lambda ZIPファイルサイズ: ${API_ZIP_SIZE}MB"
    else
      log_warn "[DRY-RUN] API Lambda関数のビルドはスキップされます。"
    fi
  fi

  # バッチ Lambda関数のビルド
  if [ "$BUILD_BATCH" = true ]; then
    log_info "バッチ Lambda関数をビルドしています..."

    if [ "$DRY_RUN" = false ]; then
      # バッチパッケージのビルド
      cd packages/batch
      npm install
      npm run build
      cd "$PROJECT_ROOT"

      # 依存パッケージのビルド
      # packages/commonのnpm installは常に実行（iconv-liteなどの依存関係を確実にインストール）
      cd packages/common
      npm install
      if [ ! -d "dist" ]; then
        npm run build
      fi
      cd "$PROJECT_ROOT"

      if [ ! -d "packages/ingestion/dist" ]; then
        cd packages/ingestion
        npm install
        npm run build
        cd "$PROJECT_ROOT"
      fi

      if [ ! -d "packages/api/dist" ]; then
        cd packages/api
        npm install
        npm run build
        cd "$PROJECT_ROOT"
      fi

      # ZIPファイルの作成
      TEMP_DIR=$(mktemp -d)
      PACK_DIR="${TEMP_DIR}/pack"
      mkdir -p "${PACK_DIR}"

      # ローカルパッケージをtarballにパック
      log_info "ローカルパッケージをパックしています..."
      cd packages/common && npm pack --pack-destination "${PACK_DIR}" > /dev/null 2>&1 && cd "$PROJECT_ROOT"
      cd packages/ingestion && npm pack --pack-destination "${PACK_DIR}" > /dev/null 2>&1 && cd "$PROJECT_ROOT"
      cd packages/api && npm pack --pack-destination "${PACK_DIR}" > /dev/null 2>&1 && cd "$PROJECT_ROOT"

      # package.jsonを作成（ローカルパッケージのみ、外部依存関係はLayerに配置）
      # npm packで作成されるtarballのファイル名は、スコープ付きパッケージ名の場合
      # @ouma-family-event/common -> ouma-family-event-common-1.0.0.tgz となる
      COMMON_TGZ=$(ls -1 ${PACK_DIR} | grep 'ouma-family-event-common' | head -1)
      INGESTION_TGZ=$(ls -1 ${PACK_DIR} | grep 'ouma-family-event-ingestion' | head -1)
      API_TGZ=$(ls -1 ${PACK_DIR} | grep 'ouma-family-event-api' | head -1)

      # tarballの存在確認
      if [ -z "$COMMON_TGZ" ] || [ -z "$INGESTION_TGZ" ] || [ -z "$API_TGZ" ]; then
        log_error "tarballの作成に失敗しました"
        log_error "PACK_DIRの内容:"
        ls -la "${PACK_DIR}/" || true
        rm -rf "${TEMP_DIR}"
        exit 1
      fi

      log_info "tarballファイル:"
      log_info "  common: ${COMMON_TGZ}"
      log_info "  ingestion: ${INGESTION_TGZ}"
      log_info "  api: ${API_TGZ}"

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
      
      # package.jsonの内容を確認
      log_info "package.jsonの内容:"
      cat "${TEMP_DIR}/package.json" || true
      
      # tarballの存在確認
      log_info "tarballの存在確認:"
      ls -la "${PACK_DIR}/" || true
      
      # npm installを実行（エラーも表示）
      log_info "npm installを実行しています..."
      if ! npm install --production --no-audit --no-fund --legacy-peer-deps --no-package-lock 2>&1; then
        log_error "npm installが失敗しました"
        log_error "package.jsonの内容:"
        cat "${TEMP_DIR}/package.json" || true
        log_error "tarballの内容:"
        ls -la "${PACK_DIR}/" || true
        rm -rf "${TEMP_DIR}"
        exit 1
      fi

      # node_modules/@ouma-family-event が存在するか確認
      log_info "node_modulesの構造を確認しています..."
      if [ -d "${TEMP_DIR}/node_modules" ]; then
        ls -la "${TEMP_DIR}/node_modules/" || true
      else
        log_error "node_modulesディレクトリが存在しません"
        rm -rf "${TEMP_DIR}"
        exit 1
      fi
      
      if [ ! -d "${TEMP_DIR}/node_modules/@ouma-family-event" ]; then
        log_error "node_modules/@ouma-family-event が存在しません。npm installが失敗しています。"
        log_error "node_modulesの内容:"
        ls -la "${TEMP_DIR}/node_modules/" || true
        rm -rf "${TEMP_DIR}"
        exit 1
      fi
      
      log_info "node_modules/@ouma-family-event の内容:"
      ls -la "${TEMP_DIR}/node_modules/@ouma-family-event/" || true

      cd "$PROJECT_ROOT"

      # @ouma-family-event/* パッケージのdistとpackage.jsonを正しく配置
      log_info "@ouma-family-event/* パッケージを正しく配置しています..."
      for pkg in common ingestion api; do
        if [ ! -d "packages/${pkg}/dist" ]; then
          log_error "packages/${pkg}/dist が見つかりません。ビルドしてください。"
          rm -rf "${TEMP_DIR}"
          exit 1
        fi
        
        PKG_DIR="${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}"
        if [ ! -d "${PKG_DIR}" ]; then
          log_error "${pkg}パッケージがnode_modulesに存在しません。"
          rm -rf "${TEMP_DIR}"
          exit 1
        fi
        
        # distディレクトリを上書きコピー
        log_info "${pkg}パッケージのdistをコピーしています..."
        rm -rf "${PKG_DIR}/dist"
        cp -r "packages/${pkg}/dist" "${PKG_DIR}/dist"
        
        # package.jsonを確実にコピー
        log_info "${pkg}パッケージのpackage.jsonをコピーしています..."
        cp "packages/${pkg}/package.json" "${PKG_DIR}/package.json"
        
        # パッケージの構造を確認
        if [ ! -f "${PKG_DIR}/package.json" ]; then
          log_error "${pkg}のpackage.jsonのコピーに失敗しました"
          rm -rf "${TEMP_DIR}"
          exit 1
        fi
        
        if [ ! -d "${PKG_DIR}/dist" ]; then
          log_error "${pkg}のdistディレクトリのコピーに失敗しました"
          rm -rf "${TEMP_DIR}"
          exit 1
        fi
        
        log_info "${pkg}パッケージの配置が完了しました"
      done

      # Layerに含まれる外部依存関係を削除（Layerから取得するため）
      log_info "Layerに含まれる外部依存関係を削除しています..."
      for dep in "@aws-sdk" "axios" "express" "aws-jwt-verify" "cheerio" "csv-parse" "xml2js" "@xmldom/xmldom" "xpath"; do
        if [ -d "${TEMP_DIR}/node_modules/${dep}" ]; then
          rm -rf "${TEMP_DIR}/node_modules/${dep}"
        fi
      done

      # @aws-sdk配下のすべてのパッケージを削除
      if [ -d "${TEMP_DIR}/node_modules/@aws-sdk" ]; then
        rm -rf "${TEMP_DIR}/node_modules/@aws-sdk"
      fi

      # distディレクトリをコピー（最後に実行）
      log_info "バッチパッケージのdistをコピーしています..."
      cp -r packages/batch/dist/* "${TEMP_DIR}/"

      # 一時ファイルを削除
      rm -rf "${PACK_DIR}" "${TEMP_DIR}/package-lock.json" 2>/dev/null || true
      
      # デバッグ: node_modulesの構造を確認
      log_info "node_modules/@ouma-family-event の構造を確認しています..."
      if [ -d "${TEMP_DIR}/node_modules/@ouma-family-event" ]; then
        ls -la "${TEMP_DIR}/node_modules/@ouma-family-event/" 2>/dev/null || true
        for pkg in common ingestion api; do
          if [ -d "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}" ]; then
            log_info "${pkg}パッケージの内容:"
            ls -la "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}/" 2>/dev/null | head -10 || true
            if [ -f "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}/package.json" ]; then
              log_info "${pkg}のpackage.jsonのmainフィールド:"
              grep '"main"' "${TEMP_DIR}/node_modules/@ouma-family-event/${pkg}/package.json" || true
            fi
          fi
        done
      else
        log_error "node_modules/@ouma-family-event が存在しません！"
        rm -rf "${TEMP_DIR}"
        exit 1
      fi

      # ZIPファイルを作成前に最終確認
      log_info "ZIPファイル作成前の最終確認..."
      log_info "TEMP_DIRの内容:"
      ls -la "${TEMP_DIR}/" | head -20 || true
      log_info "node_modulesの存在確認:"
      if [ -d "${TEMP_DIR}/node_modules" ]; then
        log_info "✓ node_modulesが存在します"
        log_info "node_modules/@ouma-family-eventの内容:"
        ls -la "${TEMP_DIR}/node_modules/@ouma-family-event/" || true
      else
        log_error "✗ node_modulesが存在しません"
        rm -rf "${TEMP_DIR}"
        exit 1
      fi
      
      # ZIPファイルを作成
      log_info "ZIPファイルを作成しています..."
      cd "${TEMP_DIR}"
      zip -r "${ASSETS_DIR}/batch/dist.zip" . -q
      cd "$PROJECT_ROOT"
      
      # ZIPファイルの内容を確認
      log_info "ZIPファイルの内容を確認しています..."
      unzip -l "${ASSETS_DIR}/batch/dist.zip" 2>/dev/null | grep -E "node_modules/@ouma-family-event|package.json" | head -20 || true

      BATCH_ZIP_SIZE=$(du -sm "${ASSETS_DIR}/batch/dist.zip" 2>/dev/null | cut -f1 || echo "0")
      log_info "バッチ Lambda ZIPファイルサイズ: ${BATCH_ZIP_SIZE}MB"

      # 一時ディレクトリを削除
      rm -rf "${TEMP_DIR}"
    else
      log_warn "[DRY-RUN] バッチ Lambda関数のビルドはスキップされます。"
    fi
  fi

  log_info "Lambda関数のビルドが完了しました"
else
  log_info "ステップ2: Lambda関数のビルドをスキップしました"
fi

# ==========================================
# ステップ3: CDKデプロイ
# ==========================================
if [ "$SKIP_DEPLOY" = false ]; then
  log_info "=========================================="
  log_info "ステップ3: AWS CDKでデプロイしています..."
  log_info "=========================================="
  log_info "デプロイ対象スタック: ${STACK_NAME}"

  if [ "$DRY_RUN" = false ]; then
    # ZIPファイルの存在確認
    if [ "$BUILD_API" = true ] && [ ! -f "${ASSETS_DIR}/api/dist.zip" ]; then
      log_error "API Lambda ZIPファイルが見つかりません: ${ASSETS_DIR}/api/dist.zip"
      exit 1
    fi

    if [ "$BUILD_BATCH" = true ] && [ ! -f "${ASSETS_DIR}/batch/dist.zip" ]; then
      log_error "バッチ Lambda ZIPファイルが見つかりません: ${ASSETS_DIR}/batch/dist.zip"
      exit 1
    fi

    if [ ! -f "${ASSETS_DIR}/layer.zip" ]; then
      log_error "Layer ZIPファイルが見つかりません: ${ASSETS_DIR}/layer.zip"
      exit 1
    fi

    # インフラディレクトリに移動してCDKコマンドを実行
    (
      cd "$INFRA_DIR"
      log_info "CDKデプロイを開始します..."
      npx cdk deploy "$STACK_NAME" --require-approval never --region "$REGION" --context env="${ENV}" --app "npx ts-node --prefer-ts-exts bin/ouma-events.ts"
    )
    log_info "AWS CDKデプロイが完了しました"
  else
    log_warn "[DRY-RUN] CDKデプロイはスキップされます。"
  fi
else
  log_info "ステップ3: CDKデプロイをスキップしました"
fi

# ==========================================
# ステップ4: weekly-ingestバッチの実行 (オプション)
# ==========================================
if [ "$RUN_BATCH" = true ]; then
  log_info "=========================================="
  log_info "ステップ4: weekly-ingestバッチを手動実行しています..."
  log_info "=========================================="

  if [ "$DRY_RUN" = false ]; then
    # Lambda関数名を特定
    LAMBDA_FUNCTION_NAME="ouma-fe-${ENV}-batch-weekly-ingest"

    log_info "Lambda関数 $LAMBDA_FUNCTION_NAME を呼び出し中..."
    aws lambda invoke \
      --function-name "$LAMBDA_FUNCTION_NAME" \
      --invocation-type Event \
      --payload '{}' \
      --region "$REGION" \
      "/tmp/weekly-ingest-invoke-output.json" || {
      log_error "weekly-ingestバッチの呼び出しに失敗しました"
      exit 1
    }

    log_info "weekly-ingestバッチの呼び出しリクエストを送信しました。"
    log_info "出力は /tmp/weekly-ingest-invoke-output.json に、ログはCloudWatch Logsで確認してください。"
  else
    log_warn "[DRY-RUN] weekly-ingestバッチの実行はスキップされます。"
  fi
fi

# ==========================================
# 完了メッセージ
# ==========================================
log_info "=========================================="
log_info "デプロイが完了しました！"
log_info "=========================================="
log_info "スタック: ${STACK_NAME}"
log_info "環境: ${ENV}"
log_info "リージョン: ${REGION}"
log_info ""
log_info "デプロイの確認:"
log_info "  AWS ConsoleでLambda関数を確認してください"
log_info "  CloudWatch Logsでログを確認してください"
