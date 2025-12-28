# Architecture（構成図 / 責務境界 / 非機能方針）

本ドキュメントはシステム全体の構成・責務境界・非機能の方針を定義する。  
詳細実装は basic_design に落とす。

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
- Runbook：docs/03_OPERATIONS/runbook.md

---

## 2. 全体像（High Level）
### 2.1 構成図（テキスト版）
> 図は後で画像でもOK。まずはテキストで責務を固定する。

統合後のリポジトリ構造：
```
family-events-messages/
├── infra/              # インフラコード（CDKスタック）
│   ├── lib/
│   │   └── stacks/     # NetworkStack, DataStack, AppStack, OpsStack
│   └── bin/            # CDKアプリケーションエントリーポイント
├── packages/            # アプリケーションコード（モノレポ）
│   ├── common/         # 共通型定義・ユーティリティ・定数
│   ├── ingestion/      # データ取得・パース・正規化・タグ付け
│   ├── batch/          # 週次収集バッチ・金曜通知バッチ
│   ├── api/            # RESTful API（Express）
│   └── frontend/       # Next.js Frontend
├── lambda/             # Lambda関数コード
│   └── ec2-launcher/   # EC2インスタンス起動用Lambda関数
├── scripts/            # スクリプト・バッチファイル
│   ├── operation/      # 運用バッチ・スクリプト
│   └── test/           # テスト実行用スクリプト
└── docs/               # ドキュメント（SSOT）
    ├── 01_REQUIREMENTS/
    ├── 02_DESIGN/
    └── 03_OPERATIONS/
```

- Client：Next.js Frontend（packages/frontend）
- API：Express API（packages/api）→ Lambda関数経由でデプロイ
- Worker/Batch：バッチ処理（packages/batch）→ Lambda関数またはEC2経由で実行
- Storage：DynamoDB（infra/lib/stacks/data-stack.tsで定義）
- Observability（ログ/メトリクス）：CloudWatch Logs（infra/lib/stacks/ops-stack.tsで定義）

### 2.2 データフロー（要点）
1. 週次収集バッチ：外部ソースからイベントデータを取得 → 正規化・タグ付け → DynamoDBに保存
2. 金曜通知バッチ：DynamoDBから週末イベントを取得 → LINE API経由でユーザーに通知
3. API：フロントエンドからのリクエスト → Lambda関数経由でDynamoDBからデータ取得 → レスポンス返却

---

## 3. コンポーネント責務（Boundary）
| コンポーネント | 責務 | 入出力 | 依存 |
|---|---|---|---|
| infra/lib/stacks/network-stack.ts | VPC、セキュリティグループの定義 | VPC、SecurityGroup | AWS CDK |
| infra/lib/stacks/data-stack.ts | DynamoDBテーブル、Secrets Managerの定義 | DynamoDB Table、Secret | NetworkStack |
| infra/lib/stacks/app-stack.ts | Lambda関数、API Gateway、Cognito、CloudFrontの定義 | Lambda Function、API Gateway、Cognito UserPool、CloudFront Distribution | DataStack、NetworkStack |
| infra/lib/stacks/ops-stack.ts | CloudWatch Logs、SNSトピックの定義 | LogGroup、SNSTopic | - |
| packages/common | 共通型定義・ユーティリティ・定数 | TypeScript型定義、ユーティリティ関数 | - |
| packages/ingestion | データ取得・パース・正規化・タグ付け | 正規化されたイベントデータ | packages/common |
| packages/batch | 週次収集バッチ・金曜通知バッチ | DynamoDBへの書き込み、LINE通知 | packages/common、packages/ingestion、packages/api |
| packages/api | RESTful API（Express） | HTTPリクエスト/レスポンス | packages/common |
| packages/frontend | Next.js Frontend | HTML/JavaScript | packages/api（API経由） |
| lambda/ec2-launcher | EC2インスタンス起動用Lambda関数 | EC2インスタンス起動 | AppStack |

---

## 4. インタフェース（外部/内部）
- 外部I/F（例：外部API、スクレイピング元、外部DB等）：
  - LINE API：LINE通知送信（認証：Secrets Managerから取得したチャネルアクセストークン）
  - 外部イベントソース：イベントデータ取得（認証：なし、レート制限：各ソースの制限に従う）
  - AWS Bedrock：AI要約生成（認証：IAMロール、レート制限：AWSの制限に従う）
  - エラー時の扱い：リトライロジック実装、エラーログ出力
- 内部I/F（例：モジュール間、キュー、イベント等）：
  - packages間の依存関係：npm workspacesで管理
  - Lambda関数間の連携：EventBridge経由でスケジュール実行
  - DynamoDBアクセス：AWS SDK経由でアクセス

---

## 5. 非機能方針（Design Policy）
> requirements の非機能を「設計方針」に落とす。

### 5.1 セキュリティ
- 認証/認可：
  - Cognito UserPoolによるユーザー認証
  - API GatewayのJWT認証によるAPI保護
  - IAMロールによるAWSリソースへのアクセス制御
- シークレット管理：
  - Secrets ManagerによるLINE認証情報の管理
  - 環境変数による設定値の管理（機密情報は含めない）
- ログに出してはいけない情報：
  - パスワード、トークン、シークレットキー
  - 個人情報（PII）

### 5.2 可用性
- 障害点：
  - Lambda関数のタイムアウト（15分以内）
  - DynamoDBのスロットリング
  - 外部APIの障害
- リトライ/冪等：
  - EventBridgeによる自動リトライ（最大2回）
  - バッチ処理の冪等性確保（既存データの上書きを避ける）
- タイムアウト：
  - Lambda関数：最大15分（バッチ処理用）
  - API Gateway：最大10秒

### 5.3 性能
- ボトルネック候補：
  - DynamoDBのクエリ性能（GSIを活用）
  - Lambda関数の同時実行数制限
  - 外部APIのレスポンス時間
- キャッシュ（必要なら）：
  - CloudFrontによる静的コンテンツのキャッシュ
  - API Gatewayのキャッシュ（必要に応じて）
- 並列/分割（必要なら）：
  - バッチ処理の並列実行（EC2インスタンス経由）

### 5.4 運用
- Runbook に落とす項目：
  - 定常作業：週次収集バッチ、金曜通知バッチの実行確認
  - 手動オペ：EC2インスタンスの起動・停止、ログ確認
  - scripts/operation、scripts/test の管理：統合後のスクリプトの実行手順

---

## 6. ログ設計（要点）
- 形式（例：JSON推奨）：JSON形式でログ出力（CloudWatch Logs）
- キー項目（例：requestId、featureId、issueId 等）：
  - requestId：リクエスト追跡用
  - functionName：Lambda関数名
  - batchType：バッチ種別（weekly-ingest、friday-notify）
  - eventId：イベントID（該当時）
- エラー分類：
  - エラーレベル：ERROR、WARN、INFO
  - エラー種別：ValidationError、NetworkError、DatabaseError

---

## 7. 変更に強い設計（拡張性）
- 追加要件が来た時の伸ばし方：
  - 新しいパッケージをpackages/配下に追加
  - 新しいLambda関数をinfra/lib/stacks/app-stack.tsに追加
  - 新しいDynamoDBテーブルをinfra/lib/stacks/data-stack.tsに追加
- 依存の切り方：
  - packages間の依存関係はpackage.jsonで管理
  - インフラスタック間の依存関係はCDKのpropsで管理

---

## 8. リスクと対策（Architecture Level）
| リスク | 影響 | 対策 |
|---|---|---|
| 統合時のパス参照エラー | ビルド・デプロイ失敗 | app-stack.ts内の4つのパス参照を一括で修正、バッチファイル内のパス参照を修正、統合後の動作確認 |
| workspace依存関係の破綻 | npm install失敗 | package.jsonのworkspaces設定を`["infra", "packages/*"]`に更新 |
| 既存動作の破壊 | システム停止 | 統合前後の動作確認、段階的な統合、ビルド確認と動作確認の実施 |
| バッチファイルのパス参照エラー | スクリプト実行失敗 | deploy-backend.sh、build-lambda.sh、build-batch-code.shのパス参照を修正 |
| ドキュメントとコードの不整合 | 開発効率低下 | docs配下のテンプレートに基づいた統一的なドキュメント管理 |

---

## 9. 未確定事項
- 統合後のリファクタリング方針（将来対応）
- テストカバレッジの向上方針（将来対応）
