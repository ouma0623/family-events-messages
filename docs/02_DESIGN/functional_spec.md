# Functional Spec（機能仕様 / 要件→実装の橋渡し）

本ドキュメントは requirements を機能単位に分解し、実装・テスト・運用に繋げるための仕様書である。  
SSOT：requirements（docs/01_REQUIREMENTS/requirements.md）を前提とし、矛盾する場合は requirements を更新する。

---

## 0. メタ情報
- 最終更新日：YYYY-MM-DD
- Plan Issue：#XXXX
- 関連：docs/00_INDEX.md

---

## 1. 参照
- Requirements：docs/01_REQUIREMENTS/requirements.md
- Changes：docs/01_REQUIREMENTS/changes.md
- Runbook：docs/02_OPERATIONS/runbook.md
- Architecture：docs/04_DESIGN/architecture.md
- Basic Design：docs/04_DESIGN/basic_design.md

---

## 2. 用語・前提（Glossary）
| 用語 | 意味 |
|---|---|
| | |

---

## 3. スコープ（要約）
### 3.1 In Scope（今回やる）
- 

### 3.2 Out of Scope（今回やらない）
- 

---

## 4. ユースケース（Use Cases）
> requirements の UC をここに写経してもよい。最小限でOK。

- UC-01：
  - 主体：
  - 入力：
  - 期待結果：

---

## 5. 機能一覧（Feature List）
> 実装・Issue分割の単位。IDは後で変えてもOK。

| Feature ID | 機能名 | 概要 | 要件ID対応（FR/AC） | 優先度 |
|---|---|---|---|---|
| F-01 |  |  | FR-xx / AC-xx | High |
| F-02 |  |  |  | Mid |

---

## 6. 機能仕様（Feature Specs）

### F-01：<機能名>
#### 目的
- 

#### 入力
- 画面/CLI/API：
- パラメータ：
- バリデーション：

#### 出力
- 返却データ：
- 表示：
- 生成物（ファイル等）：

#### 処理フロー（要点）
1. 
2. 
3. 

#### 例外・異常系
- 
- リトライ方針（必要なら）：

#### ログ（要点）
- 何を残すか：
- 何を残さないか（機密・PII）：

#### Acceptance（受け入れ条件）
- AC-xx をここに対応づけて列挙
- 

#### 関連（Design/Implementation）
- 主要モジュール：
- 影響範囲：
- 関連Issue：#YYYY

---

### F-02：<機能名>
（同様に）

---

## 7. テスト観点（設計レベル）
> テストコードやテスト“スクリプト”の置き場所は runbook 参照。ここは観点のみ。

- 観点：
  - 正常系：
  - 異常系：
  - 境界値：
- 受け入れ基準（requirements の AC）との対応：
  - AC-01 → 観点xx
  - AC-02 → 観点yy

---

## 8. 運用観点（設計レベル）
- 監視/アラート（必要なら）：
- 手動オペレーションが必要な箇所：
- scripts が必要になりそうな箇所：
  - 運用バッチ：scripts/operation/（作成したら runbook 更新必須）
  - テスト実行：scripts/test/（作成したら runbook 更新必須）

---

## 9. 未確定事項（Planで潰す）
- 
