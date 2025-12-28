# Functional Spec（機能仕様 / 要件→実装の橋渡し）

本ドキュメントは requirements を機能単位に分解し、実装・テスト・運用に繋げるための仕様書である。  
SSOT：requirements（docs/01_REQUIREMENTS/requirements.md）を前提とし、矛盾する場合は requirements を更新する。

---

## 0. メタ情報
- 最終更新日：2025-01-27
- Plan Issue：#XXXX（作成予定）
- 関連：docs/00_INDEX.md

---

## 1. 参照
- Requirements：docs/01_REQUIREMENTS/requirements.md
- Changes：docs/01_REQUIREMENTS/changes.md
- Runbook：docs/03_OPERATIONS/runbook.md
- Architecture：docs/02_DESIGN/architecture.md
- Basic Design：docs/02_DESIGN/basic_design.md

---

## 2. 用語・前提（Glossary）
| 用語 | 意味 |
|---|---|
| 統合 | 複数のリポジトリに分散しているコードを単一リポジトリに集約すること |
| SSOT | Single Source of Truth（唯一の正） |
| CDKスタック | AWS CDKで定義されたインフラリソースの集合 |
| モノレポ | 複数のパッケージを単一リポジトリで管理する構成 |

---

## 3. スコープ（要約）
### 3.1 In Scope（今回やる）
- インフラコード（ouma-events-infra）の統合
- アプリケーションコード（ouma-family-event/packages/*）の統合
- スクリプト・Lambda関数コードの統合
- docs配下での新規ドキュメント作成

### 3.2 Out of Scope（今回やらない）
- 既存ドキュメントの統合
- 既存の動作・機能の変更
- インフラリソースの再デプロイ

---

## 4. ユースケース（Use Cases）
> requirements の UC をここに写経してもよい。最小限でOK。

- UC-01：インフラコードの統合
  - 主体：開発者
  - 入力：ouma-events-infra/lib/stacks/*.ts、ouma-events-infra/lib/*.ts、ouma-events-infra/bin/*.ts
  - 期待結果：family-events-messages/infra/配下に統合され、既存のインフラが正常に動作する

- UC-02：アプリケーションコードの統合
  - 主体：開発者
  - 入力：ouma-family-event/packages/*/src/**/*.ts、ouma-family-event/packages/*/package.json
  - 期待結果：family-events-messages/packages/*配下に統合され、既存のアプリケーションが正常に動作する

- UC-03：スクリプト・Lambda関数の統合
  - 主体：開発者・運用者
  - 入力：ouma-family-event/scripts/**/*、ouma-family-event/lambda/**/*
  - 期待結果：family-events-messages/scripts/*、family-events-messages/lambda/*配下に統合され、既存のスクリプト・Lambda関数が正常に動作する

- UC-04：ドキュメントの新規作成
  - 主体：開発者・運用者
  - 入力：docs配下のテンプレート、統合後のコード構造
  - 期待結果：統一的なドキュメント構造が確立され、参照しやすくなる

---

## 5. 機能一覧（Feature List）
> 実装・Issue分割の単位。IDは後で変えてもOK。

| Feature ID | 機能名 | 概要 | 要件ID対応（FR/AC） | 優先度 |
|---|---|---|---|---|
| F-01 | インフラコード統合 | ouma-events-infraのCDKスタックコードを統合 | FR-01 / AC-01 | High |
| F-02 | アプリケーションコード統合 | ouma-family-eventのpackages/*を統合 | FR-02 / AC-02 | High |
| F-03 | スクリプト・Lambda関数統合 | ouma-family-eventのscripts/*とlambda/*を統合（テストコード除外） | FR-03 / AC-03 | High |
| F-04 | パス参照修正 | app-stack.ts、バッチファイル内のパス参照を統合後のパスに修正 | FR-01, FR-03 / AC-01, AC-03 | High |
| F-05 | 動作確認 | ビルド確認、動作確認を実施 | FR-01, FR-02, FR-03 / AC-01, AC-02, AC-03 | High |
| F-06 | ドキュメント作成 | docs配下のテンプレートに基づいて新規ドキュメントを作成 | FR-04 / AC-04 | High |

---

## 6. 機能仕様（Feature Specs）

### F-01：インフラコード統合
#### 目的
- ouma-events-infraのCDKスタックコードをfamily-events-messages/infra/に統合し、既存のインフラが正常に動作することを確認する

#### 入力
- 画面/CLI/API：なし（ファイル操作）
- パラメータ：
  - 統合元：~/work/ouma-events-infra/lib/stacks/*.ts、~/work/ouma-events-infra/lib/*.ts、~/work/ouma-events-infra/bin/*.ts
  - 統合先：~/work/family-events-messages/infra/lib/stacks/*.ts、~/work/family-events-messages/infra/lib/*.ts、~/work/family-events-messages/infra/bin/*.ts
- バリデーション：
  - TypeScriptのコンパイルエラーがないこと
  - CDKのsynthコマンドが正常に実行できること

#### 出力
- 返却データ：なし
- 表示：なし
- 生成物（ファイル等）：
  - family-events-messages/infra/lib/stacks/*.ts
  - family-events-messages/infra/lib/*.ts
  - family-events-messages/infra/bin/*.ts
  - family-events-messages/infra/package.json
  - family-events-messages/infra/tsconfig.json

#### 処理フロー（要点）
1. ouma-events-infra/lib/stacks/*.tsをfamily-events-messages/infra/lib/stacks/にコピー
2. ouma-events-infra/lib/*.tsをfamily-events-messages/infra/lib/にコピー
3. ouma-events-infra/bin/*.tsをfamily-events-messages/infra/bin/にコピー
4. package.json、tsconfig.jsonを確認・調整
5. TypeScriptのコンパイルエラーを確認
6. パス参照の修正は別タスク（F-04）で実施

#### 例外・異常系
- パス参照エラー：相対パスを確認・修正
- コンパイルエラー：型定義やインポートパスを確認・修正
- リトライ方針（必要なら）：エラー発生時は元のリポジトリに戻す

#### ログ（要点）
- 何を残すか：統合作業の実施内容、エラー発生時の対応
- 何を残さないか（機密・PII）：なし

#### Acceptance（受け入れ条件）
- AC-01 をここに対応づけて列挙
- 統合後のコードがTypeScriptのコンパイルエラーなくビルドできる
- CDKのsynthコマンドが正常に実行できる
- 既存のインフラリソース定義が変更されていない（diff確認）

#### 関連（Design/Implementation）
- 主要モジュール：infra/lib/stacks/network-stack.ts、data-stack.ts、app-stack.ts、ops-stack.ts
- 影響範囲：インフラコード全体
- 関連Issue：#YYYY（作成予定）

---

### F-02：アプリケーションコード統合
#### 目的
- ouma-family-eventのpackages/*をfamily-events-messages/packages/*に統合し、既存のアプリケーションが正常に動作することを確認する

#### 入力
- 画面/CLI/API：なし（ファイル操作）
- パラメータ：
  - 統合元：~/work/ouma-family-event/packages/*/src/**/*.ts、~/work/ouma-family-event/packages/*/package.json
  - 統合先：~/work/family-events-messages/packages/*/src/**/*.ts、~/work/family-events-messages/packages/*/package.json
- バリデーション：
  - TypeScriptのコンパイルエラーがないこと
  - npm installが正常に実行できること
  - workspaceの依存関係が正しく設定されていること

#### 出力
- 返却データ：なし
- 表示：なし
- 生成物（ファイル等）：
  - family-events-messages/packages/common/*
  - family-events-messages/packages/ingestion/*
  - family-events-messages/packages/batch/*
  - family-events-messages/packages/api/*
  - family-events-messages/packages/frontend/*
  - family-events-messages/package.json（workspaces設定）

#### 処理フロー（要点）
1. ouma-family-event/packages/commonをfamily-events-messages/packages/commonにコピー
2. ouma-family-event/packages/ingestionをfamily-events-messages/packages/ingestionにコピー
3. ouma-family-event/packages/batchをfamily-events-messages/packages/batchにコピー
4. ouma-family-event/packages/apiをfamily-events-messages/packages/apiにコピー
5. ouma-family-event/packages/frontendをfamily-events-messages/packages/frontendにコピー
6. package.jsonのworkspaces設定を`["infra", "packages/*"]`に更新
7. npm installを実行して依存関係を確認
8. npm run buildを実行してビルド確認

#### 例外・異常系
- workspace依存関係の破綻：package.jsonのworkspaces設定を確認・修正
- コンパイルエラー：型定義やインポートパスを確認・修正
- リトライ方針（必要なら）：エラー発生時は元のリポジトリに戻す

#### ログ（要点）
- 何を残すか：統合作業の実施内容、エラー発生時の対応
- 何を残さないか（機密・PII）：なし

#### Acceptance（受け入れ条件）
- AC-02 をここに対応づけて列挙
- 統合後のコードがTypeScriptのコンパイルエラーなくビルドできる
- npm installが正常に実行できる
- 既存のアプリケーション機能が正常に動作する（動作確認）

#### 関連（Design/Implementation）
- 主要モジュール：packages/common、packages/ingestion、packages/batch、packages/api、packages/frontend
- 影響範囲：アプリケーションコード全体
- 関連Issue：#YYYY（作成予定）

---

### F-03：スクリプト・Lambda関数統合
#### 目的
- ouma-family-eventのscripts/*とlambda/*をfamily-events-messagesに統合し、既存のスクリプト・Lambda関数が正常に動作することを確認する

#### 入力
- 画面/CLI/API：なし（ファイル操作）
- パラメータ：
  - 統合元：~/work/ouma-family-event/scripts/**/*、~/work/ouma-family-event/lambda/**/*
  - 統合先：~/work/family-events-messages/scripts/**/*、~/work/family-events-messages/lambda/**/*
- バリデーション：
  - スクリプトが正常に実行できること
  - Lambda関数が正常にデプロイできること

#### 出力
- 返却データ：なし
- 表示：なし
- 生成物（ファイル等）：
  - family-events-messages/scripts/operation/*
  - family-events-messages/scripts/test/*
  - family-events-messages/lambda/ec2-launcher/*

#### 処理フロー（要点）
1. ouma-family-event/scripts/operation/*をfamily-events-messages/scripts/operation/にコピー（テストコード除外）
2. ouma-family-event/lambda/ec2-launcher/*をfamily-events-messages/lambda/ec2-launcher/にコピー
3. スクリプトの実行権限を確認
4. パス参照の修正は別タスク（F-04）で実施
5. Lambda関数のデプロイ確認は別タスク（F-05）で実施

#### 例外・異常系
- パス参照エラー：スクリプト内の相対パスを確認・修正
- 実行権限エラー：実行権限を付与
- リトライ方針（必要なら）：エラー発生時は元のリポジトリに戻す

#### ログ（要点）
- 何を残すか：統合作業の実施内容、エラー発生時の対応
- 何を残さないか（機密・PII）：なし

#### Acceptance（受け入れ条件）
- AC-03 をここに対応づけて列挙
- 統合後のスクリプトが正常に実行できる
- Lambda関数が正常にデプロイできる
- 既存のバッチ処理が正常に動作する

#### 関連（Design/Implementation）
- 主要モジュール：scripts/operation/*、lambda/ec2-launcher/*
- 影響範囲：スクリプト・Lambda関数全体
- 関連Issue：#YYYY（作成予定）

---

### F-04：パス参照修正
#### 目的
- app-stack.ts内の4つのパス参照を統合後のパスに修正する
- バッチファイル内のパス参照を統合後のパスに修正する
- 統合後のビルド・デプロイが正常に動作することを確認する

#### 入力
- 画面/CLI/API：なし（ファイル操作）
- パラメータ：
  - 修正対象ファイル：infra/lib/stacks/app-stack.ts、scripts/deploy-backend.sh、scripts/build-lambda.sh、scripts/build-batch-code.sh
- バリデーション：
  - パス参照が正しく修正されていること
  - ビルドが正常に実行できること
  - CDKのsynthが正常に実行できること

#### 出力
- 返却データ：なし
- 表示：なし
- 生成物（ファイル等）：
  - 修正後のinfra/lib/stacks/app-stack.ts
  - 修正後のscripts/deploy-backend.sh
  - 修正後のscripts/build-lambda.sh
  - 修正後のscripts/build-batch-code.sh

#### 処理フロー（要点）
1. app-stack.ts内の4つのパス参照を修正
   - layer.zip: `path.join(__dirname, '../../assets/layer.zip')`
   - api/dist.zip: `path.join(__dirname, '../../assets/api/dist.zip')`
   - batch/dist.zip: `path.join(__dirname, '../../assets/batch/dist.zip')`
   - ec2-launcher: `path.join(__dirname, '../../lambda/ec2-launcher')`
2. deploy-backend.sh内のINFRA_DIRのパス参照を修正
3. build-lambda.sh内のプロジェクトルートのパス参照を確認・修正
4. build-batch-code.sh内のプロジェクトルートのパス参照を確認・修正
5. `npm run build`を実行してビルドエラーがないことを確認
6. `npx cdk synth`を実行してCDKの構文チェックを確認

#### 例外・異常系
- パス参照の修正漏れ：すべてのパス参照を確認・修正
- ビルドエラー：パス参照の修正ミスを確認・修正
- リトライ方針（必要なら）：エラー発生時は元のパス参照に戻す

#### ログ（要点）
- 何を残すか：パス参照修正の実施内容、エラー発生時の対応
- 何を残さないか（機密・PII）：なし

#### Acceptance（受け入れ条件）
- AC-01、AC-03 をここに対応づけて列挙
- app-stack.ts内の4つのパス参照が統合後のパスに修正されている
- バッチファイル内のパス参照が統合後のパスに修正されている
- `npm run build`が正常に実行できる
- `npx cdk synth`が正常に実行できる

#### 関連（Design/Implementation）
- 主要モジュール：infra/lib/stacks/app-stack.ts、scripts/deploy-backend.sh、scripts/build-lambda.sh、scripts/build-batch-code.sh
- 影響範囲：パス参照全体
- 関連Issue：`.github/ISSUES/task-04-path-references.md`を参照

---

### F-05：動作確認
#### 目的
- 統合後のビルド・デプロイが正常に動作することを確認する
- 既存の動作が維持されていることを確認する

#### 入力
- 画面/CLI/API：なし（ビルド・デプロイコマンド実行）
- パラメータ：
  - ビルドコマンド：`npm run build`、`npx cdk synth`
  - 動作確認：既存機能の動作確認
- バリデーション：
  - ビルドが正常に実行できること
  - 既存の動作が維持されていること

#### 出力
- 返却データ：なし
- 表示：ビルド結果、動作確認結果
- 生成物（ファイル等）：
  - ビルド成果物
  - 動作確認ログ

#### 処理フロー（要点）
1. `npm run build`を実行してビルド確認
2. `npx cdk synth`を実行してCDKの構文チェック確認
3. 統合後のスクリプトを実行して動作確認
4. 既存機能の動作確認（E2Eテストは実施しない）

#### 例外・異常系
- ビルドエラー：パス参照や依存関係を確認・修正
- 動作確認エラー：統合時の問題を確認・修正
- リトライ方針（必要なら）：エラー発生時は元のリポジトリに戻す

#### ログ（要点）
- 何を残すか：動作確認の実施内容、エラー発生時の対応
- 何を残さないか（機密・PII）：なし

#### Acceptance（受け入れ条件）
- AC-01、AC-02、AC-03 をここに対応づけて列挙
- ビルドが正常に実行できる
- 既存の動作が維持されている

#### 関連（Design/Implementation）
- 主要モジュール：統合後のすべてのコード
- 影響範囲：統合後のシステム全体
- 関連Issue：#YYYY（作成予定）

---

### F-06：ドキュメント作成
#### 目的
- docs配下のテンプレートに基づいて、統合後のシステムのドキュメントを新規作成し、統一的なドキュメント構造を確立する

#### 入力
- 画面/CLI/API：なし（ファイル操作）
- パラメータ：
  - テンプレート：docs配下のテンプレート
  - 統合後のコード構造
- バリデーション：
  - すべてのテンプレート項目が埋まっていること
  - docs/00_INDEX.mdからすべてのドキュメントにアクセスできること

#### 出力
- 返却データ：なし
- 表示：なし
- 生成物（ファイル等）：
  - docs/01_REQUIREMENTS/requirements.md（更新）
  - docs/02_DESIGN/architecture.md（更新）
  - docs/02_DESIGN/functional_spec.md（更新）
  - docs/02_DESIGN/basic_design.md（更新）
  - docs/03_OPERATIONS/runbook.md（更新）
  - docs/00_INDEX.md（更新）

#### 処理フロー（要点）
1. docs/01_REQUIREMENTS/requirements.mdを更新（背景・目的・スコープ・Done定義）
2. docs/02_DESIGN/architecture.mdを更新（統合後の構成・責務境界）
3. docs/02_DESIGN/functional_spec.mdを更新（統合機能の仕様）
4. docs/02_DESIGN/basic_design.mdを更新（統合後のディレクトリ構成・実装方針）
5. docs/03_OPERATIONS/runbook.mdを更新（統合後の運用手順）
6. docs/00_INDEX.mdを更新（Issue参照枠作成）

#### 例外・異常系
- 既存ドキュメントの情報不足：コードから推測して記載
- テンプレート項目の未記入：すべての項目を埋める
- リトライ方針（必要なら）：不足項目を追加

#### ログ（要点）
- 何を残すか：ドキュメント作成の実施内容
- 何を残さないか（機密・PII）：なし

#### Acceptance（受け入れ条件）
- AC-04 をここに対応づけて列挙
- すべてのテンプレート項目が埋まっている
- docs/00_INDEX.mdからすべてのドキュメントにアクセスできる
- ドキュメントとコードの整合性が保たれている

#### 関連（Design/Implementation）
- 主要モジュール：docs配下のすべてのドキュメント
- 影響範囲：ドキュメント全体
- 関連Issue：#YYYY（作成予定）

---

## 7. テスト観点（設計レベル）
> テストコードやテスト"スクリプト"の置き場所は runbook 参照。ここは観点のみ。

- 観点：
  - 正常系：
    - 統合後のコードがビルドできること
    - 統合後のコードが既存の動作を維持していること
    - 統合後のドキュメントが参照可能であること
  - 異常系：
    - パス参照エラーが発生しないこと
    - コンパイルエラーが発生しないこと
    - workspace依存関係が破綻しないこと
  - 境界値：
    - 統合前後のファイル数が一致していること
    - 統合前後のコード行数が一致していること（コメント除く）
- 受け入れ基準（requirements の AC）との対応：
  - AC-01 → インフラコードの統合完了（ビルド・synth確認）
  - AC-02 → アプリケーションコードの統合完了（ビルド・動作確認）
  - AC-03 → スクリプト・Lambda関数の統合完了（実行・デプロイ確認）
  - AC-04 → ドキュメントの新規作成完了（テンプレート項目確認）

---

## 8. 運用観点（設計レベル）
- 監視/アラート（必要なら）：
  - 統合作業中に既存システムが停止しないこと
  - 統合後の動作確認を実施すること
- 手動オペレーションが必要な箇所：
  - 統合前後の動作確認
  - 統合後のビルド・デプロイ確認
- scripts が必要になりそうな箇所：
  - 運用バッチ：scripts/operation/（統合後のスクリプト実行手順）
  - テスト実行：scripts/test/（統合後の動作確認手順）

---

## 9. 未確定事項（Planで潰す）
- 統合後のリファクタリング方針（将来対応）
- テストカバレッジの向上方針（将来対応）
