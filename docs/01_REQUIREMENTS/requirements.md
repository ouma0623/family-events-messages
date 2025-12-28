# Requirements（要件定義 / SSOT）

> このドキュメントは本PJの **要件の唯一の正（SSOT）** である。  
> 仕様・範囲・Done（完了条件）をここで確定し、実装や検証はこの内容に従う。  
> 変更が発生する場合は `/plan` に差し戻し、本ファイルを更新した上で進めること。

---

## 0. メタ情報（プロジェクト固有）
- プロジェクト名：
- 対象期間（任意）：
- オーナー（任意）：
- 最終更新日：YYYY-MM-DD
- 関連（リンク）
  - docs hub：`docs/00_INDEX.md`
  - Plan Issue：#XXXX
  - Notion：<URL>
  - Github Repository：<URL>

---

## 1. 背景（Background）
- 現状の課題：
- 何が困っているか：
- なぜ今やるか（機会・リスク）：

---

## 2. 目的（Goal / Why）
- 達成したい状態：
- 成果の使われ方（誰が/いつ/何のために）：

---

## 3. スコープ（Scope）
> Planで確定し、Do/Checkで増やさない。

### 3.1 対象（In Scope）
- 対象機能：
- 対象データ：
- 対象画面/API：
- 対象環境（dev/stg/prodなど）：
- 対象リポジトリ/ディレクトリ：

### 3.2 対象外（Out of Scope）
- 今回やらないこと：
- 将来対応に回すこと：

---

## 4. ユースケース / 利用シナリオ（Use Cases）
> 「誰が」「何を」「どうしたい」を簡潔に列挙する。

- UC-01：
  - 利用者：
  - 操作/入力：
  - 期待結果：

- UC-02：
  - 利用者：
  - 操作/入力：
  - 期待結果：

---

## 5. 要件（Requirements）

### 5.1 機能要件（Functional）
> 実装対象となる要件。曖昧さを残さない。

- FR-01：
  - 説明：
  - 入力：
  - 出力：
  - 例外/異常系：
  - 受け入れ条件（Acceptance）：

- FR-02：
  - 説明：
  - 入力：
  - 出力：
  - 例外/異常系：
  - 受け入れ条件（Acceptance）：

---

### 5.2 非機能要件（Non-Functional）
> 実務で崩れやすいので必ず書く。分からなければ仮置きして明示する。

#### 性能（Performance）
- 期待性能：
- 目標レスポンス：
- 許容バッチ時間（該当時）：

#### 可用性（Availability）
- 目標稼働：
- 障害時の許容：

#### セキュリティ（Security）
- 認証/認可：
- 取り扱う機密情報：
- ログに残してよい/悪い情報：

#### 運用（Operations）
- 監視/アラート（必要なら）：
- ロールバック方針：
- 運用手順の格納先：`docs/02_OPERATIONS/runbook.md`

#### 監査/証跡（Audit）
- Issueに残すべき証跡：
- Notionに残すべきまとめ：

---

## 6. データ要件（Data Requirements）
- データソース：
- 正規化/変換（必要なら）：
- 保存先：
- データ品質（欠損/重複/フォーマット）：

---

## 7. 制約（Constraints）
- 技術的制約：
- 期限/コスト制約：
- 外部依存（API、権限、第三者）：

---

## 8. 受け入れ基準（Acceptance Criteria）
> Checkフェーズで「OK/NG」を判断するための基準。  
> “動いた気がする” を排除する。

- AC-01：
- AC-02：
- AC-03：

---

## 9. Done（完了条件：Planで確定）
> `/action` で Plan Issue をCloseできる条件。

- [ ] Plan Issue の子Taskが全て Close されている
- [ ] 受け入れ基準（Acceptance Criteria）を満たす
- [ ] 変更履歴（`docs/01_REQUIREMENTS/changes.md`）が更新されている
- [ ] 運用手順（`docs/02_OPERATIONS/runbook.md`）が更新されている
- [ ] AI Knowledge（`docs/03_AI_KNOWLEDGE/INDEX.md,README.md`）が更新されている
- [ ] Notion が最終化されている

---

## 10. 変更方針（Change Policy）
- 仕様変更が必要になった場合：
  - `/plan` に差し戻して requirements を更新する
  - 変更内容は `docs/01_REQUIREMENTS/changes.md` に記録する
  - 影響がある Task は Plan Issue 側で再整理する（Task増殖はしない）

---

## 11. メモ（任意）
- 未確定事項：
- 決定待ち：
