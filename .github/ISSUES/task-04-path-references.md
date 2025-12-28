---
title: "[Task] T-04：パス参照の修正（app-stack.ts、バッチファイル）"
labels: ["type:task"]
---

## 0. 親Plan
- Plan Issue：#<親Issue番号>
- Task ID：T-04（親Planの表と一致させる）

---

## 1. タスク定義（Plan確定：変更禁止）
### 目的
- app-stack.ts内の4つのパス参照を統合後のパスに修正する
- バッチファイル内のパス参照を統合後のパスに修正する
- 統合後のビルド・デプロイが正常に動作することを確認する

### 完了条件（DoD）
- [ ] app-stack.ts内の4つのパス参照が修正されている
- [ ] バッチファイル内のパス参照が修正されている
- [ ] `npm run build`が正常に実行できる
- [ ] `npx cdk synth`が正常に実行できる
- [ ] 統合後のスクリプトが正常に実行できる

### 対象範囲
- 対象ファイル：
  - `infra/lib/stacks/app-stack.ts`（4つのパス参照）
  - `scripts/deploy-backend.sh`（INFRA_DIRのパス参照）
  - `scripts/build-lambda.sh`（プロジェクトルートのパス参照）
  - `scripts/build-batch-code.sh`（プロジェクトルートのパス参照）
  - その他のスクリプト（必要に応じて）
- 対象機能：
  - パス参照の修正
  - ビルド・デプロイ手順の動作確認

### 修正対象のパス参照

#### app-stack.ts内の4つのパス参照
1. **layer.zip**
   - 修正前：`path.join(__dirname, '../../../ouma-family-event/assets/layer.zip')`
   - 修正後：`path.join(__dirname, '../../assets/layer.zip')`

2. **api/dist.zip**
   - 修正前：`path.join(__dirname, '../../../ouma-family-event/assets/api/dist.zip')`
   - 修正後：`path.join(__dirname, '../../assets/api/dist.zip')`

3. **batch/dist.zip**
   - 修正前：`path.join(__dirname, '../../../ouma-family-event/assets/batch/dist.zip')`
   - 修正後：`path.join(__dirname, '../../assets/batch/dist.zip')`

4. **ec2-launcher**
   - 修正前：`path.join(__dirname, '../../../ouma-family-event/lambda/ec2-launcher')`
   - 修正後：`path.join(__dirname, '../../lambda/ec2-launcher')`

#### バッチファイル内のパス参照
- **deploy-backend.sh**
  - 修正前：`INFRA_DIR="${HOME}/work/ouma-events-infra"`
  - 修正後：`INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../infra" && pwd)"` または統合後のパス構造に合わせて修正

- **build-lambda.sh**
  - プロジェクトルートのパス参照を確認・修正

- **build-batch-code.sh**
  - プロジェクトルートのパス参照を確認・修正

---

# ===== Do（追記のみ）=====

## 2. Doログ（時系列）
> 必須項目：日付 / 実施内容 / 変更ファイル / 判断理由 / 残課題  
> ※「実行した体」は禁止。証跡がないものは未実施。

- （Doフェーズで追記）

---

# ===== Check（追記のみ）=====

## 3. Checkログ（観点・手順・結果）
> 必須項目：観点 / 手順 / 期待結果 / 実結果 / 判定（OK/NG）  
> NGの場合：差戻先（Plan/Do）と理由を明記

### 観点
- 正常系：
  - app-stack.ts内の4つのパス参照が正しく修正されている
  - バッチファイル内のパス参照が正しく修正されている
  - ビルドが正常に実行できる
  - CDKのsynthが正常に実行できる
- 異常系：
  - パス参照の修正漏れによるビルドエラー
  - パス参照の修正ミスによる実行エラー
- 境界値：
  - パス参照が存在しない場合のエラーハンドリング

### 手順（再現可能に）
1. app-stack.ts内の4つのパス参照を修正
2. バッチファイル内のパス参照を修正
3. `npm run build`を実行してビルドエラーがないことを確認
4. `npx cdk synth`を実行してCDKの構文チェックを確認
5. 統合後のスクリプトを実行して動作確認

### 期待結果
- app-stack.ts内の4つのパス参照が統合後のパスに修正されている
- バッチファイル内のパス参照が統合後のパスに修正されている
- `npm run build`が正常に実行できる
- `npx cdk synth`が正常に実行できる
- 統合後のスクリプトが正常に実行できる

### 実結果
- （Checkフェーズで追記）

### 判定
- [ ] OK（このIssueをCloseしてよい）
- [ ] NG（差戻しが必要）

#### NGの場合（必須）
- 差戻先：
  - [ ] Plan（仕様/タスク/設計の見直し）
  - [ ] Do（実装修正）
- 理由：
- 次のアクション：

---

## 4. Close前チェック
- [ ] Doログが必須項目を満たしている
- [ ] Checkログが必須項目を満たしている
- [ ] OK判定である
- [ ] （該当時）運用スクリプトは `scripts/operation/` に格納されている
- [ ] （該当時）テストスクリプトは `scripts/test/` に格納されている
- [ ] （該当時）`docs/02_OPERATIONS/runbook.md` が更新されている

