import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2_authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

export interface AppStackProps extends cdk.StackProps {
  cfg: any;
  vpc: ec2.IVpc; // EC2インスタンス用にVPCが必要
  eventsTable: dynamodb.ITable;
  usersTable: dynamodb.ITable;
  summariesTable: dynamodb.ITable;
  cityGeoTable: dynamodb.ITable;
  lineSecret: secretsmanager.ISecret;
  alarmTopic: sns.ITopic;
  appLogGroup: logs.ILogGroup;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const cfg = props.cfg;
    const prefix = `${cfg.org}-${cfg.short}-${cfg.envName}`;
    const region = cdk.Stack.of(this).region;

    cdk.Tags.of(this).add('Org', cfg.org);
    cdk.Tags.of(this).add('System', cfg.system);
    cdk.Tags.of(this).add('Env', cfg.envName);
    cdk.Tags.of(this).add('Owner', 'ouma0623');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
    cdk.Tags.of(this).add('CostCenter', 'training');

    // =========================
    // Cognito UserPool（既存を参照するか、新規作成）
    // =========================
    // TODO: 既存のUserPoolを参照する場合は、UserPool.fromUserPoolId()を使用
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${prefix}-userpool`,
      selfSignUpEnabled: true, // セルフサインアップを有効化
      signInAliases: { email: true },
      passwordPolicy: {
        minLength: 8, // パスワードの最小長を8文字に変更（12文字は厳しすぎる）
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: false, // 大文字を必須から外す（ユーザビリティ向上）
        requireSymbols: false, // 記号を必須から外す（ユーザビリティ向上）
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      userVerification: {
        emailSubject: 'あなたのアカウント確認コード',
        emailBody: '確認コード: {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    const userPoolDomainPrefix = `${cfg.org}-${cfg.short}-${cfg.envName}-auth`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    const userPoolDomain = userPool.addDomain('UserPoolDomain', {
      cognitoDomain: { domainPrefix: userPoolDomainPrefix },
    });

    const appDomain = (cfg.subdomains?.app as string) ?? `app.${cfg.domain}`;

    const callbackUrls = [
      'http://localhost:3000/app/callback',
      `https://${appDomain}/app/callback`,
    ];

    const logoutUrls = [
      'http://localhost:3000/app',
      `https://${appDomain}/app`,
    ];

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true, // USER_PASSWORD_AUTHフローを有効化
        userSrp: true, // USER_SRP_AUTHフローを有効化（amazon-cognito-identity-jsのデフォルト）
        adminUserPassword: false,
        custom: false,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // =========================
    // Lambda Layer（共通依存関係）
    // =========================
    const layerZipPath = path.join(__dirname, '../../../assets/layer.zip');
    const dependenciesLayer = new lambda.LayerVersion(this, 'DependenciesLayer', {
      layerVersionName: `${prefix}-dependencies-layer`,
      code: lambda.Code.fromAsset(layerZipPath),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Common dependencies for Lambda functions (@aws-sdk, axios, express, etc.)',
    });

    // =========================
    // Lambda関数（API）
    // =========================
    const apiZipPath = path.join(__dirname, '../../../assets/api/dist.zip');
    // コスト削減のため、すべてのLambda関数をVPC外に配置（インターネット経由でAWSサービスにアクセス）
    // VPC Interface Endpointsが不要になり、月額約13,000円のコスト削減

    // Lambda実行ロール（API用）
    const apiLambdaRole = new iam.Role(this, 'ApiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      // VPC外に配置するため、VPC関連のマネージドポリシーは不要
    });

    // DynamoDB権限
    props.eventsTable.grantReadWriteData(apiLambdaRole);
    props.usersTable.grantReadWriteData(apiLambdaRole);
    props.summariesTable.grantReadData(apiLambdaRole);
    props.cityGeoTable.grantReadData(apiLambdaRole);

    // Secrets Manager権限
    props.lineSecret.grantRead(apiLambdaRole);

    // CloudWatch Logs権限
    props.appLogGroup.grantWrite(apiLambdaRole);

    // events-search
    const eventsSearchFn = new lambda.Function(this, 'ApiEventsSearchFn', {
      functionName: `${prefix}-api-events-search`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/events-search.handler',
      code: lambda.Code.fromAsset(apiZipPath),
      layers: [dependenciesLayer],
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      // VPC外に配置（コスト削減のため）
      role: apiLambdaRole,
      environment: {
        DYNAMODB_TABLE_EVENTS: props.eventsTable.tableName,
        DYNAMODB_TABLE_USERS: props.usersTable.tableName,
        DYNAMODB_TABLE_SUMMARIES: props.summariesTable.tableName,
      },
      logGroup: props.appLogGroup,
    });

    // events-detail
    const eventsDetailFn = new lambda.Function(this, 'ApiEventsDetailFn', {
      functionName: `${prefix}-api-events-detail`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/events-detail.handler',
      code: lambda.Code.fromAsset(apiZipPath),
      layers: [dependenciesLayer],
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      // VPC外に配置（コスト削減のため）
      role: apiLambdaRole,
      environment: {
        DYNAMODB_TABLE_EVENTS: props.eventsTable.tableName,
      },
      logGroup: props.appLogGroup,
    });

    // weekend
    const weekendFn = new lambda.Function(this, 'ApiWeekendFn', {
      functionName: `${prefix}-api-weekend`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/weekend.handler',
      code: lambda.Code.fromAsset(apiZipPath),
      layers: [dependenciesLayer],
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      // VPC外に配置（コスト削減のため）
      role: apiLambdaRole,
      environment: {
        DYNAMODB_TABLE_EVENTS: props.eventsTable.tableName,
        DYNAMODB_TABLE_USERS: props.usersTable.tableName,
      },
      logGroup: props.appLogGroup,
    });

    // users-settings-get
    const usersSettingsGetFn = new lambda.Function(this, 'ApiUsersSettingsGetFn', {
      functionName: `${prefix}-api-users-settings-get`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/users-settings-get.handler',
      code: lambda.Code.fromAsset(apiZipPath),
      layers: [dependenciesLayer],
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      // VPC外に配置（コスト削減のため）
      role: apiLambdaRole,
      environment: {
        DYNAMODB_TABLE_USERS: props.usersTable.tableName,
      },
      logGroup: props.appLogGroup,
    });

    // users-settings-post
    const usersSettingsPostFn = new lambda.Function(this, 'ApiUsersSettingsPostFn', {
      functionName: `${prefix}-api-users-settings-post`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/users-settings-post.handler',
      code: lambda.Code.fromAsset(apiZipPath),
      layers: [dependenciesLayer],
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      // VPC外に配置（コスト削減のため）
      role: apiLambdaRole,
      environment: {
        DYNAMODB_TABLE_USERS: props.usersTable.tableName,
      },
      logGroup: props.appLogGroup,
    });

    // line-link
    const lineLinkFn = new lambda.Function(this, 'ApiLineLinkFn', {
      functionName: `${prefix}-api-line-link`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/line-link.handler',
      code: lambda.Code.fromAsset(apiZipPath),
      layers: [dependenciesLayer],
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      // VPC外に配置（コスト削減のため）
      role: apiLambdaRole,
      environment: {
        DYNAMODB_TABLE_USERS: props.usersTable.tableName,
        SECRET_NAME_LINE: props.lineSecret.secretName,
      },
      logGroup: props.appLogGroup,
    });

    // =========================
    // Lambda関数（バッチ）
    // =========================
    const batchZipPath = path.join(__dirname, '../../../assets/batch/dist.zip');

    // Lambda実行ロール（バッチ用）
    const batchLambdaRole = new iam.Role(this, 'BatchLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      // VPC外に配置するため、VPC関連のマネージドポリシーは不要
    });

    // DynamoDB権限
    props.eventsTable.grantReadWriteData(batchLambdaRole);
    props.usersTable.grantReadData(batchLambdaRole);
    props.summariesTable.grantReadWriteData(batchLambdaRole);

    // Secrets Manager権限
    props.lineSecret.grantRead(batchLambdaRole);

    // Bedrock権限
    batchLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${cfg.bedrock?.region || 'us-east-1'}::foundation-model/${cfg.bedrock?.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0'}`,
        ],
      })
    );

    // CloudWatch Logs権限
    const batchLogGroup = logs.LogGroup.fromLogGroupName(
      this,
      'BatchLogGroup',
      `/ouma/fe/${cfg.envName}/batch`
    );
    batchLogGroup.grantWrite(batchLambdaRole);

    // =========================
    // EC2スポットインスタンス用リソース（バッチ処理）
    // =========================
    // セキュリティグループ
    const batchSecurityGroup = new ec2.SecurityGroup(this, 'BatchSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for batch EC2 instances',
      allowAllOutbound: true,
    });

    // EC2インスタンス用IAMロール
    const batchEc2Role = new iam.Role(this, 'BatchEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // DynamoDBアクセス権限
    props.eventsTable.grantReadWriteData(batchEc2Role);
    props.usersTable.grantReadWriteData(batchEc2Role);
    props.summariesTable.grantReadWriteData(batchEc2Role);
    props.cityGeoTable.grantReadData(batchEc2Role);

    // Secrets Managerアクセス権限
    props.lineSecret.grantRead(batchEc2Role);

    // CloudWatch Logsアクセス権限
    batchLogGroup.grantWrite(batchEc2Role);

    // EC2インスタンス終了権限
    batchEc2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:DescribeInstances', 'ec2:TerminateInstances'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'ec2:ResourceTag/BatchType': ['weekly-ingest', 'friday-notify'],
          },
        },
      })
    );

    // EC2インスタンスプロファイル
    const batchInstanceProfile = new iam.InstanceProfile(this, 'BatchInstanceProfile', {
      role: batchEc2Role,
    });

    // EC2インスタンス起動用Lambda関数のIAMロール
    const ec2LauncherRole = new iam.Role(this, 'Ec2LauncherRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // EC2インスタンス起動権限
    ec2LauncherRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:RunInstances'],
        resources: ['*'],
      })
    );

    // EC2インスタンスタグ付け権限
    ec2LauncherRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateTags'],
        resources: ['arn:aws:ec2:*:*:instance/*'],
      })
    );

    // IAMロールのパススルー権限
    ec2LauncherRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [batchEc2Role.roleArn],
      })
    );

    // サブネットの取得（パブリックサブネットを使用）
    const publicSubnets = props.vpc.publicSubnets;
    if (publicSubnets.length === 0) {
      throw new Error('パブリックサブネットが見つかりません');
    }
    const subnet = publicSubnets[0];

    // EC2インスタンス起動用Lambda関数のコードパス
    const ec2LauncherZipPath = path.join(__dirname, '../../../lambda/ec2-launcher');

    // S3バケット名（既存のstaticWebBucketを使用、後で定義される）
    const batchCodeBucketName = `${prefix}-static-web`;

    // EC2インスタンス起動用Lambda関数（weekly-ingest用）
    const ec2LauncherLambdaWeekly = new lambda.Function(this, 'Ec2LauncherWeekly', {
      functionName: `${prefix}-ec2-launcher-weekly-ingest`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(ec2LauncherZipPath),
      timeout: cdk.Duration.minutes(5),
      role: ec2LauncherRole,
      environment: {
        INSTANCE_TYPE: 't3.micro',
        AMI_ID: 'ami-0ff5ad26b079f000d', // Amazon Linux 2023 with Node.js 20.x (ap-northeast-1)
        SECURITY_GROUP_ID: batchSecurityGroup.securityGroupId,
        SUBNET_ID: subnet.subnetId,
        IAM_ROLE_ARN: batchInstanceProfile.instanceProfileArn,
        BATCH_TYPE: 'weekly-ingest',
        // AWS_REGIONはLambdaランタイムによって自動的に設定されるため、設定不要
        S3_BUCKET: batchCodeBucketName,
        S3_KEY: 'batch-code.zip',
      },
      logGroup: props.appLogGroup,
    });

    // EC2インスタンス起動用Lambda関数（friday-notify用）
    const ec2LauncherLambdaNotify = new lambda.Function(this, 'Ec2LauncherNotify', {
      functionName: `${prefix}-ec2-launcher-friday-notify`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(ec2LauncherZipPath),
      timeout: cdk.Duration.minutes(5),
      role: ec2LauncherRole,
      environment: {
        INSTANCE_TYPE: 't3.micro',
        AMI_ID: 'ami-0ff5ad26b079f000d', // Amazon Linux 2023 with Node.js 20.x (ap-northeast-1)
        SECURITY_GROUP_ID: batchSecurityGroup.securityGroupId,
        SUBNET_ID: subnet.subnetId,
        IAM_ROLE_ARN: batchInstanceProfile.instanceProfileArn,
        BATCH_TYPE: 'friday-notify',
        // AWS_REGIONはLambdaランタイムによって自動的に設定されるため、設定不要
        S3_BUCKET: batchCodeBucketName,
        S3_KEY: 'batch-code.zip',
      },
      logGroup: props.appLogGroup,
    });

    // =========================
    // Lambda関数（バッチ）- 既存（段階的に削除予定）
    // =========================
    // weekly-ingest
    // VPC外に配置（コスト削減のため、インターネット経由でAWSサービスにアクセス）
    const weeklyIngestFn = new lambda.Function(this, 'BatchWeeklyIngestFn', {
      functionName: `${prefix}-batch-weekly-ingest`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/ingest.handler',
      code: lambda.Code.fromAsset(batchZipPath),
      layers: [dependenciesLayer],
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      // VPC外に配置（コスト削減のため）
      role: batchLambdaRole,
      environment: {
        DYNAMODB_TABLE_EVENTS: props.eventsTable.tableName,
        ENABLE_DISCOVERY: 'false',
      },
      logGroup: batchLogGroup,
    });

    // friday-notify
    // VPC外に配置（コスト削減のため、インターネット経由でAWSサービスにアクセス）
    const fridayNotifyFn = new lambda.Function(this, 'BatchFridayNotifyFn', {
      functionName: `${prefix}-batch-friday-notify`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/notify.handler',
      code: lambda.Code.fromAsset(batchZipPath),
      layers: [dependenciesLayer],
      memorySize: 512,
      timeout: cdk.Duration.minutes(5),
      // VPC外に配置（コスト削減のため）
      role: batchLambdaRole,
      environment: {
        DYNAMODB_TABLE_EVENTS: props.eventsTable.tableName,
        DYNAMODB_TABLE_USERS: props.usersTable.tableName,
        DYNAMODB_TABLE_SUMMARIES: props.summariesTable.tableName,
        SECRET_NAME_LINE: props.lineSecret.secretName,
        BEDROCK_MODEL_ID: cfg.bedrock?.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0',
        BEDROCK_REGION: cfg.bedrock?.region || 'us-east-1',
      },
      logGroup: batchLogGroup,
    });

    // =========================
    // API Gateway HTTP API
    // =========================
    const api = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: `${prefix}-http-api`,
      corsPreflight: {
        allowHeaders: ['Authorization', 'Content-Type'],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: [
          `https://${appDomain}`,
          `https://${cfg.subdomains?.web ?? `web.${cfg.domain}`}`,
          'http://localhost:3000',
        ],
        maxAge: cdk.Duration.days(10),
      },
    });

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPool.userPoolId}`;

    const jwtAuthorizer = new apigwv2_authorizers.HttpJwtAuthorizer('JwtAuthorizer', issuer, {
      jwtAudience: [userPoolClient.userPoolClientId],
    });

    // ルート定義
    api.addRoutes({
      path: '/v1/events',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2_integrations.HttpLambdaIntegration(
        'EventsSearchIntegration',
        eventsSearchFn
      ),
    });

    api.addRoutes({
      path: '/v1/events/{id}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2_integrations.HttpLambdaIntegration(
        'EventsDetailIntegration',
        eventsDetailFn
      ),
    });

    api.addRoutes({
      path: '/v1/weekend',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2_integrations.HttpLambdaIntegration(
        'WeekendIntegration',
        weekendFn
      ),
      // 認証不要（ホーム画面で誰でも見られるようにする）
    });

    // Cognito認証を使用: JWT認証を有効化
    api.addRoutes({
      path: '/v1/users/me/settings',
      methods: [apigwv2.HttpMethod.GET],
      integration: new apigwv2_integrations.HttpLambdaIntegration(
        'UsersSettingsGetIntegration',
        usersSettingsGetFn
      ),
      authorizer: jwtAuthorizer, // Cognito認証を有効化
    });

    api.addRoutes({
      path: '/v1/users/me/settings',
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2_integrations.HttpLambdaIntegration(
        'UsersSettingsPostIntegration',
        usersSettingsPostFn
      ),
      authorizer: jwtAuthorizer, // Cognito認証を有効化
    });

    api.addRoutes({
      path: '/v1/line/link',
      methods: [apigwv2.HttpMethod.POST],
      integration: new apigwv2_integrations.HttpLambdaIntegration(
        'LineLinkIntegration',
        lineLinkFn
      ),
      authorizer: jwtAuthorizer, // Cognito認証を有効化
    });

    // カスタムドメイン設定
    const certArn = (cfg.acmCertArn as string) ?? '';
    if (!certArn || certArn === 'PLACEHOLDER_REPLACE_WITH_ACTUAL_ARN') {
      throw new Error('cfg.acmCertArn is required (ACM certificate ARN). Please set it in config/prd.json');
    }
    const cert = acm.Certificate.fromCertificateArn(this, 'ApiCert', certArn);

    const apiDomain = (cfg.subdomains?.api as string) ?? `api.${cfg.domain}`;
    const apiDomainName = new apigwv2.DomainName(this, 'ApiDomainName', {
      domainName: apiDomain,
      certificate: cert,
    });

    new apigwv2.ApiMapping(this, 'ApiMapping', {
      api,
      domainName: apiDomainName,
      stage: api.defaultStage!,
    });

    const rootDomain = (cfg.domain as string) ?? 'oumasan.org';
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: rootDomain,
    });

    new route53.ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      recordName: apiDomain,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.ApiGatewayv2DomainProperties(
          apiDomainName.regionalDomainName,
          apiDomainName.regionalHostedZoneId
        )
      ),
    });

    // =========================
    // S3 + CloudFront (Frontend)
    // =========================
    const staticWebBucket = new s3.Bucket(this, 'StaticWebBucket', {
      bucketName: batchCodeBucketName, // EC2インスタンス用にも使用
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // EC2インスタンス用IAMロールにS3アクセス権限を追加
    staticWebBucket.grantRead(batchEc2Role);

    const cloudFrontCertArn = (cfg.acmCertArnCloudFront as string) ?? '';
    if (!cloudFrontCertArn || cloudFrontCertArn === 'PLACEHOLDER_REPLACE_WITH_ACTUAL_ARN') {
      throw new Error(
        'cfg.acmCertArnCloudFront is required (ACM certificate ARN for CloudFront, us-east-1). Please set it in config/prd.json'
      );
    }
    const cloudFrontCert = acm.Certificate.fromCertificateArn(
      this,
      'CloudFrontCert',
      cloudFrontCertArn
    );

    const webDomain = (cfg.subdomains?.web as string) ?? `web.${cfg.domain}`;

    // CloudFront Function: /events などのディレクトリパスを index.html に変換
    const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
      functionName: `${prefix}-rewrite-function`,
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  
  // ディレクトリパスの場合（末尾が / でない、かつ拡張子がない）
  if (!uri.includes('.') && !uri.endsWith('/')) {
    // /events -> /events/index.html
    request.uri = uri + '/index.html';
  } else if (uri.endsWith('/')) {
    // /events/ -> /events/index.html
    request.uri = uri + 'index.html';
  }
  
  return request;
}
      `),
    });

    const distribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
      defaultBehavior: {
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(staticWebBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        functionAssociations: [
          {
            function: rewriteFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      domainNames: [webDomain],
      certificate: cloudFrontCert,
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      errorResponses: [
        // 404エラーはNext.jsのクライアントサイドルーティングに任せる
        // 403エラー（S3でファイルが見つからない場合）は、Next.jsのクライアントサイドルーティングに任せる
        // エラーページ設定を削除し、S3のディレクトリインデックス機能に任せる
      ],
    });

    new route53.ARecord(this, 'WebARecord', {
      zone: hostedZone,
      recordName: webDomain,
      target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
    });

    // =========================
    // EventBridgeルール
    // =========================
    const weeklyIngestRule = new events.Rule(this, 'WeeklyIngestRule', {
      ruleName: `${prefix}-weekly-ingest-rule`,
      description: 'Weekly event ingestion batch',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '18',
        weekDay: 'MON', // 月曜日（UTC）
        month: '*',
        year: '*',
      }),
    });

    // 段階的移行: まずEC2起動用Lambda関数をターゲットに追加（既存のLambda関数は残す）
    weeklyIngestRule.addTarget(
      new targets.LambdaFunction(ec2LauncherLambdaWeekly, {
        retryAttempts: 2,
      })
    );
    
    // TODO: 動作確認後に既存のweeklyIngestFnを削除
    // weeklyIngestRule.addTarget(
    //   new targets.LambdaFunction(weeklyIngestFn, {
    //     retryAttempts: 2,
    //   })
    // );

    const fridayNotifyRule = new events.Rule(this, 'FridayNotifyRule', {
      ruleName: `${prefix}-friday-notify-rule`,
      description: 'Friday notification batch',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '10',
        weekDay: 'FRI', // 金曜日（UTC）
        month: '*',
        year: '*',
      }),
    });

    // 段階的移行: まずEC2起動用Lambda関数をターゲットに追加（既存のLambda関数は残す）
    fridayNotifyRule.addTarget(
      new targets.LambdaFunction(ec2LauncherLambdaNotify, {
        retryAttempts: 2,
      })
    );
    
    // TODO: 動作確認後に既存のfridayNotifyFnを削除
    // fridayNotifyRule.addTarget(
    //   new targets.LambdaFunction(fridayNotifyFn, {
    //     retryAttempts: 2,
    //   })
    // );

    // =========================
    // Outputs
    // =========================
    new cdk.CfnOutput(this, 'ApiBaseUrl', { value: api.apiEndpoint });
    new cdk.CfnOutput(this, 'ApiCustomDomain', {
      value: `https://${apiDomain}`,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: `${userPoolDomain.domainName}.auth.${region}.amazoncognito.com`,
    });
    new cdk.CfnOutput(this, 'StaticWebBucketName', {
      value: staticWebBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
    });
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'WebDomain', {
      value: `https://${webDomain}`,
    });
    new cdk.CfnOutput(this, 'BatchSecurityGroupId', {
      value: batchSecurityGroup.securityGroupId,
      description: 'Security Group ID for batch EC2 instances',
    });
    new cdk.CfnOutput(this, 'BatchInstanceProfileArn', {
      value: batchInstanceProfile.instanceProfileArn,
      description: 'IAM Instance Profile ARN for batch EC2 instances',
    });
    new cdk.CfnOutput(this, 'Ec2LauncherLambdaWeeklyArn', {
      value: ec2LauncherLambdaWeekly.functionArn,
      description: 'Lambda function ARN for weekly-ingest EC2 launcher',
    });
    new cdk.CfnOutput(this, 'Ec2LauncherLambdaNotifyArn', {
      value: ec2LauncherLambdaNotify.functionArn,
      description: 'Lambda function ARN for friday-notify EC2 launcher',
    });
  }
}
