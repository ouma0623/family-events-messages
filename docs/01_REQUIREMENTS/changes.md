# Changes（変更履歴 / 仕様変更ログ）

> このドキュメントは、本PJの変更履歴（仕様・挙動・運用影響）を記録する。  
> 実装中に仕様変更が発生した場合は `/plan` に差し戻し、requirements/design更新と合わせて本ログを追記する。  
> 「なぜ変えたか」「何が変わったか」「どこに影響するか」「どう確認したか」が追跡できることを目的とする。

---

## 記録ルール（運用）
- 追記タイミング：
  - 仕様変更確定時（Plan）
  - 最終整理（Action）
- 対象：
  - 仕様（要件/受け入れ基準/スコープ）の変更
  - 挙動が変わる実装変更
  - 運用に影響する変更（runbook更新が必要なもの）
- 例外：
  - 純粋なリファクタ（挙動不変）や微修正は原則不要  
    ※ただし将来調査に効く場合は記録してよい

---

## 変更履歴

### 2025-12-29（v2 / 変更ID: CHG-0002）
- 種別：機能追加 / 挙動変更
- 変更理由（Why）：
  - フロントエンドの表示を改善し、ユーザー体験を向上させるため
  - イベント検索UIを改善し、ユーザーがイベントを探しやすくするため
  - バックエンドで料金情報を取得し、カテゴリ分類を改善するため
- 変更概要（What）：
  - フロントエンド表示の改善：
    - おすすめ度（`recommendScore`）の表示を削除
    - 画像（`imageUrls`）の表示機能を追加（`EventCard`、イベント詳細ページ）
    - おすすめ理由（`recommendReasons`）の表示機能を追加（イベント詳細ページ）
    - 料金情報（`priceText`、`isFree`）の表示機能を追加（イベント詳細ページ）
  - イベント検索UIの改善：
    - キーワード検索からタグ選択式に変更
    - 大ジャンル（食べる・遊ぶ・見る・学ぶ）選択機能を追加
    - 小ジャンル（カテゴリ）選択機能を追加
    - 無料・有料選択機能を追加
  - バックエンドデータ処理の改善：
    - 料金ページ（`price.html`）からの料金情報取得機能を追加（`HtmlFetcher.fetchPrice`）
    - 料金情報抽出機能を追加（`extractFromPricePage`）
    - カテゴリ自動分類機能を追加（`categoryClassifier.ts`）
    - 既存データの再分類機能を追加（`weekly-ingest`バッチ実行時に自動適用）
- 影響範囲（Impact）：
  - docs：requirements.md、runbook.md、00_INDEX.mdを更新
  - コード：
    - `packages/frontend/src/components/EventCard.tsx`：おすすめ度削除、画像表示追加
    - `packages/frontend/src/components/SearchForm.tsx`：タグ選択式UIに変更
    - `packages/frontend/src/app/events/page.tsx`：おすすめ度削除、画像表示追加、おすすめ理由表示追加、料金情報表示追加
    - `packages/frontend/next.config.js`：外部画像URL許可設定追加
    - `packages/ingestion/src/fetchers/html.ts`：`fetchPrice`メソッド追加
    - `packages/ingestion/src/parsers/html.ts`：`extractFromPricePage`関数追加
    - `packages/ingestion/src/mappers/html.ts`：`pricePage`フィールド追加
    - `packages/ingestion/src/normalizers/html.ts`：料金情報設定、カテゴリ分類適用
    - `packages/batch/src/weekly-ingest.ts`：料金ページ取得処理追加
    - `packages/common/src/utils/categoryClassifier.ts`：新規作成
  - データ：DynamoDBに`priceText`、`isFree`、`raw.categoryClassifications`フィールドが追加される
  - インフラ：なし
  - 運用：テストスクリプト追加（`scripts/test/verify-frontend-display.sh`、`scripts/test/verify-search-ui.sh`、`scripts/test/verify-backend-data.sh`）
- 関連リンク：
  - Plan Issue：#23
  - Task Issue：#24, #25, #26, #27, #28, #29, #30, #31
  - PR：なし（直接コミット）
  - Notion：docs/90_NOTION/20251229/notion.md（作成予定）
- 検証（How to Verify）：
  - 観点：コードレビュー、テストスクリプト実行、DynamoDBデータ確認、UI表示確認
  - 手順：
    1. コードレビュー：各ファイルの実装を確認
    2. テストスクリプト実行：`bash scripts/test/verify-frontend-display.sh`、`bash scripts/test/verify-search-ui.sh`、`bash scripts/test/verify-backend-data.sh`
    3. バッチ実行：`bash scripts/operation/run-batch.sh weekly-ingest`
    4. DynamoDBデータ確認：`aws dynamodb scan`で料金情報・カテゴリ分類情報を確認
    5. フロントエンドデプロイ：`bash scripts/operation/deploy-frontend.sh`
    6. UI表示確認：https://web.oumasan.org にアクセスしてUI変更を確認
  - 結果：
    - コードレビュー：完了
    - テストスクリプト：すべてPASS（フロントエンド：13/13、バックエンド：3/3）
    - バッチ実行：完了（185件のイベントが再分類）
    - DynamoDBデータ確認：完了（料金情報・カテゴリ分類情報が保存されている）
    - UI表示確認：完了（ユーザー確認済み）

### 2025-12-28（v1 / 変更ID: CHG-0001）
- 種別：仕様変更 / 挙動変更
- 変更理由（Why）：
  - インフラコード（ouma-events-infra）とアプリケーションコード（ouma-family-event）を単一リポジトリ（family-events-messages）に統合するため
  - コードとドキュメントの一元管理を実現するため
- 変更概要（What）：
  - ouma-events-infraのコードをfamily-events-messages/infra/に統合
  - ouma-family-event/packages/*をfamily-events-messages/packages/*に統合
  - ouma-family-event/scripts/*（テストコード除外）をfamily-events-messages/scripts/operation/に統合
  - ouma-family-event/lambda/*をfamily-events-messages/lambda/に統合
  - app-stack.ts内の4つのパス参照を統合後のパスに修正（`../../../assets/`、`../../../lambda/`）
  - deploy-backend.sh内のINFRA_DIRを統合後のパスに修正
  - package.jsonにworkspaces設定を追加（`["infra", "packages/*"]`）
  - infra/tsconfig.jsonに`types: ["node"]`と`typeRoots`を追加
- 影響範囲（Impact）：
  - docs：requirements.md、architecture.md、functional_spec.md、basic_design.md、00_INDEX.mdを更新
  - コード：infra/lib/stacks/*.ts、packages/*、scripts/operation/*.sh、lambda/ec2-launcher/*
  - データ：なし
  - インフラ：パス参照の修正により、統合後のビルド・デプロイが正常に動作することを確認
- 関連リンク：
  - Plan Issue：#6
  - Task Issue：#7, #8, #9, #10, #11, #12
  - PR：なし（統合作業）
  - Notion：docs/90_NOTION/20251228/notion.md
- 検証（How to Verify）：
  - 観点：ビルド確認、CDKのsynth確認、パス参照の確認
  - 手順：
    1. ビルド確認：`cd infra && npm run build`
    2. CDKのsynth確認：`cd infra && npm run cdk synth`
    3. パス参照の確認：`grep -r "../../../assets/" infra/lib/stacks/`
    4. パス参照の確認：`grep -r "../../../lambda/" infra/lib/stacks/`
  - 結果：
    - ビルド確認：成功
    - CDKのsynth確認：成功
    - パス参照の確認：統合後のパスに修正されていることを確認
