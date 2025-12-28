# Architecture（構成図 / 責務境界 / 非機能方針）

本ドキュメントはシステム全体の構成・責務境界・非機能の方針を定義する。  
詳細実装は basic_design に落とす。

---

## 0. メタ情報
- 最終更新日：YYYY-MM-DD
- Plan Issue：#XXXX
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

- Client：
- API：
- Worker/Batch：
- Storage：
- Observability（ログ/メトリクス）：

### 2.2 データフロー（要点）
1. 
2. 
3. 

---

## 3. コンポーネント責務（Boundary）
| コンポーネント | 責務 | 入出力 | 依存 |
|---|---|---|---|
| | | | |

---

## 4. インタフェース（外部/内部）
- 外部I/F（例：外部API、スクレイピング元、外部DB等）：
  - 認証：
  - レート制限：
  - エラー時の扱い：
- 内部I/F（例：モジュール間、キュー、イベント等）：

---

## 5. 非機能方針（Design Policy）
> requirements の非機能を「設計方針」に落とす。

### 5.1 セキュリティ
- 認証/認可：
- シークレット管理：
- ログに出してはいけない情報：

### 5.2 可用性
- 障害点：
- リトライ/冪等：
- タイムアウト：

### 5.3 性能
- ボトルネック候補：
- キャッシュ（必要なら）：
- 並列/分割（必要なら）：

### 5.4 運用
- Runbook に落とす項目：
  - 定常作業
  - 手動オペ
  - scripts/operation、scripts/test の管理

---

## 6. ログ設計（要点）
- 形式（例：JSON推奨）：
- キー項目（例：requestId、featureId、issueId 等）：
- エラー分類：

---

## 7. 変更に強い設計（拡張性）
- 追加要件が来た時の伸ばし方：
- 依存の切り方：

---

## 8. リスクと対策（Architecture Level）
| リスク | 影響 | 対策 |
|---|---|---|
| | | |

---

## 9. 未確定事項
- 
