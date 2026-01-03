# AWSリソース削除後の残存リソース確認メモ

作成日: 2025-12-28

## 概要
CDK destroy実行後、手動で削除が必要なリソースの確認結果を記録します。

## CDK削除完了スタック
以下のスタックは正常に削除されました：
- `ouma-fe-prd-app` (DELETE_COMPLETE)
- `ouma-fe-prd-data` (DELETE_COMPLETE)
- `ouma-fe-prd-ops` (DELETE_COMPLETE)
- `ouma-fe-prd-network` (DELETE_COMPLETE)

## 手動削除が必要なリソース

### 1. DynamoDBテーブル（削除スキップされたもの）
CDK destroy時に`DELETE_SKIPPED`となったため、手動で削除が必要です。

**削除対象テーブル:**
- `ouma-fe-prd-citygeo`
- `ouma-fe-prd-events`
- `ouma-fe-prd-summaries`
- `ouma-fe-prd-users`

**削除コマンド:**
```bash
# リージョン: ap-northeast-1
aws dynamodb delete-table --table-name ouma-fe-prd-citygeo --region ap-northeast-1
aws dynamodb delete-table --table-name ouma-fe-prd-events --region ap-northeast-1
aws dynamodb delete-table --table-name ouma-fe-prd-summaries --region ap-northeast-1
aws dynamodb delete-table --table-name ouma-fe-prd-users --region ap-northeast-1
```

### 2. CloudWatch Logs（カスタムリソース用）
CDK Custom Resource用のロググループが残っています。

**削除対象ロググループ:**
- `/aws/lambda/ouma-fe-prd-app-CustomS3AutoDeleteObjectsCustomRes-lbOGjBUIZMFC`
- `/aws/lambda/ouma-fe-prd-network-CustomVpcRestrictDefaultSGCust-ZKuZOWffpNHP`

**削除コマンド:**
```bash
aws logs delete-log-group --log-group-name "/aws/lambda/ouma-fe-prd-app-CustomS3AutoDeleteObjectsCustomRes-lbOGjBUIZMFC" --region ap-northeast-1
aws logs delete-log-group --log-group-name "/aws/lambda/ouma-fe-prd-network-CustomVpcRestrictDefaultSGCust-ZKuZOWffpNHP" --region ap-northeast-1
```

### 3. Route53 Hosted Zone（確認が必要）
`oumasan.org`のHosted Zoneが残っています。
- Hosted Zone ID: `/hostedzone/Z09413989X4T1VV91DC7`
- 名前: `oumasan.org.`

**注意:** このHosted Zoneは既存のドメイン管理用の可能性があります。
削除する場合は、他のサービスで使用していないことを確認してください。

**残っているレコード:**
- `app.oumasan.org.` (Aレコード)
- `_c603239a7747b71a11bc7a11a80cabe1.api.oumasan.org.` (CNAME - ACM検証用)
- `_ee155c365faa610ed7a8f87c58312bcf.app.oumasan.org.` (CNAME - ACM検証用)
- `_e76c4fc6a4e459f4153c24bfad664533.web.oumasan.org.` (CNAME - ACM検証用)
- `_9b7b9deb5045861ac234c712f7b3077d.oumasan.org.` (CNAME - ACM検証用)

**確認コマンド:**
```bash
# Hosted Zone内のレコードを確認
aws route53 list-resource-record-sets --hosted-zone-id Z09413989X4T1VV91DC7 --query 'ResourceRecordSets[*].{Name:Name,Type:Type}' --output json
```

**削除コマンド（確認後）:**
```bash
# 注意: このコマンドは慎重に実行してください
# レコードを削除してからHosted Zoneを削除する必要があります
aws route53 delete-hosted-zone --id Z09413989X4T1VV91DC7
```

### 4. ACM証明書（確認が必要）
以下のACM証明書が残っています。

**ap-northeast-1リージョン:**
- Certificate ARN: `arn:aws:acm:ap-northeast-1:730335221037:certificate/3cf9773f-6c45-4ab5-bbed-6c41686620c6`
- Domain: `oumasan.org`

**us-east-1リージョン（CloudFront用）:**
- Certificate ARN: `arn:aws:acm:us-east-1:730335221037:certificate/2cfb2ad4-2715-4ad2-90fe-f3e3322347d0`
- Domain: `web.oumasan.org`

**注意:** これらの証明書は他のサービスで使用されている可能性があります。
削除する場合は、使用されていないことを確認してください。

**削除コマンド（確認後）:**
```bash
# ap-northeast-1リージョン
aws acm delete-certificate --certificate-arn arn:aws:acm:ap-northeast-1:730335221037:certificate/3cf9773f-6c45-4ab5-bbed-6c41686620c6 --region ap-northeast-1

# us-east-1リージョン
aws acm delete-certificate --certificate-arn arn:aws:acm:us-east-1:730335221037:certificate/2cfb2ad4-2715-4ad2-90fe-f3e3322347d0 --region us-east-1
```

## 削除済みリソース（確認済み）
以下のリソースは削除されていることを確認しました：
- EC2インスタンス
- Lambda関数
- API Gateway
- CloudFront Distribution
- S3バケット
- VPC、サブネット、セキュリティグループ
- Secrets Manager
- SNSトピック
- EventBridgeルール
- IAMロール
- Cognito User Pool

## 削除手順の推奨順序
1. DynamoDBテーブルの削除（データが不要な場合）
2. CloudWatch Logsの削除
3. Route53レコードの削除（必要に応じて）
4. ACM証明書の削除（必要に応じて）
5. Route53 Hosted Zoneの削除（必要に応じて）

## 課金について

### Route53 Hosted Zone
- **使用しなくても月額0.50 USDの課金が発生します**
- 最初の25個のHosted Zoneは1つあたり月額0.50 USD
- 作成から12時間以内に削除すれば料金は発生しませんが、それ以降は存在する限り月額料金がかかります
- **結論: 使用しない場合は削除することを強く推奨します**

### ACM証明書
- **通常のACM証明書（エクスポート不可）は、使用しなくても課金は発生しません**
- ACMと統合されたAWSサービス（ELB、CloudFront、API Gatewayなど）で使用する限り、追加料金は発生しません
- エクスポート可能なパブリック証明書を発行する場合のみ、証明書の発行時と更新時に料金がかかります
- **結論: 使用しない場合でも課金は発生しないため、削除は任意です**

## 注意事項
- DynamoDBテーブルを削除すると、データは完全に失われます。バックアップが必要な場合は事前に取得してください。
- Route53 Hosted Zoneは、他のサービスで使用されている可能性があるため、削除前に必ず確認してください。
- **Route53 Hosted Zoneは使用しなくても月額料金が発生するため、不要な場合は削除を推奨します。**

