# K-0003: DynamoDBネイティブJSON形式のパースエラー

## 種別
Pitfall（落とし穴）

## 重要度
High

## 概要
DynamoDBから取得したデータを`jq`でパースする際、DynamoDBのネイティブJSON形式（`{"S": "value"}`, `{"L": [...]}`, `{"M": {...}}`など）を正しくパースできず、テストが失敗する問題。

## 発生状況
- 日付：2025-12-29
- プロジェクト：family-events-messages
- Issue：#24, #25, #26（バックエンドデータ処理確認テスト）

## 問題の詳細

### 症状
`scripts/test/verify-backend-data.sh`でDynamoDBデータを確認する際、以下のようなエラーが発生：

```bash
# 期待していたパス
.raw.categoryClassifications.majorGenre

# 実際のDynamoDB形式
.raw.categoryClassifications.L[0].M.majorGenre.S
```

### 原因
DynamoDBの`scan`コマンドは、デフォルトでネイティブJSON形式でデータを返す。`jq`でパースする際、この形式を正しく理解していないと、期待するパスでデータにアクセスできない。

### 影響範囲
- バックエンドデータ処理確認テスト（`verify-backend-data.sh`）
- DynamoDBデータの検証作業全般

## 解決方法

### 方法1: DynamoDBネイティブJSON形式を正しくパースする（推奨）
`jq`のパスをDynamoDBのネイティブJSON形式に合わせて修正する：

```bash
# 文字列（String）の場合
.raw.categoryClassifications.L[0].M.majorGenre.S

# リスト（List）の場合
.raw.categoryClassifications.L

# マップ（Map）の場合
.raw.categoryClassifications.L[0].M
```

### 方法2: DynamoDBの出力形式を変更する
`aws dynamodb scan`に`--output json`オプションを追加し、通常のJSON形式で取得する（ただし、これはDynamoDBのネイティブ形式を変換するため、型情報が失われる可能性がある）。

## 実装例

### 修正前（誤り）
```bash
# このパスではデータにアクセスできない
jq -r '.Items[0].raw.categoryClassifications.majorGenre' <<< "$OUTPUT"
```

### 修正後（正しい）
```bash
# DynamoDBのネイティブJSON形式を正しくパース
jq -r '.Items[0].raw.categoryClassifications.L[0].M.majorGenre.S // empty' <<< "$OUTPUT"
```

## 予防策
1. DynamoDBのデータ構造を事前に確認する（`aws dynamodb scan`で実際の出力を確認）
2. `jq`のパスをDynamoDBのネイティブJSON形式に合わせて設計する
3. テストスクリプトで実際のDynamoDBデータを使用して検証する

## 関連ファイル
- `scripts/test/verify-backend-data.sh`
- Issue #24, #25, #26

## 参考
- [AWS DynamoDB JSON形式](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.LowLevelAPI.html#Programming.LowLevelAPI.DataTypeDescriptors)
- [jq マニュアル](https://stedolan.github.io/jq/manual/)

