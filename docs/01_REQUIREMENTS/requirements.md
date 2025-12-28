# Requirements（要件定義 / SSOT）

> このドキュメントは本PJの **要件の唯一の正（SSOT）** である。  
> 仕様・範囲・Done（完了条件）をここで確定し、実装や検証はこの内容に従う。  
> 変更が発生する場合は `/plan` に差し戻し、本ファイルを更新した上で進めること。

---

## 0. メタ情報（プロジェクト固有）
- プロジェクト名：family-events-messages（統合プロジェクト）
- 対象期間（任意）：
- オーナー（任意）：ouma0623
- 最終更新日：2025-01-27
- 関連（リンク）
  - docs hub：`docs/00_INDEX.md`
  - Plan Issue：#6（https://github.com/ouma0623/family-events-messages/issues/6）
  - Notion：<URL>（作成予定）
  - Github Repository：https://github.com/ouma0623/family-events-messages

---

## 1. 背景（Background）
- 現状の課題：
  - インフラコード（ouma-events-infra）とアプリケーションコード（ouma-family-event）が別リポジトリに分散している
  - ドキュメントが複数ディレクトリに散在し、管理が困難
  - 開発・運用時の参照先が不明確
- 何が困っているか：
  - コードとドキュメントの整合性を保つのが困難
  - 変更時の影響範囲把握が難しい
  - 新規メンバーのオンボーディングが困難
- なぜ今やるか（機会・リスク）：
  - 統合により、コードとドキュメントの一元管理が可能になる
  - docs配下のテンプレートに基づいた統一的なドキュメント管理が可能になる
  - 開発効率と保守性の向上が期待できる

---

## 2. 目的（Goal / Why）
- 達成したい状態：
  - インフラコードとアプリケーションコードを単一リポジトリ（family-events-messages）に統合
  - docs配下のテンプレートに基づいた統一的なドキュメント構造を確立
  - 既存の動作を維持したまま、コードとドキュメントの整合性を確保
- 成果の使われ方（誰が/いつ/何のために）：
  - 開発者：コードとドキュメントを一箇所で参照できる
  - 運用者：統合されたリポジトリから運用手順を確認できる
  - 新規メンバー：docs/00_INDEX.mdから全体像を把握できる

---

## 3. スコープ（Scope）
> Planで確定し、Do/Checkで増やさない。

### 3.1 対象（In Scope）
- 対象機能：
  - ouma-events-infraのインフラコード（CDKスタック）の統合
  - ouma-family-eventのアプリケーションコード（packages/*）の統合
  - ouma-family-eventのバッチファイル・スクリプトの統合
  - ouma-family-eventのLambda関数コードの統合
  - docs配下での新規ドキュメント作成（既存ドキュメントは統合しない）
- 対象データ：
  - コードファイル（.ts, .js, .json等）
  - 設定ファイル（package.json, tsconfig.json等）
  - バッチファイル・スクリプト（.sh, .js等）
- 対象画面/API：
  - 統合対象外（既存の動作を維持するため）
- 対象環境（dev/stg/prodなど）：
  - すべての環境で動作確認済みのコードを統合
- 対象リポジトリ/ディレクトリ：
  - 統合元：`~/work/ouma-events-infra/` → `family-events-messages/infra/`
  - 統合元：`~/work/ouma-family-event/packages/*` → `family-events-messages/packages/*`
  - 統合元：`~/work/ouma-family-event/scripts/*` → `family-events-messages/scripts/*`
  - 統合元：`~/work/ouma-family-event/lambda/*` → `family-events-messages/lambda/*`
  - 統合先：`~/work/family-events-messages/`

### 3.2 対象外（Out of Scope）
- 今回やらないこと：
  - 既存ドキュメント（ouma-family-event/doc/*, ouma-family-event/doc_work/*）の統合
  - 既存の動作・機能の変更
  - インフラリソースの再デプロイ（コード統合のみ）
  - テストコードの追加・変更（既存のテストは統合）
- 将来対応に回すこと：
  - 統合後のリファクタリング
  - ドキュメントの詳細化
  - テストカバレッジの向上

---

## 4. ユースケース / 利用シナリオ（Use Cases）
> 「誰が」「何を」「どうしたい」を簡潔に列挙する。

- UC-01：インフラコードの統合
  - 利用者：開発者
  - 操作/入力：ouma-events-infraのCDKスタックコードをfamily-events-messages/infra/に統合
  - 期待結果：統合後も既存のインフラが正常に動作する

- UC-02：アプリケーションコードの統合
  - 利用者：開発者
  - 操作/入力：ouma-family-eventのpackages/*をfamily-events-messages/packages/*に統合
  - 期待結果：統合後も既存のアプリケーションが正常に動作する

- UC-03：スクリプト・バッチファイルの統合
  - 利用者：開発者・運用者
  - 操作/入力：ouma-family-eventのscripts/*とlambda/*をfamily-events-messagesに統合
  - 期待結果：統合後も既存のスクリプト・Lambda関数が正常に動作する

- UC-04：ドキュメントの新規作成
  - 利用者：開発者・運用者
  - 操作/入力：docs配下のテンプレートに基づいて新規ドキュメントを作成
  - 期待結果：統一的なドキュメント構造が確立され、参照しやすくなる

---

## 5. 要件（Requirements）

### 5.1 機能要件（Functional）
> 実装対象となる要件。曖昧さを残さない。

- FR-01：インフラコードの統合
  - 説明：ouma-events-infraのCDKスタックコード（lib/stacks/*.ts）をfamily-events-messages/infra/lib/stacks/に統合する
  - 入力：ouma-events-infra/lib/stacks/*.ts、ouma-events-infra/lib/*.ts、ouma-events-infra/bin/*.ts
  - 出力：family-events-messages/infra/lib/stacks/*.ts、family-events-messages/infra/lib/*.ts、family-events-messages/infra/bin/*.ts
  - 例外/異常系：統合時にパス参照エラーが発生する可能性があるため、相対パスを確認・修正する
  - 受け入れ条件（Acceptance）：
    - 統合後のコードがTypeScriptのコンパイルエラーなくビルドできる
    - CDKのsynthコマンドが正常に実行できる
    - 既存のインフラリソース定義が変更されていない
  - パス参照修正対象（app-stack.ts内）：
    1. `path.join(__dirname, '../../../ouma-family-event/assets/layer.zip')` → `path.join(__dirname, '../../../assets/layer.zip')`
    2. `path.join(__dirname, '../../../ouma-family-event/assets/api/dist.zip')` → `path.join(__dirname, '../../../assets/api/dist.zip')`
    3. `path.join(__dirname, '../../../ouma-family-event/assets/batch/dist.zip')` → `path.join(__dirname, '../../../assets/batch/dist.zip')`
    4. `path.join(__dirname, '../../../ouma-family-event/lambda/ec2-launcher')` → `path.join(__dirname, '../../../lambda/ec2-launcher')`

- FR-02：アプリケーションコードの統合
  - 説明：ouma-family-eventのpackages/*（common, ingestion, batch, api, frontend）をfamily-events-messages/packages/*に統合する
  - 入力：ouma-family-event/packages/*/src/**/*.ts、ouma-family-event/packages/*/package.json
  - 出力：family-events-messages/packages/*/src/**/*.ts、family-events-messages/packages/*/package.json
  - 例外/異常系：workspaceの依存関係が壊れる可能性があるため、package.jsonのworkspaces設定を確認する
  - package.jsonのworkspaces設定：
    - 統合後は`workspaces: ["infra", "packages/*"]`として、infraとpackagesを同じworkspaceに含める
    - これにより、monorepoとして統一的な依存関係管理が可能になる
  - 受け入れ条件（Acceptance）：
    - 統合後のコードがTypeScriptのコンパイルエラーなくビルドできる
    - npm installが正常に実行できる
    - 既存のアプリケーション機能が正常に動作する

- FR-03：スクリプト・Lambda関数の統合
  - 説明：ouma-family-eventのscripts/*とlambda/*をfamily-events-messagesに統合する（テストコードは統合しない）
  - 入力：ouma-family-event/scripts/**/*（テストコード除外）、ouma-family-event/lambda/**/*
  - 出力：family-events-messages/scripts/**/*、family-events-messages/lambda/**/*
  - 例外/異常系：スクリプト内のパス参照が壊れる可能性があるため、相対パスを確認・修正する
  - バッチファイル修正対象：
    - deploy-backend.sh: INFRA_DIRのパス参照を修正（`${HOME}/work/ouma-events-infra` → 統合後のパス）
    - build-lambda.sh: プロジェクトルートのパス参照を確認・修正
    - build-batch-code.sh: プロジェクトルートのパス参照を確認・修正
    - その他のスクリプト: 統合後のディレクトリ構造に合わせてパス参照を修正
  - 受け入れ条件（Acceptance）：
    - 統合後のスクリプトが正常に実行できる
    - Lambda関数が正常にデプロイできる
    - 既存のバッチ処理が正常に動作する
    - ビルド・デプロイ手順が既存の動作を維持している

- FR-04：ドキュメントの新規作成
  - 説明：docs配下のテンプレートに基づいて、統合後のシステムのドキュメントを新規作成する
  - 入力：docs配下のテンプレート、統合後のコード構造
  - 出力：docs/01_REQUIREMENTS/requirements.md、docs/02_DESIGN/*.md、docs/03_OPERATIONS/runbook.md
  - 例外/異常系：既存ドキュメントの情報が不足している場合は、コードから推測して記載する
  - 受け入れ条件（Acceptance）：
    - すべてのテンプレート項目が埋まっている
    - docs/00_INDEX.mdからすべてのドキュメントにアクセスできる
    - ドキュメントとコードの整合性が保たれている

---

### 5.2 非機能要件（Non-Functional）
> 実務で崩れやすいので必ず書く。分からなければ仮置きして明示する。

#### 性能（Performance）
- 期待性能：統合後も既存の性能を維持する（統合による性能劣化は許容しない）
- 目標レスポンス：既存のレスポンス時間を維持
- 許容バッチ時間（該当時）：既存のバッチ処理時間を維持

#### 可用性（Availability）
- 目標稼働：統合後も既存の稼働率を維持する（統合によるダウンタイムは許容しない）
- 障害時の許容：統合作業中に既存システムが停止しないこと

#### セキュリティ（Security）
- 認証/認可：既存の認証・認可機構を維持する
- 取り扱う機密情報：既存のシークレット管理を維持する
- ログに残してよい/悪い情報：既存のログ出力方針を維持する

#### 運用（Operations）
- 監視/アラート（必要なら）：既存の監視・アラート設定を維持する
- ロールバック方針：統合に問題が発生した場合、元のリポジトリに戻すことができること
- 運用手順の格納先：`docs/03_OPERATIONS/runbook.md`

#### 監査/証跡（Audit）
- Issueに残すべき証跡：統合作業の実施内容、検証結果、問題発生時の対応
- Notionに残すべきまとめ：統合後のシステム構成、ドキュメント構造、運用上の注意点

---

## 6. データ要件（Data Requirements）
- データソース：統合対象外（既存のデータソースを維持）
- 正規化/変換（必要なら）：統合対象外
- 保存先：統合対象外（既存のデータ保存先を維持）
- データ品質（欠損/重複/フォーマット）：統合対象外

---

## 7. 制約（Constraints）
- 技術的制約：
  - 既存の動作を維持する必要がある（統合による機能変更は不可）
  - TypeScript、Node.js、AWS CDKの既存バージョンを維持する
  - 既存のパッケージ依存関係を維持する
- 期限/コスト制約：
  - 統合作業中に既存システムが停止しないこと
  - 統合による追加コストは発生しないこと
- 外部依存（API、権限、第三者）：
  - 既存のAWSリソースへの依存を維持する
  - 既存の外部APIへの依存を維持する

---

## 8. 受け入れ基準（Acceptance Criteria）
> Checkフェーズで「OK/NG」を判断するための基準。  
> “動いた気がする” を排除する。

- AC-01：インフラコードの統合完了
  - family-events-messages/infra/配下にCDKスタックコードが統合されている
  - app-stack.ts内の4つのパス参照が統合後のパスに修正されている
  - `npm run build`が正常に実行できる
  - `npx cdk synth`が正常に実行できる
  - 既存のインフラリソース定義が変更されていない（diff確認）

- AC-02：アプリケーションコードの統合完了
  - family-events-messages/packages/*配下にアプリケーションコードが統合されている
  - package.jsonのworkspaces設定が`["infra", "packages/*"]`に更新されている
  - `npm install`が正常に実行できる
  - `npm run build`が正常に実行できる
  - 既存のアプリケーション機能が正常に動作する（動作確認）

- AC-03：スクリプト・Lambda関数の統合完了
  - family-events-messages/scripts/*配下にスクリプトが統合されている（テストコードは除外）
  - family-events-messages/lambda/*配下にLambda関数コードが統合されている
  - バッチファイル内のパス参照が統合後のパスに修正されている
  - 統合後のスクリプトが正常に実行できる
  - Lambda関数が正常にデプロイできる
  - 既存のビルド・デプロイ手順が正常に動作する

- AC-04：ドキュメントの新規作成完了
  - docs/01_REQUIREMENTS/requirements.mdが更新されている
  - docs/02_DESIGN/*.mdが作成されている
  - docs/03_OPERATIONS/runbook.mdが更新されている
  - docs/00_INDEX.mdからすべてのドキュメントにアクセスできる

---

## 9. Done（完了条件：Planで確定）
> `/action` で Plan Issue をCloseできる条件。

- [ ] Plan Issue の子Taskが全て Close されている
- [ ] 受け入れ基準（Acceptance Criteria）を満たす
- [ ] 変更履歴（`docs/01_REQUIREMENTS/changes.md`）が更新されている
- [ ] 運用手順（`docs/02_OPERATIONS/runbook.md`）が更新されている
- [ ] AI Knowledge（`docs/03_AI_KNOWLEDGE/INDEX.md,README.md`）が更新されている
- [ ] Notion が最終化されている

---

## 10. 変更方針（Change Policy）
- 仕様変更が必要になった場合：
  - `/plan` に差し戻して requirements を更新する
  - 変更内容は `docs/01_REQUIREMENTS/changes.md` に記録する
  - 影響がある Task は Plan Issue 側で再整理する（Task増殖はしない）

---

## 11. メモ（任意）
- 統合の順序：
  1. インフラコードの統合（ouma-events-infra → family-events-messages/infra）
  2. アプリケーションコードの統合（ouma-family-event/packages → family-events-messages/packages）
  3. スクリプト・Lambda関数の統合（ouma-family-event/scripts, lambda → family-events-messages）
  4. パス参照の修正（app-stack.ts、バッチファイル）
  5. 動作確認（ビルド確認、動作確認）
- Git履歴：
  - 統合時は新規コミットとして扱う（Git履歴は保持しない）
  - 統合ブランチを作成してコミットする
- 動作確認方法：
  - ビルド確認：`npm run build`、`npx cdk synth`
  - 動作確認：既存機能の動作確認（E2Eテストは実施しない）
  - 動画形式での記録は不要
- テストコード：
  - 既存のテストコードは統合しない
  - 運用バッチのみ統合する
