# Runbook（運用・再現手順）

本ドキュメントは、本プロジェクトにおける
**運用手順・再現手順・障害時対応**を記録するための Runbook である。

- scripts を追加・変更した場合は、必ず本ドキュメントを更新する
- 実行できない手順は未完成とみなす
- チェックリストや判断基準は rules / Issue に従う

---

## 0. 前提情報（共通）

- 対象プロジェクト：family-events-messages（統合プロジェクト）
- 対象リポジトリ：https://github.com/ouma0623/family-events-messages
- 想定実行者：
  - 運用担当
  - 開発者
  - AI（Cursor + MCP）
- 対象環境：
  - local
  - dev
  - stg
  - prod
- 関連リンク：
  - docs hub：docs/00_INDEX.md
  - requirements：docs/01_REQUIREMENTS/requirements.md
  - Plan Issue：#6
  - Notion：docs/90_NOTION/20251228/notion.md

---

## 1. 通常運用フロー（概要）

- 通常時
  - 定常処理
  - バッチ実行
  - 状態確認
- 変更時
  - scripts 更新
  - runbook 更新
  - Issue に証跡を残す
- 障害時
  - 影響確認
  - 応急対応
  - ロールバックまたは恒久対応

---

## 2. scripts/operation（運用バッチ・スクリプト）

運用目的で実行するスクリプトを管理する。
新規作成・変更時は **必ず本章を更新する**。

### 2.1 一覧

| 名称 | パス | 目的 | 実行タイミング | 実行者 |
|---|---|---|---|---|
| deploy-backend.sh | scripts/operation/ | バックエンド（Lambda関数、API Gateway）のデプロイ | デプロイ時 | 開発者・運用担当 |
| build-lambda.sh | scripts/operation/ | Lambda関数のビルド | ビルド時 | 開発者 |
| build-batch-code.sh | scripts/operation/ | バッチコードのビルド | ビルド時 | 開発者 |
| build-lambda-layer.sh | scripts/operation/ | Lambda Layerのビルド | ビルド時 | 開発者 |
| deploy-frontend.sh | scripts/operation/ | フロントエンドのデプロイ | デプロイ時 | 開発者・運用担当 |
| check-logs.sh | scripts/operation/ | ログ確認 | 運用時 | 運用担当 |
| prepare-ami.sh | scripts/operation/ | AMI準備 | インフラ構築時 | 開発者 |
| run-batch.sh | scripts/operation/ | バッチ実行 | バッチ実行時 | 運用担当 |
| verify-build.sh | scripts/operation/ | ビルド検証 | ビルド後 | 開発者 | |

---

### 2.2 実行手順

#### 対象スクリプト
- 名称：
- パス：scripts/operation/<name>

#### 目的
- 何のために実行するか：

#### 前提条件
- 実行環境：
- 必要な権限：
- 事前確認（データ / 状態）：

#### 実行方法

```bash
# 実行コマンド例
```

#### 期待結果
- 正常時の挙動：
- 出力 / ログ：

#### 注意点
- 再実行可否：
- 二重実行リスク：
- 実行禁止時間帯（あれば）：

---

### 2.3 ロールバック手順（必須）

#### ロールバックが必要になるケース
- ：

#### 手順

```bash
# ロールバックコマンド例
```

#### ロールバック後の確認方法
- ：

---

## 3. scripts/test（テスト実行用スクリプト）

手動確認・疎通確認・E2E 補助など、
**テスト目的で実行するスクリプト**を管理する。

### 3.1 一覧

| 名称 | パス | 対象 | 実行タイミング |
|---|---|---|---|
| verify-frontend-display.sh | scripts/test/ | T-04, T-05, T-06, T-07 | 実装後、Checkフェーズ |
| verify-search-ui.sh | scripts/test/ | T-08 | 実装後、Checkフェーズ |
| verify-backend-data.sh | scripts/test/ | T-01, T-02, T-03 | バッチ完了後、Checkフェーズ |

---

### 3.2 実行手順

#### 3.2.1 verify-frontend-display.sh

**対象スクリプト**
- 名称：verify-frontend-display.sh
- パス：scripts/test/verify-frontend-display.sh

**目的**
- フロントエンド表示機能（T-04, T-05, T-06, T-07）のコードレビュー

**実行方法**
```bash
cd /home/oumasan/work/family-events-messages
bash scripts/test/verify-frontend-display.sh
```

**期待結果**
- すべてのテストがPASSする
- T-04: おすすめ度削除の確認
- T-05: 画像表示機能の確認
- T-06: おすすめ理由表示機能の確認
- T-07: 料金情報表示機能の確認

**NG 時の対応**
- 想定される原因：コード実装の不備
- 次のアクション：Do（実装修正）

#### 3.2.2 verify-search-ui.sh

**対象スクリプト**
- 名称：verify-search-ui.sh
- パス：scripts/test/verify-search-ui.sh

**目的**
- タグ選択式検索UI（T-08）のコードレビュー

**実行方法**
```bash
cd /home/oumasan/work/family-events-messages
bash scripts/test/verify-search-ui.sh
```

**期待結果**
- すべてのテストがPASSする
- T-08: タグ選択式検索UIの確認

**NG 時の対応**
- 想定される原因：コード実装の不備
- 次のアクション：Do（実装修正）

#### 3.2.3 verify-backend-data.sh

**対象スクリプト**
- 名称：verify-backend-data.sh
- パス：scripts/test/verify-backend-data.sh

**目的**
- バックエンドデータ処理（T-01, T-02, T-03）の確認（バッチ完了後）

**実行方法**
```bash
cd /home/oumasan/work/family-events-messages
bash scripts/test/verify-backend-data.sh
```

**期待結果**
- DynamoDBにデータが存在する
- T-01: 料金情報（priceText, isFree）が存在する
- T-02: カテゴリ分類（categoryClassifications）が存在する
- T-03: イベントが存在する

**NG 時の対応**
- 想定される原因：バッチ未完了、データ未取得
- 次のアクション：バッチ完了後に再実行

---

## 4. 障害対応（トラブルシューティング）

実際に発生した事象をベースに追記していく。

### 4.1 既知の事象

| 発生条件 | 症状 | 原因 | 対応 |
|---|---|---|---|
| | | | |

---

### 4.2 調査手順

1. 影響範囲の確認
2. ログ確認箇所：
3. 一次対応：
4. 恒久対応（必要なら）：

---

## 5. 変更履歴・関連

- 変更履歴：docs/01_REQUIREMENTS/changes.md
- 関連 Issue：
  - Plan：#XXXX
  - Task：#YYYY
- 関連 PR：#PPPP

---

## 6. メモ（任意）

- 環境依存事項：
- 将来の改善案：
