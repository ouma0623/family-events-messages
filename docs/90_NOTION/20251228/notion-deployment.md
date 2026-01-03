# 📌 統合システムのデプロイ・動作確認

## 🧭 概要
- プロジェクト：family-events-messages（統合システムのデプロイ・動作確認）
- 種別：改修
- Plan Issue：[GitHub #13](https://github.com/ouma0623/family-events-messages/issues/13)
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
  - 統合後のシステム（フロントエンド・バックエンド・インフラ）が正常にデプロイ・動作するか未確認
  - デプロイスクリプトが統合後の環境に合わせて修正されているか未確認
  - 既存の機能が正常に動作するか未確認
  - データが存在しない場合の動作が未確認

- **実施内容**：
  - デプロイスクリプトのパス参照を統合後の環境に合わせて修正（`PROJECT_ROOT`を`../..`に統一）
  - インフラのデプロイ（NetworkStack、DataStack、OpsStack、AppStack）
  - バックエンドのデプロイ（Lambda関数、API Gateway）
  - フロントエンドのデプロイ（CloudFront + S3）
  - Lambdaバッチの動作確認（weekly-ingest、friday-notify）
  - EC2スポットインスタンスの起動確認
  - フロントエンド・バックエンドの動作確認
  - データ収集バッチの実行

- **影響範囲**：
  - コード：scripts/operation/*.sh（パス参照修正）
  - ドキュメント：requirements.md、changes.md、runbook.md、00_INDEX.md
  - インフラ：CDKスタックのデプロイ、Lambda関数のデプロイ、API Gatewayのデプロイ、CloudFront + S3のデプロイ

---

## 🗂 関連 Issue
- Plan：[#13](https://github.com/ouma0623/family-events-messages/issues/13)
- Tasks：
  - [#14](https://github.com/ouma0623/family-events-messages/issues/14)（T-01：デプロイスクリプトの修正）
  - [#15](https://github.com/ouma0623/family-events-messages/issues/15)（T-02：インフラのデプロイ）
  - [#16](https://github.com/ouma0623/family-events-messages/issues/16)（T-03：バックエンドのデプロイ）
  - [#17](https://github.com/ouma0623/family-events-messages/issues/17)（T-04：フロントエンドのデプロイ）
  - [#18](https://github.com/ouma0623/family-events-messages/issues/18)（T-05：Lambdaバッチの動作確認）
  - [#19](https://github.com/ouma0623/family-events-messages/issues/19)（T-06：EC2スポットインスタンスの起動確認）
  - [#20](https://github.com/ouma0623/family-events-messages/issues/20)（T-07：フロントエンドの動作確認）
  - [#21](https://github.com/ouma0623/family-events-messages/issues/21)（T-08：バックエンドAPIの動作確認）
  - [#22](https://github.com/ouma0623/family-events-messages/issues/22)（T-09：データ収集バッチの実行）

---

## 📌 レビュー / 注意点（抜粋）
- **デプロイスクリプトのパス参照修正**：
  - `scripts/operation/`から見た相対パスを`../..`に統一することで、プロジェクトルートを正しく認識できるようになった
  - `PROJECT_ROOT`の設定が不統一だったため、複数のスクリプトで修正が必要だった
- **EC2スポットインスタンスの起動**：
  - EC2ランチャーLambda関数が正常に動作し、スポットインスタンスを起動できることを確認した
  - バッチ処理実行後に自動的に終了することを確認した
- **データ収集バッチの実行**：
  - weekly-ingestバッチが正常に実行され、DynamoDBに185件のイベントデータが存在していることを確認した
- **システム全体の動作確認**：
  - フロントエンド・バックエンド・インフラすべてが正常にデプロイ・動作していることを確認した

---

## 🔗 外部リンク
- GitHub Repo：https://github.com/ouma0623/family-events-messages
- Pull Requests：なし（デプロイ・動作確認のみ）
- その他：







