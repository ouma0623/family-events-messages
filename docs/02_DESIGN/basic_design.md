# Basic Design（基本設計 / 実装の骨格）

本ドキュメントは、機能仕様（functional_spec）およびアーキテクチャ設計（architecture）をもとに、
実装可能な粒度まで設計を具体化するための基本設計書である。
詳細設計やコードの最終形は Do フェーズで Issue とともに更新する。

---

## 0. メタ情報
- 最終更新日：YYYY-MM-DD
- Plan Issue：#XXXX
- 関連：docs/00_INDEX.md

---

## 1. 参照
- Requirements：docs/01_REQUIREMENTS/requirements.md
- Changes：docs/01_REQUIREMENTS/changes.md
- Functional Spec：docs/04_DESIGN/functional_spec.md
- Architecture：docs/04_DESIGN/architecture.md
- Runbook：docs/02_OPERATIONS/runbook.md

---

## 2. ディレクトリ / モジュール構成（案）
> 実際の構成に合わせて更新する。Plan フェーズで確定する。

- src/
  - （アプリケーションコード）
- scripts/operation/
  - 運用バッチ・スクリプト
  - 作成・更新時は runbook.md を必ず更新する
- scripts/test/
  - テスト実行用スクリプト
  - 作成・更新時は runbook.md を必ず更新する

---

## 3. 主要コンポーネント設計

### 3.1 <Component A>
- 責務：
- 入力：
- 出力：
- 依存：
- 例外・エラー：
- ログ：

### 3.2 <Component B>
- 責務：
- 入力：
- 出力：
- 依存：
- 例外・エラー：
- ログ：

---

## 4. データ設計（必要な場合）

### 4.1 データモデル
| 項目 | 型 | 必須 | 説明 |
|---|---|---|---|
| | | | |

### 4.2 変換・正規化ルール
- 変換方針：
- 欠損データの扱い：
- 重複データの扱い：

---

## 5. 画面 / CLI / API 設計（該当時）

### 5.1 エンドポイント一覧
| 名称 | Method | Path | 入力 | 出力 | 認可 |
|---|---|---|---|---|---|
| | | | | | |

### 5.2 リクエスト / レスポンス例
```json
{
  "example": "..."
}
```

---

## 6. エラーハンドリング方針
- エラー分類：
- リトライ方針：
- 失敗時の戻り値・終了コード：
- ログ出力ルール：
- ユーザー / オペレーターへの通知：

---

## 7. テスト設計（要点）
> 実装コードやテストスクリプトの配置は runbook に従う。
ここでは設計レベルの観点のみを記載する。

- Unit テスト：
- Integration テスト：
- E2E テスト（必要な場合）：
- テストデータ：
- モック / スタブ方針：

---

## 8. 運用設計（要点）
- 定常運用：
- 手動オペレーション：
- scripts が必要な箇所：
  - operation：scripts/operation/
  - test：scripts/test/
- 監視・アラート（必要な場合）：

---

## 9. 実装タスクへの落とし込み
> Plan フェーズで子 Task Issue を全量作成する前提。

| Task | 対象 Feature | 概要 | Issue |
|---|---|---|---|
| T-01 | F-01 | | #YYYY |
| T-02 | F-02 | | #ZZZZ |

---

## 10. 未確定事項（Plan フェーズで解消）
- 
