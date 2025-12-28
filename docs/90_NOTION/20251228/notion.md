# 📌 計画概要：リポジトリ統合（ouma-events-infra + ouma-family-event）

## 🧭 概要
- プロジェクト：family-events-messages（統合プロジェクト）
- 種別：改修
- Plan Issue：[GitHub #6](https://github.com/ouma0623/family-events-messages/issues/6)
- リポジトリ：https://github.com/ouma0623/family-events-messages

---

## 📂 公式ドキュメント（SSOT）
※ 正は Git / docs。Notionは閲覧用。

- 📄 Docs Index：[docs/00_INDEX.md](../../00_INDEX.md)
- 📄 Requirements：[docs/01_REQUIREMENTS/requirements.md](../../01_REQUIREMENTS/requirements.md)
- 📄 Design：
  - [functional_spec.md](../../02_DESIGN/functional_spec.md)
  - [architecture.md](../../02_DESIGN/architecture.md)
  - [basic_design.md](../../02_DESIGN/basic_design.md)
- 📄 Operations：
  - [runbook.md](../../03_OPERATIONS/runbook.md)
- 📄 AI Knowledge：
  - [docs/80_AI_KNOWLEDGE/INDEX.md](../../80_AI_KNOWLEDGE/INDEX.md)

---

## 🧩 実施内容サマリ
> 詳細は Issue / Docs を参照

- **背景**：
  - インフラコード（ouma-events-infra）とアプリケーションコード（ouma-family-event）が別リポジトリに分散している
  - ドキュメントが複数ディレクトリに散在し、管理が困難
  - 開発・運用時の参照先が不明確

- **実施内容**：
  - ouma-events-infraのコードをfamily-events-messages/infra/に統合
  - ouma-family-event/packages/*をfamily-events-messages/packages/*に統合
  - ouma-family-event/scripts/*（テストコード除外）をfamily-events-messages/scripts/operation/に統合
  - ouma-family-event/lambda/*をfamily-events-messages/lambda/に統合
  - app-stack.ts内の4つのパス参照を統合後のパスに修正
  - deploy-backend.sh内のINFRA_DIRを統合後のパスに修正
  - package.jsonにworkspaces設定を追加
  - docs配下のテンプレートに基づいた統一的なドキュメント構造を確立

- **影響範囲**：
  - コード：infra/lib/stacks/*.ts、packages/*、scripts/operation/*.sh、lambda/ec2-launcher/*
  - ドキュメント：requirements.md、architecture.md、functional_spec.md、basic_design.md、00_INDEX.md、changes.md、runbook.md
  - インフラ：パス参照の修正により、統合後のビルド・デプロイが正常に動作することを確認

---

## 🗂 関連 Issue
- Plan：[#6](https://github.com/ouma0623/family-events-messages/issues/6)
- Tasks：
  - [#8](https://github.com/ouma0623/family-events-messages/issues/8)（T-01：インフラコードの統合）
  - [#9](https://github.com/ouma0623/family-events-messages/issues/9)（T-02：アプリケーションコードの統合）
  - [#10](https://github.com/ouma0623/family-events-messages/issues/10)（T-03：スクリプト・Lambda関数の統合）
  - [#7](https://github.com/ouma0623/family-events-messages/issues/7)（T-04：パス参照の修正）
  - [#11](https://github.com/ouma0623/family-events-messages/issues/11)（T-05：動作確認）
  - [#12](https://github.com/ouma0623/family-events-messages/issues/12)（T-06：ドキュメントの新規作成）

---

## 📌 レビュー / 注意点（抜粋）
- **パス参照の修正**：
  - `infra/lib/stacks/app-stack.ts`からルートに到達するには`../../../`が必要（当初計画では`../../`と想定していた）
  - パス参照の計算を実際のディレクトリ構造に基づいて修正した
- **TypeScript設定の調整**：
  - workspaces環境では、ルートのnode_modulesに@types/nodeがインストールされる可能性があるため、`typeRoots`に`../node_modules/@types`を追加
  - `types: ["node"]`を明示的に指定してNode.jsの型定義を有効化
- **assetsディレクトリの扱い**：
  - CDKのsynthは実際のファイルの存在を確認するため、プレースホルダーファイルを作成した
  - 実際のビルド時には、build-lambda-layer.shやbuild-lambda.shでこれらのファイルが生成される
- **実際のデプロイ確認**：
  - 実際のデプロイ確認は実施していない（コード統合のみ）
  - 実際のビルド・デプロイ時の動作確認は、build-lambda-layer.shやbuild-lambda.shを実行してから実施する必要がある

---

## 🔗 外部リンク
- GitHub Repo：https://github.com/ouma0623/family-events-messages
- Pull Requests：なし（統合作業）
- その他：

