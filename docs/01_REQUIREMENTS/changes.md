# Changes（変更履歴 / 仕様変更ログ）

> このドキュメントは、本PJの変更履歴（仕様・挙動・運用影響）を記録する。  
> 実装中に仕様変更が発生した場合は `/plan` に差し戻し、requirements/design更新と合わせて本ログを追記する。  
> 「なぜ変えたか」「何が変わったか」「どこに影響するか」「どう確認したか」が追跡できることを目的とする。

---

## 記録ルール（運用）
- 追記タイミング：
  - 仕様変更確定時（Plan）
  - 最終整理（Action）
- 対象：
  - 仕様（要件/受け入れ基準/スコープ）の変更
  - 挙動が変わる実装変更
  - 運用に影響する変更（runbook更新が必要なもの）
- 例外：
  - 純粋なリファクタ（挙動不変）や微修正は原則不要  
    ※ただし将来調査に効く場合は記録してよい

---

## 変更履歴

### 2025-12-28（v1 / 変更ID: CHG-0001）
- 種別：仕様変更 / 挙動変更
- 変更理由（Why）：
  - インフラコード（ouma-events-infra）とアプリケーションコード（ouma-family-event）を単一リポジトリ（family-events-messages）に統合するため
  - コードとドキュメントの一元管理を実現するため
- 変更概要（What）：
  - ouma-events-infraのコードをfamily-events-messages/infra/に統合
  - ouma-family-event/packages/*をfamily-events-messages/packages/*に統合
  - ouma-family-event/scripts/*（テストコード除外）をfamily-events-messages/scripts/operation/に統合
  - ouma-family-event/lambda/*をfamily-events-messages/lambda/に統合
  - app-stack.ts内の4つのパス参照を統合後のパスに修正（`../../../assets/`、`../../../lambda/`）
  - deploy-backend.sh内のINFRA_DIRを統合後のパスに修正
  - package.jsonにworkspaces設定を追加（`["infra", "packages/*"]`）
  - infra/tsconfig.jsonに`types: ["node"]`と`typeRoots`を追加
- 影響範囲（Impact）：
  - docs：requirements.md、architecture.md、functional_spec.md、basic_design.md、00_INDEX.mdを更新
  - コード：infra/lib/stacks/*.ts、packages/*、scripts/operation/*.sh、lambda/ec2-launcher/*
  - データ：なし
  - インフラ：パス参照の修正により、統合後のビルド・デプロイが正常に動作することを確認
- 関連リンク：
  - Plan Issue：#6
  - Task Issue：#7, #8, #9, #10, #11, #12
  - PR：なし（統合作業）
  - Notion：docs/90_NOTION/20251228/notion.md
- 検証（How to Verify）：
  - 観点：ビルド確認、CDKのsynth確認、パス参照の確認
  - 手順：
    1. `npm install`を実行して依存関係のインストール確認
    2. `npm run build`を実行してビルド確認
    3. `npx cdk synth`を実行してCDKの構文チェック確認
    4. パス参照が正しく動作することを確認
  - 期待結果：
    - `npm install`が正常に実行できる
    - `npm run build`が正常に実行できる
    - `npx cdk synth`が正常に実行できる（"Successfully synthesized"を確認）
    - パス参照が正しく動作する
- ロールバック方針（必要なら）：
  - 統合に問題が発生した場合、元のリポジトリ（ouma-events-infra、ouma-family-event）に戻すことができる
- 備考：
  - 実際のデプロイ確認は実施していない（コード統合のみ）
  - 実際のビルド・デプロイ時の動作確認は、build-lambda-layer.shやbuild-lambda.shを実行してから実施する必要がある

### YYYY-MM-DD（vX / 変更ID: CHG-0002）
- 種別：仕様変更 / 挙動変更 / 運用変更 / セキュリティ / パフォーマンス / リファクタ
- 変更理由（Why）：
- 変更概要（What）：
- 影響範囲（Impact）：
  - docs：requirements / design / runbook / knowledge（該当箇所）
  - コード：対象モジュール/ディレクトリ
  - データ：スキーマ/保存形式/移行有無
  - インフラ：リソース変更/破壊的変更有無
- 関連リンク：
  - Plan Issue：#XXXX
  - Task Issue：#YYYY, #ZZZZ
  - PR：#PPPP
  - Notion：<URL>
- 検証（How to Verify）：
  - 観点：
  - 手順：
  - 期待結果：
- ロールバック方針（必要なら）：
- 備考：

---

### YYYY-MM-DD（vX / 変更ID: CHG-0002）
- 種別：
- 変更理由（Why）：
- 変更概要（What）：
- 影響範囲（Impact）：
- 関連リンク：
- 検証（How to Verify）：
- ロールバック方針：
- 備考：

---


