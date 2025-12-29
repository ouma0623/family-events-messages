# K-0002：デプロイスクリプトのパス参照エラー

- 種別：Pitfall
- 重要度：High
- 最終更新：2025-12-28
- 適用範囲：ops
- 関連リンク：Issue #13, #14

## What（何が起きた／何を決めた）
- 統合後の環境で、複数のデプロイスクリプト（`deploy-backend.sh`, `deploy-frontend.sh`, `build-lambda.sh`等）で`PROJECT_ROOT`のパス参照が間違っていた
- `PROJECT_ROOT`が`/home/oumasan/work/family-events-messages/scripts`になっていた（正しくは`/home/oumasan/work/family-events-messages`であるべき）

## Why（原因／判断理由）
- スクリプトが`scripts/operation/`ディレクトリに配置されているため、`$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)`では`scripts/`ディレクトリを指してしまう
- プロジェクトルートを指すには、`../..`（2階層上）に移動する必要がある
- 統合前の環境では、スクリプトの配置場所が異なっていたため、この問題が発生しなかった

## How（解決策／実施内容）
- すべてのデプロイスクリプトで、`PROJECT_ROOT`の設定を`$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)`に統一した
- 修正対象スクリプト：
  - `scripts/operation/deploy-backend.sh`
  - `scripts/operation/deploy-frontend.sh`
  - `scripts/operation/build-lambda.sh`
  - `scripts/operation/build-batch-code.sh`
  - `scripts/operation/build-lambda-layer.sh`

## Prevention（再発防止）
- デプロイスクリプトのパス参照を統一的な方法で設定する（共通関数の作成等）
- スクリプトの構文チェックを事前に実施する（CI/CDパイプラインでの自動チェック等）
- スクリプト実行時に、`PROJECT_ROOT`が正しく設定されていることを確認するログを追加する

## Reference
- `scripts/operation/deploy-backend.sh`
- `scripts/operation/deploy-frontend.sh`
- `scripts/operation/build-lambda.sh`



