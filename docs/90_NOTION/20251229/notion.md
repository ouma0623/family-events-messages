# 📌 フロントエンド表示・検索UI改善、バックエンドデータ処理改善

## 🧭 概要
- プロジェクト：family-events-messages
- 種別：改修
- Plan Issue：#23
- リポジトリ：https://github.com/ouma0623/family-events-messages

---

## 📂 公式ドキュメント（SSOT）
※ 正は Git / docs。Notionは閲覧用。

- 📄 Docs Index：[docs/00_INDEX.md](../../00_INDEX.md)
- 📄 Requirements：[docs/01_REQUIREMENTS/requirements.md](../../01_REQUIREMENTS/requirements.md)
- 📄 Design：
  - [functional_spec.md](../../02_DESIGN/functional_spec.md)
  - [architecture.md](../../02_DESIGN/architecture.md)
  - [basic_design.md](../../02_DESIGN/basic_design.md)
- 📄 Operations：
  - [runbook.md](../../03_OPERATIONS/runbook.md)
- 📄 AI Knowledge：
  - [docs/80_AI_KNOWLEDGE/INDEX.md](../../80_AI_KNOWLEDGE/INDEX.md)

---

## 🧩 実施内容サマリ
> 詳細は Issue / Docs を参照

- 背景：
  - フロントエンドの表示が不十分（おすすめ度が不要、画像が表示されない、おすすめ理由が表示されない、料金情報が表示されない）
  - イベント検索UIがざっくりしすぎている（キーワード検索のみ）
  - バックエンドで料金情報が取得されていない（料金ページから取得していない）
  - カテゴリ分類が不十分（大ジャンル・小ジャンルに分類されていない）
- 実施内容：
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
- 影響範囲：
  - フロントエンド：`EventCard`、`SearchForm`、イベント詳細ページ
  - バックエンド：`HtmlFetcher`、`HtmlNormalizer`、`weekly-ingest`バッチ
  - データ：DynamoDBに`priceText`、`isFree`、`raw.categoryClassifications`フィールドが追加される

---

## 🗂 関連 Issue
- Plan：#23（https://github.com/ouma0623/family-events-messages/issues/23）
- Tasks：
  - #24（T-01：バックエンド：料金ページ取得機能の実装）
  - #25（T-02：バックエンド：カテゴリ自動分類機能の実装）
  - #26（T-03：バックエンド：既存データ再分類機能の実装）
  - #27（T-04：フロントエンド：おすすめ度削除）
  - #28（T-05：フロントエンド：画像表示機能の実装）
  - #29（T-06：フロントエンド：おすすめ理由表示機能の実装）
  - #30（T-07：フロントエンド：料金情報表示機能の実装）
  - #31（T-08：フロントエンド：タグ選択式検索UIの実装）

---

## 📌 レビュー / 注意点（抜粋）
- DynamoDBのネイティブJSON形式（`{"S": "value"}`, `{"L": [...]}`, `{"M": {...}}`など）を`jq`でパースする際は、正しいパスを使用する必要がある（K-0003参照）
- 料金ページの取得はエラーが発生しても処理を続行する（料金情報がないイベントもあるため）
- カテゴリ分類はキーワードベースで自動分類されるが、分類できない場合はデフォルト分類（「遊ぶ」）が適用される
- フロントエンドのデプロイ後、CloudFrontのキャッシュ無効化が必要（通常1-2分かかる）

---

## 🔗 外部リンク
- GitHub Repo：https://github.com/ouma0623/family-events-messages
- Pull Requests：なし（直接コミット）
- その他：
  - デプロイURL：https://web.oumasan.org
  - API URL：https://api.oumasan.org/v1





