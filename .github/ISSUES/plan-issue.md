---
title: "[Plan] 計画概要：リポジトリ統合（ouma-events-infra + ouma-family-event）"
labels: ["type:overview","phase:plan"]
---

## 0. 参照（SSOT）
- docs/00_INDEX.md：docs/00_INDEX.md
- requirements：docs/01_REQUIREMENTS/requirements.md
- design：docs/02_DESIGN/

---

## 1. 背景・目的（Why）
- 背景：
  - インフラコード（ouma-events-infra）とアプリケーションコード（ouma-family-event）が別リポジトリに分散している
  - ドキュメントが複数ディレクトリに散在し、管理が困難
  - 開発・運用時の参照先が不明確
- 目的：
  - インフラコードとアプリケーションコードを単一リポジトリ（family-events-messages）に統合
  - docs配下のテンプレートに基づいた統一的なドキュメント構造を確立
  - 既存の動作を維持したまま、コードとドキュメントの整合性を確保

---

## 2. ゴール（Done定義）
このPlanをCloseできる条件（Actionで検証する）：
- [ ] 全Task IssueがClose済み
- [ ] requirementsのDone条件を満たす
- [ ] docs（Knowledge/Runbook/Changes/Index）更新済み
- [ ] Notion最終まとめ更新済み

---

## 3. スコープ（Scope）
### 対象
- 対象機能：
  - インフラコード（CDKスタック）の統合
  - アプリケーションコード（packages/*）の統合
  - スクリプト・Lambda関数の統合
  - ドキュメントの新規作成
- 対象コンポーネント：
  - ouma-events-infra/lib/stacks/*.ts
  - ouma-family-event/packages/*
  - ouma-family-event/scripts/*（テストコード除外）
  - ouma-family-event/lambda/*
- 対象ファイル/ディレクトリ：
  - ~/work/ouma-events-infra/ → family-events-messages/infra/
  - ~/work/ouma-family-event/packages/* → family-events-messages/packages/*
  - ~/work/ouma-family-event/scripts/* → family-events-messages/scripts/*
  - ~/work/ouma-family-event/lambda/* → family-events-messages/lambda/*

### 対象外（やらないこと）
- 既存ドキュメントの統合（ouma-family-event/doc/*, doc_work/*）
- テストコードの統合（ouma-family-event/scripts/testing/*）
- 既存の動作・機能の変更
- インフラリソースの再デプロイ（コード統合のみ）

---

## 4. 要件（Requirements）
### 機能要件
- FR-01：インフラコードの統合（app-stack.ts内のパス参照修正含む）
- FR-02：アプリケーションコードの統合（package.jsonのworkspaces設定更新含む）
- FR-03：スクリプト・Lambda関数の統合（バッチファイルのパス参照修正含む）
- FR-04：ドキュメントの新規作成

詳細は requirements.md を参照

### 非機能要件（運用/性能/セキュリティ）
- 既存の動作を維持する（統合による機能変更は不可）
- 統合作業中に既存システムが停止しないこと
- 統合による追加コストは発生しないこと

---

## 5. 設計方針（Plan確定：Do/Checkで変えない）
- 方針：
  - モノレポ構成として統合（infraとpackagesを同じworkspaceに含める）
  - 統合時は新規コミットとして扱う（Git履歴は保持しない）
  - パス参照は統合後に一括で修正する
- 代替案：
  - Git履歴を保持する方法（git subtree/submodule）
  - 段階的な統合（一部ずつ統合）
- 採用理由：
  - 新規コミットとして扱うことで、統合の簡潔性を確保
  - パス参照を一括で修正することで、エラーの早期発見が可能
- 影響範囲：
  - app-stack.ts内の4つのパス参照
  - バッチファイル内のパス参照（INFRA_DIR等）
  - package.jsonのworkspaces設定
- ロールバック方針（必要なら）：
  - 統合に問題が発生した場合、元のリポジトリに戻すことができること

---

## 6. Task一覧（Planで"全量確定"）
> Do/Checkでタスクを増やさない。追加が必要ならPlan差戻し。

| Task ID | 概要 | Issue | 状態 |
|---|---|---:|---|
| T-01 | インフラコードの統合（ouma-events-infra → family-events-messages/infra） | # | ⏳ |
| T-02 | アプリケーションコードの統合（ouma-family-event/packages → family-events-messages/packages） | # | ⏳ |
| T-03 | スクリプト・Lambda関数の統合（ouma-family-event/scripts, lambda → family-events-messages） | # | ⏳ |
| T-04 | パス参照の修正（app-stack.ts、バッチファイル） | # | ⏳ |
| T-05 | 動作確認（ビルド確認、動作確認） | # | ⏳ |
| T-06 | ドキュメントの新規作成（docs配下） | # | ⏳ |

状態凡例：⏳=未完了 / ✅=完了（Task Closeと一致させる）

---

## 7. リスク・懸念
- パス参照の修正漏れによるビルドエラー
- バッチファイルのパス参照修正漏れによる実行エラー
- 統合後の動作確認が不十分な場合の既存機能への影響
- package.jsonのworkspaces設定不備による依存関係エラー

---

## 8. Actionで追記する欄（最終反映）
（Actionでここを更新し、PlanをCloseする）

### 実績ベースの設計方針（差分）
- （Actionで追記）

### 振り返り
- 良かった点：（Actionで追記）
- 悪かった点：（Actionで追記）
- 次回改善：（Actionで追記）

### 知見の反映先
- AI Knowledge：docs/03_AI_KNOWLEDGE/knowledge.md
- Runbook：docs/02_OPERATIONS/runbook.md
- Changes：docs/01_REQUIREMENTS/changes.md
- Notion：<URL>

