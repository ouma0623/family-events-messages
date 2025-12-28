# Basic Design（基本設計 / 実装の骨格）

本ドキュメントは、機能仕様（functional_spec）およびアーキテクチャ設計（architecture）をもとに、
実装可能な粒度まで設計を具体化するための基本設計書である。
詳細設計やコードの最終形は Do フェーズで Issue とともに更新する。

---

## 0. メタ情報
- 最終更新日：2025-01-27
- Plan Issue：#XXXX（作成予定）
- 関連：docs/00_INDEX.md

---

## 1. 参照
- Requirements：docs/01_REQUIREMENTS/requirements.md
- Changes：docs/01_REQUIREMENTS/changes.md
- Functional Spec：docs/02_DESIGN/functional_spec.md
- Architecture：docs/02_DESIGN/architecture.md
- Runbook：docs/03_OPERATIONS/runbook.md

---

## 2. ディレクトリ / モジュール構成（案）
> 実際の構成に合わせて更新する。Plan フェーズで確定する。

統合後のディレクトリ構成：
```
family-events-messages/
├── infra/                    # インフラコード（CDKスタック）
│   ├── lib/
│   │   ├── ouma-events-infra-stack.ts
│   │   └── stacks/
│   │       ├── network-stack.ts
│   │       ├── data-stack.ts
│   │       ├── app-stack.ts
│   │       └── ops-stack.ts
│   ├── bin/
│   │   └── ouma-events-infra.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
├── packages/                 # アプリケーションコード（モノレポ）
│   ├── common/               # 共通型定義・ユーティリティ・定数
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ingestion/            # データ取得・パース・正規化・タグ付け
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── batch/                # 週次収集バッチ・金曜通知バッチ
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                  # RESTful API（Express）
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/             # Next.js Frontend
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── lambda/                   # Lambda関数コード
│   └── ec2-launcher/         # EC2インスタンス起動用Lambda関数
│       ├── index.ts
│       └── package.json
├── scripts/                  # スクリプト・バッチファイル
│   ├── operation/            # 運用バッチ・スクリプト
│   │   - 作成・更新時は runbook.md を必ず更新する
│   └── test/                 # テスト実行用スクリプト
│       - 作成・更新時は runbook.md を必ず更新する
├── docs/                     # ドキュメント（SSOT）
│   ├── 00_INDEX.md
│   ├── 01_REQUIREMENTS/
│   ├── 02_DESIGN/
│   └── 03_OPERATIONS/
├── package.json              # ルートのpackage.json（workspaces設定）
└── tsconfig.json             # ルートのtsconfig.json
```

---

## 3. 主要コンポーネント設計

### 3.1 infra/lib/stacks/network-stack.ts
- 責務：VPC、セキュリティグループの定義
- 入力：cfg（設定オブジェクト）
- 出力：VPC、SecurityGroup
- 依存：AWS CDK
- 例外・エラー：パブリックサブネットが見つからない場合はエラー
- ログ：なし

### 3.2 infra/lib/stacks/data-stack.ts
- 責務：DynamoDBテーブル、Secrets Managerの定義
- 入力：cfg、VPC
- 出力：DynamoDB Table、Secret
- 依存：NetworkStack
- 例外・エラー：なし
- ログ：なし

### 3.3 infra/lib/stacks/app-stack.ts
- 責務：Lambda関数、API Gateway、Cognito、CloudFrontの定義
- 入力：cfg、VPC、DynamoDB Table、Secret、LogGroup、SNSTopic
- 出力：Lambda Function、API Gateway、Cognito UserPool、CloudFront Distribution
- 依存：DataStack、NetworkStack、OpsStack
- 例外・エラー：ACM証明書ARNが未設定の場合はエラー
- ログ：なし
- パス参照（統合後）：
  - layer.zip: `path.join(__dirname, '../../../assets/layer.zip')`
  - api/dist.zip: `path.join(__dirname, '../../../assets/api/dist.zip')`
  - batch/dist.zip: `path.join(__dirname, '../../../assets/batch/dist.zip')`
  - ec2-launcher: `path.join(__dirname, '../../../lambda/ec2-launcher')`

### 3.4 infra/lib/stacks/ops-stack.ts
- 責務：CloudWatch Logs、SNSトピックの定義
- 入力：cfg
- 出力：LogGroup、SNSTopic
- 依存：なし
- 例外・エラー：通知メールアドレスが未設定の場合はエラー
- ログ：なし

### 3.5 packages/common
- 責務：共通型定義・ユーティリティ・定数
- 入力：なし
- 出力：TypeScript型定義、ユーティリティ関数
- 依存：なし
- 例外・エラー：なし
- ログ：なし

### 3.6 packages/ingestion
- 責務：データ取得・パース・正規化・タグ付け
- 入力：外部ソースからのイベントデータ
- 出力：正規化されたイベントデータ
- 依存：packages/common
- 例外・エラー：外部APIのエラー、パースエラー
- ログ：エラーログ出力

### 3.7 packages/batch
- 責務：週次収集バッチ・金曜通知バッチ
- 入力：なし（スケジュール実行）
- 出力：DynamoDBへの書き込み、LINE通知
- 依存：packages/common、packages/ingestion、packages/api
- 例外・エラー：DynamoDBエラー、LINE APIエラー
- ログ：バッチ実行ログ、エラーログ

### 3.8 packages/api
- 責務：RESTful API（Express）
- 入力：HTTPリクエスト
- 出力：HTTPレスポンス
- 依存：packages/common
- 例外・エラー：DynamoDBエラー、認証エラー
- ログ：リクエストログ、エラーログ

### 3.9 packages/frontend
- 責務：Next.js Frontend
- 入力：ユーザー操作
- 出力：HTML/JavaScript
- 依存：packages/api（API経由）
- 例外・エラー：APIエラー
- ログ：クライアントサイドログ

### 3.10 lambda/ec2-launcher
- 責務：EC2インスタンス起動用Lambda関数
- 入力：EventBridgeイベント
- 出力：EC2インスタンス起動
- 依存：AppStack
- 例外・エラー：EC2起動エラー
- ログ：Lambda実行ログ

---

## 4. データ設計（必要な場合）

### 4.1 データモデル
統合対象外（既存のデータモデルを維持）

### 4.2 変換・正規化ルール
統合対象外（既存の変換・正規化ルールを維持）

---

## 5. 画面 / CLI / API 設計（該当時）

### 5.1 エンドポイント一覧
統合対象外（既存のAPIエンドポイントを維持）

### 5.2 リクエスト / レスポンス例
統合対象外（既存のリクエスト/レスポンス形式を維持）

---

## 6. エラーハンドリング方針
- エラー分類：ValidationError、NetworkError、DatabaseError
- リトライ方針：EventBridgeによる自動リトライ（最大2回）
- 失敗時の戻り値・終了コード：エラーログ出力、適切なHTTPステータスコード返却
- ログ出力ルール：JSON形式でCloudWatch Logsに出力
- ユーザー / オペレーターへの通知：SNSトピック経由でメール通知

---

## 7. テスト設計（要点）
> 実装コードやテストスクリプトの配置は runbook に従う。
ここでは設計レベルの観点のみを記載する。

- Unit テスト：各パッケージのユニットテストを維持
- Integration テスト：統合後の動作確認を実施
- E2E テスト（必要な場合）：統合後のE2Eテストを実施
- テストデータ：既存のテストデータを維持
- モック / スタブ方針：既存のモック/スタブを維持

---

## 8. 運用設計（要点）
- 定常運用：週次収集バッチ、金曜通知バッチの実行確認
- 手動オペレーション：EC2インスタンスの起動・停止、ログ確認
- scripts が必要な箇所：
  - operation：scripts/operation/（統合後のスクリプト実行手順）
  - test：scripts/test/（統合後の動作確認手順）
- 監視・アラート（必要な場合）：CloudWatch Logs、SNSトピックによる監視

---

## 9. 実装タスクへの落とし込み
> Plan フェーズで子 Task Issue を全量作成する前提。

| Task | 対象 Feature | 概要 | Issue |
|---|---|---|---|
| T-01 | F-01 | インフラコード統合 | #YYYY（作成予定） |
| T-02 | F-02 | アプリケーションコード統合 | #ZZZZ（作成予定） |
| T-03 | F-03 | スクリプト・Lambda関数統合 | #AAAA（作成予定） |
| T-04 | F-04 | パス参照修正（app-stack.ts、バッチファイル） | `.github/ISSUES/task-04-path-references.md`を参照 |
| T-05 | F-05 | 動作確認（ビルド確認、動作確認） | #CCCC（作成予定） |
| T-06 | F-06 | ドキュメント作成 | #BBBB（作成予定） |

---

## 10. 未確定事項（Plan フェーズで解消）
- 統合後のリファクタリング方針（将来対応）
- テストカバレッジの向上方針（将来対応）
