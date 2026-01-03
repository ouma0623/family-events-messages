# K-0001：EC2バッチ処理の依存関係解決問題

- 種別：Pitfall
- 重要度：High
- 最終更新：2025-12-28
- 適用範囲：infra / ops
- 関連リンク：Issue #13, #22

## What（何が起きた／何を決めた）
- EC2インスタンス上で実行されるバッチ処理（weekly-ingest）が、`Runtime.ImportModuleError: Cannot find module '@ouma-family-event/common'`エラーで失敗した
- S3に`batch-code.zip`が存在せず、EC2インスタンスがコードを取得できなかった
- `build-batch-code.sh`スクリプトが実行されていなかったため、バッチコードがS3にアップロードされていなかった

## Why（原因／判断理由）
- EC2バッチ処理は、S3から`batch-code.zip`を取得して展開し、EC2インスタンス上で実行される
- `build-batch-code.sh`スクリプトを実行しないと、S3にバッチコードがアップロードされない
- EC2インスタンス起動時のuserDataスクリプトは、S3からコードを取得できない場合、AMIに含まれているコードを使用しようとするが、依存関係が正しく解決されない
- モノレポ構造のため、ローカルパッケージ（`@ouma-family-event/common`等）を`node_modules`にコピーする必要があるが、その処理が失敗していた

## How（解決策／実施内容）
1. `build-batch-code.sh`スクリプトを実行して、S3に`batch-code.zip`をアップロードする
   - スクリプトは、必要なパッケージ（api, common, ingestion, batch）をコピーし、`node_modules/@ouma-family-event/`に配置する
   - TypeScriptのビルドを実行し、`dist`ディレクトリを含める
   - `tsx`をインストールしてCLI実行を可能にする
2. EC2インスタンス起動時のuserDataスクリプトで、S3からコードを取得して展開する
3. ローカルパッケージを`node_modules`にコピーし、依存関係を解決する

## Prevention（再発防止）
- デプロイ手順に`build-batch-code.sh`の実行を明記する
- CI/CDパイプラインで、バッチコードのビルドとS3アップロードを自動化する
- バッチ実行前に、S3に`batch-code.zip`が存在することを確認するチェックを追加する
- EC2インスタンスのコンソール出力を確認して、バッチ処理が正常に実行されたことを検証する

## Reference
- `scripts/operation/build-batch-code.sh`
- `lambda/ec2-launcher/index.ts`（getUserDataScript関数）
- `packages/batch/src/cli/weekly-ingest.ts`







