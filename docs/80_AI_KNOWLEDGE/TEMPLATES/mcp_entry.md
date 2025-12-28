# M-XXXX：<タイトル>

- 種別：MCP Playbook
- 最終更新：YYYY-MM-DD
- 対象：GitHub / Notion / docs / その他
- 目的：<例：Plan Issue作成→子Task作成→docsリンク同期>
- 関連（参照）：
  - Plan Issue：#XXXX
  - Task Issue：#YYYY, #ZZZZ
  - PR：#PPPP
  - Docs：docs/00_INDEX.md / docs/01_REQUIREMENTS/ / docs/03_OPERATIONS/ / docs/02_DESIGN/
  - Knowledge：docs/80_AI_KNOWLEDGE/INDEX.md
  - Notion：<URL>

---

## 0. 失敗しないための前提（必読）
- 正（SSOT）の優先順位：
  1. docs（requirements/design）
  2. GitHub Issue（作業状態・証跡）
  3. Notion（最終まとめ・共有）
- AI Knowledge の正は `docs/80_AI_KNOWLEDGE/`（03は使わない）
- scripts 作成ルール：
  - 運用バッチ：scripts/operation/（作成・変更時は runbook 更新必須）
  - テスト実行スクリプト：scripts/test/（作成・変更時は runbook 更新必須）
- 仕様が曖昧／矛盾している場合：
  - 実行を止めて /plan に差し戻す（勝手に決めない）

---

## 1. 入力（このPlaybookが必要とする情報）
- 対象フェーズ：Plan / Do / Check / Action
- 対象Issue：
  - 親Plan：#XXXX（ある場合）
  - 子Task：#YYYY（ある場合）
- 対象Docs：
  - requirements：docs/01_REQUIREMENTS/requirements.md
  - changes：docs/01_REQUIREMENTS/changes.md
  - design：docs/02_DESIGN/*.md
  - runbook：docs/03_OPERATIONS/runbook.md
  - knowledge：docs/80_AI_KNOWLEDGE/INDEX.md（必要な場合）
- Notion：
  - ページURL：
  - 反映方針（要約のみ／リンク集／全文同期はしない等）：

---

## 2. 手順（Read → Update → Verify → Report）
> MCPで自動化する場合も、この順序を崩さない（事故を減らす）

### 2.1 Read（現状把握）
- docs/00_INDEX.md を読み、正しい参照先に揃っているか確認
- requirements / design の整合を確認（矛盾があれば /plan 差し戻し）
- GitHub Issue の状態確認：
  - 親Planの有無
  - 子Taskの有無
  - ラベル・状態（Plan/Do/Check/Action）が期待通りか
- Notion の現状確認：
  - すでに同一テーマのページがあるか
  - リンクが最新か

### 2.2 Update（更新）
- docs 更新（必要な範囲だけ、SSOT優先）
  - requirements / changes / design / runbook / 00_INDEX / 80_AI_KNOWLEDGE
- GitHub 更新
  - Plan：親Issue作成 or 更新（計画概要・子Task一覧・リンク）
  - Do/Check：子Task Issue を更新（時系列ログ＋証跡＋差し戻し先明記）
  - Action：親Planを実績で更新→Close
- Notion 更新
  - 目的：最終まとめ（再現可能な粒度）
  - 形式：リンク集 + 要約（推奨）
  - DocsやIssueのURLを必ず貼る（NotionをSSOTにしない）

### 2.3 Verify（整合チェック）
- docs ↔ Issue ↔ Notion のリンクが相互に辿れること
- 参照パスが実在すること（存在しないパスを置かない）
- scripts を作成した場合：
  - scripts/operation または scripts/test に格納されている
  - runbook.md が更新されている
- Knowledge を追加した場合：
  - docs/80_AI_KNOWLEDGE/<category>/ に1ファイルで存在する
  - INDEX.md が更新されている

### 2.4 Report（報告形式）
> MCP実行後、AIは必ずこの形式で「何をしたか」を返す  
（人間がレビューしやすい・差分が追える）

- 実施サマリ（3行以内）
- 更新したファイル一覧（パス列挙）
- 追加/更新したIssue一覧（番号列挙）
- Notion反映先（URL）
- 残タスク／差し戻し（Plan/Do/Checkのどこへ戻るか）
- 注意点（運用影響やロールバック）

---

## 3. コマンド実行テンプレ（MCPに渡す指示文の型）
> MCP経由で「自動でやって」と依頼する際の“固定文”。必要に応じて改変してOK。

```text
目的：<例：Plan Issue作成→子Task作成→docsリンク同期>

制約：
- docs がSSOT。Notionは最終まとめ（リンク＋要約）
- AI Knowledge は docs/80_AI_KNOWLEDGE を正とする
- scripts を作成/変更した場合は docs/03_OPERATIONS/runbook.md を必ず更新

手順（必ずこの順で）：
1) Read：docs/00_INDEX.md / requirements / design / Issue / Notion を確認
2) Update：docs→Issue→Notion の順で必要箇所だけ更新
3) Verify：リンク/参照パス/Knowledge INDEX/runbook をチェック
4) Report：実施内容をテンプレ形式で報告
