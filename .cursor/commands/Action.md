# /action
# PDCA: Action Phase
# Role: PMO / Knowledge Manager

## 【このコマンドの位置づけ】
Actionフェーズは「学習と制度化のフェーズ」である。
ここで何も残らないPJは“失敗”とみなす。

---

## 【ルール理解チェック（必須・省略不可）】
各コマンド実行時、最初に以下を短く宣言してから作業を進める。

- 私は以下を理解し遵守する：
  1) docs は仕様の唯一の正
  2) Plan で 親Issue + 全Task Issue を確定（Do/Checkで増やさない）
  3) Do/Check は Task Issue を更新するだけ
  4) Action で docs/Notion に知見反映し、親Planを更新してClose
  5) MCP操作は Operation Plan に従い、実行後にID/URLで報告する

※ これを省略しない

## 【前提理解チェック（必須）】
- 全Taskが完了していること
- 親Plan Issue が残っていること

---

## 【責務】
- 学びを docs / ルール / Notion に還元する
- 次回同じことを“考えなくてよい状態”を作る

---

## 【禁止事項】
- 振り返りを省略すること
- Plan Issue を更新せずに Close すること

---

## 【Operation Plan】

### 1. 完了確認（Verify）
- 全 Task Issue が Close 済み

### 2. 親Plan Issue 更新（Update）
- 実績ベースの設計方針
- 振り返り（良/悪/改善）
- Done条件の達成根拠

### 3. docs 更新（Update）
- DESIGN(設計・構成)　※必要に応じて
- docs/03_OPERATIONS/runbook.md（運用・手順）※必要に応じて
- docs/01_REQUIREMENTS/changes.md（履歴）
- docs/00_INDEX.md（最終リンク）

## 4.　AI Knowledge　更新（Update）
- 再利用可能な知見を判断し、必要に応じて Knowledge 化する
- 保存先：docs/80_AI_KNOWLEDGE/
- 1 Knowledge = 1 ファイル
- INDEX.md を必ず更新する

### 5. Notion 総括ドキュメント作成（必須）
- テンプレートファイル：`docs/90_NOTION/TEMPLATE/notion-template.md` を参照する
- **重要：Notionへの登録は手動で行う。本コマンドでは`.md`ファイルの作成までを実行する。**
- 以下の手順で案件ドキュメント用の`.md`ファイルを作成する：

#### 5.1 日付ディレクトリの作成
1) 実行日（YYYYMMDD形式）を取得する
   - 例：2025年12月28日 → `20251228`
2) `docs/90_NOTION/` 配下に日付ディレクトリを作成する
   - パス：`docs/90_NOTION/YYYYMMDD/`
   - 例：`docs/90_NOTION/20251228/`
   - 既に存在する場合はそのまま使用する

#### 5.2 テンプレートから`.md`ファイルを作成
1) `docs/90_NOTION/TEMPLATE/notion-template.md` を読み込む
2) テンプレートの各項目を埋める：
   - `<案件名>`：親Plan Issueのタイトル
   - `<Aプロジェクト>`：プロジェクト名
   - `<GitHub #XXXX>`：親Plan Issue番号
   - `<URL>`：GitHubリポジトリURL
   - その他の項目：親Plan Issue / Task Issue / docs の内容から埋める
3) 必須リンクを埋める：
   - docs/00_INDEX.md へのリンク
   - docs/01_REQUIREMENTS/requirements.md へのリンク
   - docs/02_DESIGN/ 各ファイルへのリンク
   - docs/03_OPERATIONS/runbook.md へのリンク
   - docs/80_AI_KNOWLEDGE/INDEX.md へのリンク
   - 親Plan Issue URL
   - 子Task Issue URL（すべて）
4) 「NotionはSSOTではない」旨を明記する（テンプレートに含まれている）
5) 作成した内容を `docs/90_NOTION/YYYYMMDD/notion.md` として保存する
   - ファイル名は固定：`notion.md`
   - 例：`docs/90_NOTION/20251228/notion.md`

#### 5.3 報告
- 作成した`.md`ファイルのパスを報告する
- 例：`docs/90_NOTION/20251228/notion.md`
- **次のステップ**：
  - ユーザーが手動でNotionに登録する
  - Notionの Projects DB / Work Items DB に登録する際は、作成した`.md`ファイルの内容を参照する

### 6. クローズ（Close）
- 親Plan Issue を Close

---

## 【フェーズ完了条件】
- 知見が再利用可能な形で残っている
- 次回PJで同じ判断を繰り返さずに済む

---

## 【出力】
- Close完了報告
- 更新docs一覧
- Notion用`.md`ファイルのパス（`docs/90_NOTION/YYYYMMDD/notion.md`）
- 改善提案（ルール / 運用）

---

## 【フェーズ宣言】
Actionフェーズを開始する。
Actionフェーズを終了する。
