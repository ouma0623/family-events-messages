# Docs Index（Project Hub / Navigation）

> 本ドキュメントは **参照ハブ（索引・館内マップ）** です。  
> 「●●のときはどこを見るか」を最短で示します。  
> 手順やチェックリストは `docs/03_OPERATIONS/runbook.md` に集約します。

---

## 1. プロジェクト固有（下書きOK：/planで埋まっていく）

### 1.1 状態
- フェーズ：Plan / Do / Check / Action（該当を残す）
- 最終更新日：YYYY-MM-DD

### 1.2 GitHub（状態機械）
- 親Plan Issue：#XXXX
- 子Task Issues：#YYYY, #ZZZZ
- 関連PR：URL（必要に応じて）

### 1.3 Notion（最終まとめ）
- Notion PJページ：<URL>

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
