# Docs Index（Project Hub / Navigation）

> 本ドキュメントは **参照ハブ（索引・館内マップ）** です。  
> 「●●のときはどこを見るか」を最短で示します。  
> 手順やチェックリストは `docs/03_OPERATIONS/runbook.md` に集約します。

---

## 1. プロジェクト固有（下書きOK：/planで埋まっていく）

### 1.1 状態
- フェーズ：Action（統合システムのデプロイ・動作確認）
- 最終更新日：2025-12-28

### 1.2 GitHub（状態機械）
- 親Plan Issue：
  - #6（https://github.com/ouma0623/family-events-messages/issues/6）- 統合プロジェクト（完了）
  - #13（https://github.com/ouma0623/family-events-messages/issues/13）- 統合システムのデプロイ・動作確認（完了）
- 子Task Issues（Plan #13）：
  - #14（T-01：デプロイスクリプトの修正）- 完了
  - #15（T-02：インフラのデプロイ）- 完了
  - #16（T-03：バックエンドのデプロイ）- 完了
  - #17（T-04：フロントエンドのデプロイ）- 完了
  - #18（T-05：Lambdaバッチの動作確認）- 完了
  - #19（T-06：EC2スポットインスタンスの起動確認）- 完了
  - #20（T-07：フロントエンドの動作確認）- 完了
  - #21（T-08：バックエンドAPIの動作確認）- 完了
  - #22（T-09：データ収集バッチの実行）- 完了
- 関連PR：URL（必要に応じて）

### 1.3 Notion（最終まとめ）
- Notion PJページ：
  - docs/90_NOTION/20251228/notion.md（統合プロジェクト）
  - docs/90_NOTION/20251228/notion-deployment.md（デプロイ・動作確認）

---

## 2. 仕様（SSOT）
- 要件：`docs/01_REQUIREMENTS/requirements.md`
- 変更履歴：`docs/01_REQUIREMENTS/changes.md`

---

## 3. 設計
- 機能仕様：`docs/02_DESIGN/functional_spec.md`
- 構成図/方針：`docs/02_DESIGN/architecture.md`
- 基本設計：`docs/02_DESIGN/basic_design.md`

---

## 4. 運用・再現手順（Operations）
- Runbook：`docs/03_OPERATIONS/runbook.md`

### scripts（配置ルール：要約）
- 運用バッチ/スクリプト：`scripts/operation/`
  - 追加・変更時は `runbook.md` 更新必須
- テスト実行用スクリプト：`scripts/test/`
  - 追加・変更時は `runbook.md` 更新必須

---

## 5. AI Knowledge（再利用知見）
- docs/80_AI_KNOWLEDGE/README.md（使い方・運用・管理）
- docs/80_AI_KNOWLEDGE/INDEX.md（一覧）
- docs/80_AI_KNOWLEDGE/{decision,pitfall,pattern,prompt,mcp}/

---

## 6. AI運用ルール（Cursor）
- 不変原則：`.cursor/rules/general.mdc`
- 実行モデル：`.cursor/rules/execution_model.mdc`
- GitHub運用：`.cursor/rules/github.mdc`
- ディレクトリ：`.cursor/rules/directory.mdc`
- 環境：`.cursor/rules/environment.mdc`
- アプリ：`.cursor/rules/app_code.mdc`
- インフラ：`.cursor/rules/infra_code.mdc`

---

## 7. 困ったときのナビ
- 仕様が分からない → 2（要件）
- 設計を確認したい → 3（設計）
- 実行方法/再現手順 → 4（Runbook）
- 判断理由/知見 → 5（AI Knowledge）
- ルールを確認 → 6（Cursor Rules）
- 今どこまで進んだ？ → 1.2（Issue）
