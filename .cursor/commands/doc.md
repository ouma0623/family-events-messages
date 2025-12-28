# /doc
# Role: Documentation Rebuilder / Reverse Architect

## 【ルール理解チェック（必須・省略不可）】
各コマンド実行時、最初に以下を短く宣言してから作業を進める。

- 私は以下を理解し遵守する：
  1) docs は仕様の唯一の正
  2) Plan で 親Issue + 全Task Issue を確定（Do/Checkで増やさない）
  3) Do/Check は Task Issue を更新するだけ
  4) Action で docs/Notion に知見反映し、親Planを更新してClose
  5) MCP操作は Operation Plan に従い、実行後にID/URLで報告する

※ これを省略しない

---

## 目的
既存コード（アプリ / インフラ / スクリプト）を正（SSOT）として認識し、
本リポジトリで定義されたテンプレート・ルールに従って
docs 配下のドキュメントを **整理・再構築・新規作成** する。

設計書が存在しない / 破綻している / 古い場合でも、
コードを正として「説明可能な状態」に戻すことを目的とする。

---

## 適用条件
- 既存コードが存在すること
- 設計書が未整備・不完全・コードと乖離している場合
- 新規実装ではなく「再整理・棚卸し」が目的の場合

---

## 正（SSOT）の優先順位
1. 実際に動いているコード（app / infra / scripts）
2. 実行結果・挙動
3. docs（既存のものがあれば参考程度）
4. Notion / AI Knowledge（参照のみ・更新しない）

---

## 対象範囲（作成・更新）
/doc は以下を **必ず生成または整理** する。

### 作成・整理対象
- docs/00_INDEX.md
- docs/01_REQUIREMENTS/
  - requirements.md（現状仕様として）
  - changes.md（初期は空でも可）
- docs/03_OPERATIONS/
  - runbook.md（scripts が存在する場合）
- docs/04_DESIGN/
  - functional_spec.md
  - architecture.md
  - basic_design.md

### 除外対象（/doc では触らない）
- docs/80_AI_KNOWLEDGE/
- Notion

---

## 手順（必須順序）

### 1. Read（コード理解）
- アプリコードの責務・境界を把握
- インフラ構成（IaC / 手動設定含む）を把握
- scripts/operation / scripts/test の有無と役割を確認
- 実際の挙動・ログ・入出力を把握

### 2. Structure（構造化）
- 機能単位・責務単位に分解
- 実装されているがドキュメント化されていない機能を洗い出す
- 運用・手動作業の存在を明確化

### 3. Write（ドキュメント生成）
- 既存テンプレートに **必ず準拠** して記述する
  - `docs/02_DESIGN/functional_spec.md`（テンプレートとして参照）
  - `docs/02_DESIGN/architecture.md`（テンプレートとして参照）
  - `docs/02_DESIGN/basic_design.md`（テンプレートとして参照）
  - `docs/01_REQUIREMENTS/requirements.md`（テンプレートとして参照）
- テンプレートファイルが存在しない場合は、既存のファイルをテンプレートとして参照する
- 不明点・推測は「未確定事項」として明示する（勝手に決めない）
- 各ファイルの構造・必須項目は既存テンプレートに従う

### 4. Verify（整合チェック）
- docs ↔ コード ↔ scripts の整合が取れているか
- 参照パスが実在するか
- docs/03_OPERATIONS/runbook.md に scripts が反映されているか

### 5. Report（結果報告）
以下の形式で必ず報告する。

- 作成 / 更新した docs 一覧
- コードから読み取った仕様の要約
- 不明点・仮定した点
- Plan フェーズで再検討すべき点

---

## 出力後の遷移
- /doc 完了後は フェーズ：docを終了と明示する