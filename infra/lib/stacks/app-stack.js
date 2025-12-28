"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const apigwv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const apigwv2_integrations = __importStar(require("aws-cdk-lib/aws-apigatewayv2-integrations"));
const apigwv2_authorizers = __importStar(require("aws-cdk-lib/aws-apigatewayv2-authorizers"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const cloudfront_origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const route53_targets = __importStar(require("aws-cdk-lib/aws-route53-targets"));
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const path = __importStar(require("path"));
class AppStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const appDomain = cfg.subdomains?.app ?? `app.${cfg.domain}`;
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
        batchLambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['bedrock:InvokeModel'],
            resources: [
                `arn:aws:bedrock:${cfg.bedrock?.region || 'us-east-1'}::foundation-model/${cfg.bedrock?.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0'}`,
            ],
        }));
        // CloudWatch Logs権限
        const batchLogGroup = logs.LogGroup.fromLogGroupName(this, 'BatchLogGroup', `/ouma/fe/${cfg.envName}/batch`);
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
        batchEc2Role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ec2:DescribeInstances', 'ec2:TerminateInstances'],
            resources: ['*'],
            conditions: {
                StringEquals: {
                    'ec2:ResourceTag/BatchType': ['weekly-ingest', 'friday-notify'],
                },
            },
        }));
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
        ec2LauncherRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ec2:RunInstances'],
            resources: ['*'],
        }));
        // EC2インスタンスタグ付け権限
        ec2LauncherRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ec2:CreateTags'],
            resources: ['arn:aws:ec2:*:*:instance/*'],
        }));
        // IAMロールのパススルー権限
        ec2LauncherRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['iam:PassRole'],
            resources: [batchEc2Role.roleArn],
        }));
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
            integration: new apigwv2_integrations.HttpLambdaIntegration('EventsSearchIntegration', eventsSearchFn),
        });
        api.addRoutes({
            path: '/v1/events/{id}',
            methods: [apigwv2.HttpMethod.GET],
            integration: new apigwv2_integrations.HttpLambdaIntegration('EventsDetailIntegration', eventsDetailFn),
        });
        api.addRoutes({
            path: '/v1/weekend',
            methods: [apigwv2.HttpMethod.GET],
            integration: new apigwv2_integrations.HttpLambdaIntegration('WeekendIntegration', weekendFn),
            // 認証不要（ホーム画面で誰でも見られるようにする）
        });
        // Cognito認証を使用: JWT認証を有効化
        api.addRoutes({
            path: '/v1/users/me/settings',
            methods: [apigwv2.HttpMethod.GET],
            integration: new apigwv2_integrations.HttpLambdaIntegration('UsersSettingsGetIntegration', usersSettingsGetFn),
            authorizer: jwtAuthorizer, // Cognito認証を有効化
        });
        api.addRoutes({
            path: '/v1/users/me/settings',
            methods: [apigwv2.HttpMethod.POST],
            integration: new apigwv2_integrations.HttpLambdaIntegration('UsersSettingsPostIntegration', usersSettingsPostFn),
            authorizer: jwtAuthorizer, // Cognito認証を有効化
        });
        api.addRoutes({
            path: '/v1/line/link',
            methods: [apigwv2.HttpMethod.POST],
            integration: new apigwv2_integrations.HttpLambdaIntegration('LineLinkIntegration', lineLinkFn),
            authorizer: jwtAuthorizer, // Cognito認証を有効化
        });
        // カスタムドメイン設定
        const certArn = cfg.acmCertArn ?? '';
        if (!certArn || certArn === 'PLACEHOLDER_REPLACE_WITH_ACTUAL_ARN') {
            throw new Error('cfg.acmCertArn is required (ACM certificate ARN). Please set it in config/prd.json');
        }
        const cert = acm.Certificate.fromCertificateArn(this, 'ApiCert', certArn);
        const apiDomain = cfg.subdomains?.api ?? `api.${cfg.domain}`;
        const apiDomainName = new apigwv2.DomainName(this, 'ApiDomainName', {
            domainName: apiDomain,
            certificate: cert,
        });
        new apigwv2.ApiMapping(this, 'ApiMapping', {
            api,
            domainName: apiDomainName,
            stage: api.defaultStage,
        });
        const rootDomain = cfg.domain ?? 'oumasan.org';
        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: rootDomain,
        });
        new route53.ARecord(this, 'ApiARecord', {
            zone: hostedZone,
            recordName: apiDomain,
            target: route53.RecordTarget.fromAlias(new route53_targets.ApiGatewayv2DomainProperties(apiDomainName.regionalDomainName, apiDomainName.regionalHostedZoneId)),
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
        const cloudFrontCertArn = cfg.acmCertArnCloudFront ?? '';
        if (!cloudFrontCertArn || cloudFrontCertArn === 'PLACEHOLDER_REPLACE_WITH_ACTUAL_ARN') {
            throw new Error('cfg.acmCertArnCloudFront is required (ACM certificate ARN for CloudFront, us-east-1). Please set it in config/prd.json');
        }
        const cloudFrontCert = acm.Certificate.fromCertificateArn(this, 'CloudFrontCert', cloudFrontCertArn);
        const webDomain = cfg.subdomains?.web ?? `web.${cfg.domain}`;
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
        weeklyIngestRule.addTarget(new targets.LambdaFunction(ec2LauncherLambdaWeekly, {
            retryAttempts: 2,
        }));
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
        fridayNotifyRule.addTarget(new targets.LambdaFunction(ec2LauncherLambdaNotify, {
            retryAttempts: 2,
        }));
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
exports.AppStack = AppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQyx5REFBMkM7QUFJM0MsMkRBQTZDO0FBQzdDLCtEQUFpRDtBQUNqRCx5REFBMkM7QUFDM0Msc0VBQXdEO0FBQ3hELGdHQUFrRjtBQUNsRiw4RkFBZ0Y7QUFDaEYsK0RBQWlEO0FBQ2pELHdFQUEwRDtBQUMxRCx1REFBeUM7QUFDekMsdUVBQXlEO0FBQ3pELHVGQUF5RTtBQUN6RSxpRUFBbUQ7QUFDbkQsaUZBQW1FO0FBQ25FLHdFQUEwRDtBQUMxRCxpRUFBbUQ7QUFDbkQsMkNBQTZCO0FBYzdCLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3JDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUN0QixNQUFNLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDeEQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO1FBRXpDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVD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SUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQ3BELEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxXQUFXO1lBQzFDLFdBQVcsRUFBRSxvREFBb0Q7U0FDbEUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbHZCRCw0QkFrdkJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWd3djIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXl2Mic7XG5pbXBvcnQgKiBhcyBhcGlnd3YyX2ludGVncmF0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyLWludGVncmF0aW9ucyc7XG5pbXBvcnQgKiBhcyBhcGlnd3YyX2F1dGhvcml6ZXJzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djItYXV0aG9yaXplcnMnO1xuaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udF9vcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgKiBhcyByb3V0ZTUzX3RhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBhY20gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgY2ZnOiBhbnk7XG4gIHZwYzogZWMyLklWcGM7IC8vIEVDMuOCpOODs+OCueOCv+ODs+OCueeUqOOBq1ZQQ+OBjOW/heimgVxuICBldmVudHNUYWJsZTogZHluYW1vZGIuSVRhYmxlO1xuICB1c2Vyc1RhYmxlOiBkeW5hbW9kYi5JVGFibGU7XG4gIHN1bW1hcmllc1RhYmxlOiBkeW5hbW9kYi5JVGFibGU7XG4gIGNpdHlHZW9UYWJsZTogZHluYW1vZGIuSVRhYmxlO1xuICBsaW5lU2VjcmV0OiBzZWNyZXRzbWFuYWdlci5JU2VjcmV0O1xuICBhbGFybVRvcGljOiBzbnMuSVRvcGljO1xuICBhcHBMb2dHcm91cDogbG9ncy5JTG9nR3JvdXA7XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBcHBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBjZmcgPSBwcm9wcy5jZmc7XG4gICAgY29uc3QgcHJlZml4ID0gYCR7Y2ZnLm9yZ30tJHtjZmcuc2hvcnR9LSR7Y2ZnLmVudk5hbWV9YDtcbiAgICBjb25zdCByZWdpb24gPSBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uO1xuXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdPcmcnLCBjZmcub3JnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ1N5c3RlbScsIGNmZy5zeXN0ZW0pO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW52JywgY2ZnLmVudk5hbWUpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnT3duZXInLCAnb3VtYTA2MjMnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01hbmFnZWRCeScsICdjZGsnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0Nvc3RDZW50ZXInLCAndHJhaW5pbmcnKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBDb2duaXRvIFVzZXJQb29s77yI5pei5a2Y44KS5Y+C54Wn44GZ44KL44GL44CB5paw6KaP5L2c5oiQ77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFRPRE86IOaXouWtmOOBrlVzZXJQb29s44KS5Y+C54Wn44GZ44KL5aC05ZCI44Gv44CBVXNlclBvb2wuZnJvbVVzZXJQb29sSWQoKeOCkuS9v+eUqFxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1VzZXJQb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiBgJHtwcmVmaXh9LXVzZXJwb29sYCxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLCAvLyDjgrvjg6vjg5XjgrXjgqTjg7PjgqLjg4Pjg5fjgpLmnInlirnljJZcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHsgZW1haWw6IHRydWUgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCwgLy8g44OR44K544Ov44O844OJ44Gu5pyA5bCP6ZW344KSOOaWh+Wtl+OBq+WkieabtO+8iDEy5paH5a2X44Gv5Y6z44GX44GZ44GO44KL77yJXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IGZhbHNlLCAvLyDlpKfmloflrZfjgpLlv4XpoIjjgYvjgonlpJbjgZnvvIjjg6bjg7zjgrbjg5Pjg6rjg4bjgqPlkJHkuIrvvIlcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLCAvLyDoqJjlj7fjgpLlv4XpoIjjgYvjgonlpJbjgZnvvIjjg6bjg7zjgrbjg5Pjg6rjg4bjgqPlkJHkuIrvvIlcbiAgICAgIH0sXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICfjgYLjgarjgZ/jga7jgqLjgqvjgqbjg7Pjg4jnorroqo3jgrPjg7zjg4knLFxuICAgICAgICBlbWFpbEJvZHk6ICfnorroqo3jgrPjg7zjg4k6IHsjIyMjfScsXG4gICAgICAgIGVtYWlsU3R5bGU6IGNvZ25pdG8uVmVyaWZpY2F0aW9uRW1haWxTdHlsZS5DT0RFLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sRG9tYWluUHJlZml4ID0gYCR7Y2ZnLm9yZ30tJHtjZmcuc2hvcnR9LSR7Y2ZnLmVudk5hbWV9LWF1dGhgXG4gICAgICAudG9Mb3dlckNhc2UoKVxuICAgICAgLnJlcGxhY2UoL1teYS16MC05LV0vZywgJycpO1xuXG4gICAgY29uc3QgdXNlclBvb2xEb21haW4gPSB1c2VyUG9vbC5hZGREb21haW4oJ1VzZXJQb29sRG9tYWluJywge1xuICAgICAgY29nbml0b0RvbWFpbjogeyBkb21haW5QcmVmaXg6IHVzZXJQb29sRG9tYWluUHJlZml4IH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcHBEb21haW4gPSAoY2ZnLnN1YmRvbWFpbnM/LmFwcCBhcyBzdHJpbmcpID8/IGBhcHAuJHtjZmcuZG9tYWlufWA7XG5cbiAgICBjb25zdCBjYWxsYmFja1VybHMgPSBbXG4gICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2FwcC9jYWxsYmFjaycsXG4gICAgICBgaHR0cHM6Ly8ke2FwcERvbWFpbn0vYXBwL2NhbGxiYWNrYCxcbiAgICBdO1xuXG4gICAgY29uc3QgbG9nb3V0VXJscyA9IFtcbiAgICAgICdodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBwJyxcbiAgICAgIGBodHRwczovLyR7YXBwRG9tYWlufS9hcHBgLFxuICAgIF07XG5cbiAgICBjb25zdCB1c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sLFxuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IGZhbHNlLFxuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSwgLy8gVVNFUl9QQVNTV09SRF9BVVRI44OV44Ot44O844KS5pyJ5Yq55YyWXG4gICAgICAgIHVzZXJTcnA6IHRydWUsIC8vIFVTRVJfU1JQX0FVVEjjg5Xjg63jg7zjgpLmnInlirnljJbvvIhhbWF6b24tY29nbml0by1pZGVudGl0eS1qc+OBruODh+ODleOCqeODq+ODiO+8iVxuICAgICAgICBhZG1pblVzZXJQYXNzd29yZDogZmFsc2UsXG4gICAgICAgIGN1c3RvbTogZmFsc2UsXG4gICAgICB9LFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgZmxvd3M6IHsgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSB9LFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklELFxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5FTUFJTCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGJhY2tVcmxzLFxuICAgICAgICBsb2dvdXRVcmxzLFxuICAgICAgfSxcbiAgICAgIHN1cHBvcnRlZElkZW50aXR5UHJvdmlkZXJzOiBbXG4gICAgICAgIGNvZ25pdG8uVXNlclBvb2xDbGllbnRJZGVudGl0eVByb3ZpZGVyLkNPR05JVE8sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIExhbWJkYSBMYXllcu+8iOWFsemAmuS+neWtmOmWouS/gu+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCBsYXllclppcFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vYXNzZXRzL2xheWVyLnppcCcpO1xuICAgIGNvbnN0IGRlcGVuZGVuY2llc0xheWVyID0gbmV3IGxhbWJkYS5MYXllclZlcnNpb24odGhpcywgJ0RlcGVuZGVuY2llc0xheWVyJywge1xuICAgICAgbGF5ZXJWZXJzaW9uTmFtZTogYCR7cHJlZml4fS1kZXBlbmRlbmNpZXMtbGF5ZXJgLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGxheWVyWmlwUGF0aCksXG4gICAgICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWF0sXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1vbiBkZXBlbmRlbmNpZXMgZm9yIExhbWJkYSBmdW5jdGlvbnMgKEBhd3Mtc2RrLCBheGlvcywgZXhwcmVzcywgZXRjLiknLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIExhbWJkYemWouaVsO+8iEFQSe+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCBhcGlaaXBQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2Fzc2V0cy9hcGkvZGlzdC56aXAnKTtcbiAgICAvLyDjgrPjgrnjg4jliYrmuJvjga7jgZ/jgoHjgIHjgZnjgbnjgabjga5MYW1iZGHplqLmlbDjgpJWUEPlpJbjgavphY3nva7vvIjjgqTjg7Pjgr/jg7zjg43jg4Pjg4jntYznlLHjgadBV1PjgrXjg7zjg5PjgrnjgavjgqLjgq/jgrvjgrnvvIlcbiAgICAvLyBWUEMgSW50ZXJmYWNlIEVuZHBvaW50c+OBjOS4jeimgeOBq+OBquOCiuOAgeaciOmhjee0hDEzLDAwMOWGhuOBruOCs+OCueODiOWJiua4m1xuXG4gICAgLy8gTGFtYmRh5a6f6KGM44Ot44O844Or77yIQVBJ55So77yJXG4gICAgY29uc3QgYXBpTGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQXBpTGFtYmRhUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgLy8gVlBD5aSW44Gr6YWN572u44GZ44KL44Gf44KB44CBVlBD6Zai6YCj44Gu44Oe44ON44O844K444OJ44Od44Oq44K344O844Gv5LiN6KaBXG4gICAgfSk7XG5cbiAgICAvLyBEeW5hbW9EQuaoqemZkFxuICAgIHByb3BzLmV2ZW50c1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGFSb2xlKTtcbiAgICBwcm9wcy51c2Vyc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGFSb2xlKTtcbiAgICBwcm9wcy5zdW1tYXJpZXNUYWJsZS5ncmFudFJlYWREYXRhKGFwaUxhbWJkYVJvbGUpO1xuICAgIHByb3BzLmNpdHlHZW9UYWJsZS5ncmFudFJlYWREYXRhKGFwaUxhbWJkYVJvbGUpO1xuXG4gICAgLy8gU2VjcmV0cyBNYW5hZ2Vy5qip6ZmQXG4gICAgcHJvcHMubGluZVNlY3JldC5ncmFudFJlYWQoYXBpTGFtYmRhUm9sZSk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIExvZ3PmqKnpmZBcbiAgICBwcm9wcy5hcHBMb2dHcm91cC5ncmFudFdyaXRlKGFwaUxhbWJkYVJvbGUpO1xuXG4gICAgLy8gZXZlbnRzLXNlYXJjaFxuICAgIGNvbnN0IGV2ZW50c1NlYXJjaEZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQXBpRXZlbnRzU2VhcmNoRm4nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke3ByZWZpeH0tYXBpLWV2ZW50cy1zZWFyY2hgLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcnMvZXZlbnRzLXNlYXJjaC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhcGlaaXBQYXRoKSxcbiAgICAgIGxheWVyczogW2RlcGVuZGVuY2llc0xheWVyXSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCge+8iVxuICAgICAgcm9sZTogYXBpTGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX1RBQkxFX0VWRU5UUzogcHJvcHMuZXZlbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBEWU5BTU9EQl9UQUJMRV9VU0VSUzogcHJvcHMudXNlcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERZTkFNT0RCX1RBQkxFX1NVTU1BUklFUzogcHJvcHMuc3VtbWFyaWVzVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGxvZ0dyb3VwOiBwcm9wcy5hcHBMb2dHcm91cCxcbiAgICB9KTtcblxuICAgIC8vIGV2ZW50cy1kZXRhaWxcbiAgICBjb25zdCBldmVudHNEZXRhaWxGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FwaUV2ZW50c0RldGFpbEZuJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtwcmVmaXh9LWFwaS1ldmVudHMtZGV0YWlsYCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzL2V2ZW50cy1kZXRhaWwuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYXBpWmlwUGF0aCksXG4gICAgICBsYXllcnM6IFtkZXBlbmRlbmNpZXNMYXllcl0sXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgICAvLyBWUEPlpJbjgavphY3nva7vvIjjgrPjgrnjg4jliYrmuJvjga7jgZ/jgoHvvIlcbiAgICAgIHJvbGU6IGFwaUxhbWJkYVJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9EQl9UQUJMRV9FVkVOVFM6IHByb3BzLmV2ZW50c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBsb2dHcm91cDogcHJvcHMuYXBwTG9nR3JvdXAsXG4gICAgfSk7XG5cbiAgICAvLyB3ZWVrZW5kXG4gICAgY29uc3Qgd2Vla2VuZEZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQXBpV2Vla2VuZEZuJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtwcmVmaXh9LWFwaS13ZWVrZW5kYCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzL3dlZWtlbmQuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYXBpWmlwUGF0aCksXG4gICAgICBsYXllcnM6IFtkZXBlbmRlbmNpZXNMYXllcl0sXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgICAvLyBWUEPlpJbjgavphY3nva7vvIjjgrPjgrnjg4jliYrmuJvjga7jgZ/jgoHvvIlcbiAgICAgIHJvbGU6IGFwaUxhbWJkYVJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9EQl9UQUJMRV9FVkVOVFM6IHByb3BzLmV2ZW50c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRFlOQU1PREJfVEFCTEVfVVNFUlM6IHByb3BzLnVzZXJzVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIGxvZ0dyb3VwOiBwcm9wcy5hcHBMb2dHcm91cCxcbiAgICB9KTtcblxuICAgIC8vIHVzZXJzLXNldHRpbmdzLWdldFxuICAgIGNvbnN0IHVzZXJzU2V0dGluZ3NHZXRGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FwaVVzZXJzU2V0dGluZ3NHZXRGbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJlZml4fS1hcGktdXNlcnMtc2V0dGluZ3MtZ2V0YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzL3VzZXJzLXNldHRpbmdzLWdldC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhcGlaaXBQYXRoKSxcbiAgICAgIGxheWVyczogW2RlcGVuZGVuY2llc0xheWVyXSxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCge+8iVxuICAgICAgcm9sZTogYXBpTGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX1RBQkxFX1VTRVJTOiBwcm9wcy51c2Vyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBsb2dHcm91cDogcHJvcHMuYXBwTG9nR3JvdXAsXG4gICAgfSk7XG5cbiAgICAvLyB1c2Vycy1zZXR0aW5ncy1wb3N0XG4gICAgY29uc3QgdXNlcnNTZXR0aW5nc1Bvc3RGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FwaVVzZXJzU2V0dGluZ3NQb3N0Rm4nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke3ByZWZpeH0tYXBpLXVzZXJzLXNldHRpbmdzLXBvc3RgLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcnMvdXNlcnMtc2V0dGluZ3MtcG9zdC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhcGlaaXBQYXRoKSxcbiAgICAgIGxheWVyczogW2RlcGVuZGVuY2llc0xheWVyXSxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCge+8iVxuICAgICAgcm9sZTogYXBpTGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX1RBQkxFX1VTRVJTOiBwcm9wcy51c2Vyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICBsb2dHcm91cDogcHJvcHMuYXBwTG9nR3JvdXAsXG4gICAgfSk7XG5cbiAgICAvLyBsaW5lLWxpbmtcbiAgICBjb25zdCBsaW5lTGlua0ZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQXBpTGluZUxpbmtGbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJlZml4fS1hcGktbGluZS1saW5rYCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzL2xpbmUtbGluay5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChhcGlaaXBQYXRoKSxcbiAgICAgIGxheWVyczogW2RlcGVuZGVuY2llc0xheWVyXSxcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCge+8iVxuICAgICAgcm9sZTogYXBpTGFtYmRhUm9sZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX1RBQkxFX1VTRVJTOiBwcm9wcy51c2Vyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgU0VDUkVUX05BTUVfTElORTogcHJvcHMubGluZVNlY3JldC5zZWNyZXROYW1lLFxuICAgICAgfSxcbiAgICAgIGxvZ0dyb3VwOiBwcm9wcy5hcHBMb2dHcm91cCxcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBMYW1iZGHplqLmlbDvvIjjg5Djg4Pjg4HvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgYmF0Y2haaXBQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2Fzc2V0cy9iYXRjaC9kaXN0LnppcCcpO1xuXG4gICAgLy8gTGFtYmRh5a6f6KGM44Ot44O844Or77yI44OQ44OD44OB55So77yJXG4gICAgY29uc3QgYmF0Y2hMYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdCYXRjaExhbWJkYVJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ruOBmeOCi+OBn+OCgeOAgVZQQ+mWoumAo+OBruODnuODjeODvOOCuOODieODneODquOCt+ODvOOBr+S4jeimgVxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vRELmqKnpmZBcbiAgICBwcm9wcy5ldmVudHNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYmF0Y2hMYW1iZGFSb2xlKTtcbiAgICBwcm9wcy51c2Vyc1RhYmxlLmdyYW50UmVhZERhdGEoYmF0Y2hMYW1iZGFSb2xlKTtcbiAgICBwcm9wcy5zdW1tYXJpZXNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYmF0Y2hMYW1iZGFSb2xlKTtcblxuICAgIC8vIFNlY3JldHMgTWFuYWdlcuaoqemZkFxuICAgIHByb3BzLmxpbmVTZWNyZXQuZ3JhbnRSZWFkKGJhdGNoTGFtYmRhUm9sZSk7XG5cbiAgICAvLyBCZWRyb2Nr5qip6ZmQXG4gICAgYmF0Y2hMYW1iZGFSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFsnYmVkcm9jazpJbnZva2VNb2RlbCddLFxuICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICBgYXJuOmF3czpiZWRyb2NrOiR7Y2ZnLmJlZHJvY2s/LnJlZ2lvbiB8fCAndXMtZWFzdC0xJ306OmZvdW5kYXRpb24tbW9kZWwvJHtjZmcuYmVkcm9jaz8ubW9kZWxJZCB8fCAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJ31gLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dz5qip6ZmQXG4gICAgY29uc3QgYmF0Y2hMb2dHcm91cCA9IGxvZ3MuTG9nR3JvdXAuZnJvbUxvZ0dyb3VwTmFtZShcbiAgICAgIHRoaXMsXG4gICAgICAnQmF0Y2hMb2dHcm91cCcsXG4gICAgICBgL291bWEvZmUvJHtjZmcuZW52TmFtZX0vYmF0Y2hgXG4gICAgKTtcbiAgICBiYXRjaExvZ0dyb3VwLmdyYW50V3JpdGUoYmF0Y2hMYW1iZGFSb2xlKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBFQzLjgrnjg53jg4Pjg4jjgqTjg7Pjgrnjgr/jg7PjgrnnlKjjg6rjgr3jg7zjgrnvvIjjg5Djg4Pjg4Hlh6bnkIbvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g44K744Kt44Ol44Oq44OG44Kj44Kw44Or44O844OXXG4gICAgY29uc3QgYmF0Y2hTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdCYXRjaFNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIGJhdGNoIEVDMiBpbnN0YW5jZXMnLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIEVDMuOCpOODs+OCueOCv+ODs+OCueeUqElBTeODreODvOODq1xuICAgIGNvbnN0IGJhdGNoRWMyUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQmF0Y2hFYzJSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VjMi5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25TU01NYW5hZ2VkSW5zdGFuY2VDb3JlJyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vRELjgqLjgq/jgrvjgrnmqKnpmZBcbiAgICBwcm9wcy5ldmVudHNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYmF0Y2hFYzJSb2xlKTtcbiAgICBwcm9wcy51c2Vyc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShiYXRjaEVjMlJvbGUpO1xuICAgIHByb3BzLnN1bW1hcmllc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShiYXRjaEVjMlJvbGUpO1xuICAgIHByb3BzLmNpdHlHZW9UYWJsZS5ncmFudFJlYWREYXRhKGJhdGNoRWMyUm9sZSk7XG5cbiAgICAvLyBTZWNyZXRzIE1hbmFnZXLjgqLjgq/jgrvjgrnmqKnpmZBcbiAgICBwcm9wcy5saW5lU2VjcmV0LmdyYW50UmVhZChiYXRjaEVjMlJvbGUpO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dz44Ki44Kv44K744K55qip6ZmQXG4gICAgYmF0Y2hMb2dHcm91cC5ncmFudFdyaXRlKGJhdGNoRWMyUm9sZSk7XG5cbiAgICAvLyBFQzLjgqTjg7Pjgrnjgr/jg7PjgrnntYLkuobmqKnpmZBcbiAgICBiYXRjaEVjMlJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogWydlYzI6RGVzY3JpYmVJbnN0YW5jZXMnLCAnZWMyOlRlcm1pbmF0ZUluc3RhbmNlcyddLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgU3RyaW5nRXF1YWxzOiB7XG4gICAgICAgICAgICAnZWMyOlJlc291cmNlVGFnL0JhdGNoVHlwZSc6IFsnd2Vla2x5LWluZ2VzdCcsICdmcmlkYXktbm90aWZ5J10sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEVDMuOCpOODs+OCueOCv+ODs+OCueODl+ODreODleOCoeOCpOODq1xuICAgIGNvbnN0IGJhdGNoSW5zdGFuY2VQcm9maWxlID0gbmV3IGlhbS5JbnN0YW5jZVByb2ZpbGUodGhpcywgJ0JhdGNoSW5zdGFuY2VQcm9maWxlJywge1xuICAgICAgcm9sZTogYmF0Y2hFYzJSb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gRUMy44Kk44Oz44K544K/44Oz44K56LW35YuV55SoTGFtYmRh6Zai5pWw44GuSUFN44Ot44O844OrXG4gICAgY29uc3QgZWMyTGF1bmNoZXJSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdFYzJMYXVuY2hlclJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBFQzLjgqTjg7Pjgrnjgr/jg7Pjgrnotbfli5XmqKnpmZBcbiAgICBlYzJMYXVuY2hlclJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogWydlYzI6UnVuSW5zdGFuY2VzJ10sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBFQzLjgqTjg7Pjgrnjgr/jg7Pjgrnjgr/jgrDku5jjgZHmqKnpmZBcbiAgICBlYzJMYXVuY2hlclJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogWydlYzI6Q3JlYXRlVGFncyddLFxuICAgICAgICByZXNvdXJjZXM6IFsnYXJuOmF3czplYzI6KjoqOmluc3RhbmNlLyonXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIElBTeODreODvOODq+OBruODkeOCueOCueODq+ODvOaoqemZkFxuICAgIGVjMkxhdW5jaGVyUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbJ2lhbTpQYXNzUm9sZSddLFxuICAgICAgICByZXNvdXJjZXM6IFtiYXRjaEVjMlJvbGUucm9sZUFybl0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyDjgrXjg5bjg43jg4Pjg4jjga7lj5blvpfvvIjjg5Hjg5bjg6rjg4Pjgq/jgrXjg5bjg43jg4Pjg4jjgpLkvb/nlKjvvIlcbiAgICBjb25zdCBwdWJsaWNTdWJuZXRzID0gcHJvcHMudnBjLnB1YmxpY1N1Ym5ldHM7XG4gICAgaWYgKHB1YmxpY1N1Ym5ldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ODkeODluODquODg+OCr+OCteODluODjeODg+ODiOOBjOimi+OBpOOBi+OCiuOBvuOBm+OCkycpO1xuICAgIH1cbiAgICBjb25zdCBzdWJuZXQgPSBwdWJsaWNTdWJuZXRzWzBdO1xuXG4gICAgLy8gRUMy44Kk44Oz44K544K/44Oz44K56LW35YuV55SoTGFtYmRh6Zai5pWw44Gu44Kz44O844OJ44OR44K5XG4gICAgY29uc3QgZWMyTGF1bmNoZXJaaXBQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL2xhbWJkYS9lYzItbGF1bmNoZXInKTtcblxuICAgIC8vIFMz44OQ44Kx44OD44OI5ZCN77yI5pei5a2Y44Guc3RhdGljV2ViQnVja2V044KS5L2/55So44CB5b6M44Gn5a6a576p44GV44KM44KL77yJXG4gICAgY29uc3QgYmF0Y2hDb2RlQnVja2V0TmFtZSA9IGAke3ByZWZpeH0tc3RhdGljLXdlYmA7XG5cbiAgICAvLyBFQzLjgqTjg7Pjgrnjgr/jg7Pjgrnotbfli5XnlKhMYW1iZGHplqLmlbDvvIh3ZWVrbHktaW5nZXN055So77yJXG4gICAgY29uc3QgZWMyTGF1bmNoZXJMYW1iZGFXZWVrbHkgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdFYzJMYXVuY2hlcldlZWtseScsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJlZml4fS1lYzItbGF1bmNoZXItd2Vla2x5LWluZ2VzdGAsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChlYzJMYXVuY2hlclppcFBhdGgpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICByb2xlOiBlYzJMYXVuY2hlclJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBJTlNUQU5DRV9UWVBFOiAndDMubWljcm8nLFxuICAgICAgICBBTUlfSUQ6ICdhbWktMGZmNWFkMjZiMDc5ZjAwMGQnLCAvLyBBbWF6b24gTGludXggMjAyMyB3aXRoIE5vZGUuanMgMjAueCAoYXAtbm9ydGhlYXN0LTEpXG4gICAgICAgIFNFQ1VSSVRZX0dST1VQX0lEOiBiYXRjaFNlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkLFxuICAgICAgICBTVUJORVRfSUQ6IHN1Ym5ldC5zdWJuZXRJZCxcbiAgICAgICAgSUFNX1JPTEVfQVJOOiBiYXRjaEluc3RhbmNlUHJvZmlsZS5pbnN0YW5jZVByb2ZpbGVBcm4sXG4gICAgICAgIEJBVENIX1RZUEU6ICd3ZWVrbHktaW5nZXN0JyxcbiAgICAgICAgLy8gQVdTX1JFR0lPTuOBr0xhbWJkYeODqeODs+OCv+OCpOODoOOBq+OCiOOBo+OBpuiHquWLleeahOOBq+ioreWumuOBleOCjOOCi+OBn+OCgeOAgeioreWumuS4jeimgVxuICAgICAgICBTM19CVUNLRVQ6IGJhdGNoQ29kZUJ1Y2tldE5hbWUsXG4gICAgICAgIFMzX0tFWTogJ2JhdGNoLWNvZGUuemlwJyxcbiAgICAgIH0sXG4gICAgICBsb2dHcm91cDogcHJvcHMuYXBwTG9nR3JvdXAsXG4gICAgfSk7XG5cbiAgICAvLyBFQzLjgqTjg7Pjgrnjgr/jg7Pjgrnotbfli5XnlKhMYW1iZGHplqLmlbDvvIhmcmlkYXktbm90aWZ555So77yJXG4gICAgY29uc3QgZWMyTGF1bmNoZXJMYW1iZGFOb3RpZnkgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdFYzJMYXVuY2hlck5vdGlmeScsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJlZml4fS1lYzItbGF1bmNoZXItZnJpZGF5LW5vdGlmeWAsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChlYzJMYXVuY2hlclppcFBhdGgpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICByb2xlOiBlYzJMYXVuY2hlclJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBJTlNUQU5DRV9UWVBFOiAndDMubWljcm8nLFxuICAgICAgICBBTUlfSUQ6ICdhbWktMGZmNWFkMjZiMDc5ZjAwMGQnLCAvLyBBbWF6b24gTGludXggMjAyMyB3aXRoIE5vZGUuanMgMjAueCAoYXAtbm9ydGhlYXN0LTEpXG4gICAgICAgIFNFQ1VSSVRZX0dST1VQX0lEOiBiYXRjaFNlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkLFxuICAgICAgICBTVUJORVRfSUQ6IHN1Ym5ldC5zdWJuZXRJZCxcbiAgICAgICAgSUFNX1JPTEVfQVJOOiBiYXRjaEluc3RhbmNlUHJvZmlsZS5pbnN0YW5jZVByb2ZpbGVBcm4sXG4gICAgICAgIEJBVENIX1RZUEU6ICdmcmlkYXktbm90aWZ5JyxcbiAgICAgICAgLy8gQVdTX1JFR0lPTuOBr0xhbWJkYeODqeODs+OCv+OCpOODoOOBq+OCiOOBo+OBpuiHquWLleeahOOBq+ioreWumuOBleOCjOOCi+OBn+OCgeOAgeioreWumuS4jeimgVxuICAgICAgICBTM19CVUNLRVQ6IGJhdGNoQ29kZUJ1Y2tldE5hbWUsXG4gICAgICAgIFMzX0tFWTogJ2JhdGNoLWNvZGUuemlwJyxcbiAgICAgIH0sXG4gICAgICBsb2dHcm91cDogcHJvcHMuYXBwTG9nR3JvdXAsXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gTGFtYmRh6Zai5pWw77yI44OQ44OD44OB77yJLSDml6LlrZjvvIjmrrXpmo7nmoTjgavliYrpmaTkuojlrprvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gd2Vla2x5LWluZ2VzdFxuICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCgeOAgeOCpOODs+OCv+ODvOODjeODg+ODiOe1jOeUseOBp0FXU+OCteODvOODk+OCueOBq+OCouOCr+OCu+OCue+8iVxuICAgIGNvbnN0IHdlZWtseUluZ2VzdEZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQmF0Y2hXZWVrbHlJbmdlc3RGbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJlZml4fS1iYXRjaC13ZWVrbHktaW5nZXN0YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzL2luZ2VzdC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChiYXRjaFppcFBhdGgpLFxuICAgICAgbGF5ZXJzOiBbZGVwZW5kZW5jaWVzTGF5ZXJdLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCge+8iVxuICAgICAgcm9sZTogYmF0Y2hMYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PREJfVEFCTEVfRVZFTlRTOiBwcm9wcy5ldmVudHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEVOQUJMRV9ESVNDT1ZFUlk6ICdmYWxzZScsXG4gICAgICB9LFxuICAgICAgbG9nR3JvdXA6IGJhdGNoTG9nR3JvdXAsXG4gICAgfSk7XG5cbiAgICAvLyBmcmlkYXktbm90aWZ5XG4gICAgLy8gVlBD5aSW44Gr6YWN572u77yI44Kz44K544OI5YmK5rib44Gu44Gf44KB44CB44Kk44Oz44K/44O844ON44OD44OI57WM55Sx44GnQVdT44K144O844OT44K544Gr44Ki44Kv44K744K577yJXG4gICAgY29uc3QgZnJpZGF5Tm90aWZ5Rm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdCYXRjaEZyaWRheU5vdGlmeUZuJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtwcmVmaXh9LWJhdGNoLWZyaWRheS1ub3RpZnlgLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcnMvbm90aWZ5LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGJhdGNoWmlwUGF0aCksXG4gICAgICBsYXllcnM6IFtkZXBlbmRlbmNpZXNMYXllcl0sXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIC8vIFZQQ+WkluOBq+mFjee9ru+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCge+8iVxuICAgICAgcm9sZTogYmF0Y2hMYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PREJfVEFCTEVfRVZFTlRTOiBwcm9wcy5ldmVudHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERZTkFNT0RCX1RBQkxFX1VTRVJTOiBwcm9wcy51c2Vyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRFlOQU1PREJfVEFCTEVfU1VNTUFSSUVTOiBwcm9wcy5zdW1tYXJpZXNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFNFQ1JFVF9OQU1FX0xJTkU6IHByb3BzLmxpbmVTZWNyZXQuc2VjcmV0TmFtZSxcbiAgICAgICAgQkVEUk9DS19NT0RFTF9JRDogY2ZnLmJlZHJvY2s/Lm1vZGVsSWQgfHwgJ2FudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MCcsXG4gICAgICAgIEJFRFJPQ0tfUkVHSU9OOiBjZmcuYmVkcm9jaz8ucmVnaW9uIHx8ICd1cy1lYXN0LTEnLFxuICAgICAgfSxcbiAgICAgIGxvZ0dyb3VwOiBiYXRjaExvZ0dyb3VwLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEFQSSBHYXRld2F5IEhUVFAgQVBJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnd3YyLkh0dHBBcGkodGhpcywgJ0h0dHBBcGknLCB7XG4gICAgICBhcGlOYW1lOiBgJHtwcmVmaXh9LWh0dHAtYXBpYCxcbiAgICAgIGNvcnNQcmVmbGlnaHQ6IHtcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0F1dGhvcml6YXRpb24nLCAnQ29udGVudC1UeXBlJ10sXG4gICAgICAgIGFsbG93TWV0aG9kczogW1xuICAgICAgICAgIGFwaWd3djIuQ29yc0h0dHBNZXRob2QuR0VULFxuICAgICAgICAgIGFwaWd3djIuQ29yc0h0dHBNZXRob2QuUE9TVCxcbiAgICAgICAgICBhcGlnd3YyLkNvcnNIdHRwTWV0aG9kLlBBVENILFxuICAgICAgICAgIGFwaWd3djIuQ29yc0h0dHBNZXRob2QuREVMRVRFLFxuICAgICAgICAgIGFwaWd3djIuQ29yc0h0dHBNZXRob2QuT1BUSU9OUyxcbiAgICAgICAgXSxcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBbXG4gICAgICAgICAgYGh0dHBzOi8vJHthcHBEb21haW59YCxcbiAgICAgICAgICBgaHR0cHM6Ly8ke2NmZy5zdWJkb21haW5zPy53ZWIgPz8gYHdlYi4ke2NmZy5kb21haW59YH1gLFxuICAgICAgICAgICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxuICAgICAgICBdLFxuICAgICAgICBtYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDEwKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBpc3N1ZXIgPSBgaHR0cHM6Ly9jb2duaXRvLWlkcC4ke3JlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3VzZXJQb29sLnVzZXJQb29sSWR9YDtcblxuICAgIGNvbnN0IGp3dEF1dGhvcml6ZXIgPSBuZXcgYXBpZ3d2Ml9hdXRob3JpemVycy5IdHRwSnd0QXV0aG9yaXplcignSnd0QXV0aG9yaXplcicsIGlzc3Vlciwge1xuICAgICAgand0QXVkaWVuY2U6IFt1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkXSxcbiAgICB9KTtcblxuICAgIC8vIOODq+ODvOODiOWumue+qVxuICAgIGFwaS5hZGRSb3V0ZXMoe1xuICAgICAgcGF0aDogJy92MS9ldmVudHMnLFxuICAgICAgbWV0aG9kczogW2FwaWd3djIuSHR0cE1ldGhvZC5HRVRdLFxuICAgICAgaW50ZWdyYXRpb246IG5ldyBhcGlnd3YyX2ludGVncmF0aW9ucy5IdHRwTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICAgICdFdmVudHNTZWFyY2hJbnRlZ3JhdGlvbicsXG4gICAgICAgIGV2ZW50c1NlYXJjaEZuXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgYXBpLmFkZFJvdXRlcyh7XG4gICAgICBwYXRoOiAnL3YxL2V2ZW50cy97aWR9JyxcbiAgICAgIG1ldGhvZHM6IFthcGlnd3YyLkh0dHBNZXRob2QuR0VUXSxcbiAgICAgIGludGVncmF0aW9uOiBuZXcgYXBpZ3d2Ml9pbnRlZ3JhdGlvbnMuSHR0cExhbWJkYUludGVncmF0aW9uKFxuICAgICAgICAnRXZlbnRzRGV0YWlsSW50ZWdyYXRpb24nLFxuICAgICAgICBldmVudHNEZXRhaWxGblxuICAgICAgKSxcbiAgICB9KTtcblxuICAgIGFwaS5hZGRSb3V0ZXMoe1xuICAgICAgcGF0aDogJy92MS93ZWVrZW5kJyxcbiAgICAgIG1ldGhvZHM6IFthcGlnd3YyLkh0dHBNZXRob2QuR0VUXSxcbiAgICAgIGludGVncmF0aW9uOiBuZXcgYXBpZ3d2Ml9pbnRlZ3JhdGlvbnMuSHR0cExhbWJkYUludGVncmF0aW9uKFxuICAgICAgICAnV2Vla2VuZEludGVncmF0aW9uJyxcbiAgICAgICAgd2Vla2VuZEZuXG4gICAgICApLFxuICAgICAgLy8g6KqN6Ki85LiN6KaB77yI44Ob44O844Og55S76Z2i44Gn6Kqw44Gn44KC6KaL44KJ44KM44KL44KI44GG44Gr44GZ44KL77yJXG4gICAgfSk7XG5cbiAgICAvLyBDb2duaXRv6KqN6Ki844KS5L2/55SoOiBKV1Toqo3oqLzjgpLmnInlirnljJZcbiAgICBhcGkuYWRkUm91dGVzKHtcbiAgICAgIHBhdGg6ICcvdjEvdXNlcnMvbWUvc2V0dGluZ3MnLFxuICAgICAgbWV0aG9kczogW2FwaWd3djIuSHR0cE1ldGhvZC5HRVRdLFxuICAgICAgaW50ZWdyYXRpb246IG5ldyBhcGlnd3YyX2ludGVncmF0aW9ucy5IdHRwTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICAgICdVc2Vyc1NldHRpbmdzR2V0SW50ZWdyYXRpb24nLFxuICAgICAgICB1c2Vyc1NldHRpbmdzR2V0Rm5cbiAgICAgICksXG4gICAgICBhdXRob3JpemVyOiBqd3RBdXRob3JpemVyLCAvLyBDb2duaXRv6KqN6Ki844KS5pyJ5Yq55YyWXG4gICAgfSk7XG5cbiAgICBhcGkuYWRkUm91dGVzKHtcbiAgICAgIHBhdGg6ICcvdjEvdXNlcnMvbWUvc2V0dGluZ3MnLFxuICAgICAgbWV0aG9kczogW2FwaWd3djIuSHR0cE1ldGhvZC5QT1NUXSxcbiAgICAgIGludGVncmF0aW9uOiBuZXcgYXBpZ3d2Ml9pbnRlZ3JhdGlvbnMuSHR0cExhbWJkYUludGVncmF0aW9uKFxuICAgICAgICAnVXNlcnNTZXR0aW5nc1Bvc3RJbnRlZ3JhdGlvbicsXG4gICAgICAgIHVzZXJzU2V0dGluZ3NQb3N0Rm5cbiAgICAgICksXG4gICAgICBhdXRob3JpemVyOiBqd3RBdXRob3JpemVyLCAvLyBDb2duaXRv6KqN6Ki844KS5pyJ5Yq55YyWXG4gICAgfSk7XG5cbiAgICBhcGkuYWRkUm91dGVzKHtcbiAgICAgIHBhdGg6ICcvdjEvbGluZS9saW5rJyxcbiAgICAgIG1ldGhvZHM6IFthcGlnd3YyLkh0dHBNZXRob2QuUE9TVF0sXG4gICAgICBpbnRlZ3JhdGlvbjogbmV3IGFwaWd3djJfaW50ZWdyYXRpb25zLkh0dHBMYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgICAgJ0xpbmVMaW5rSW50ZWdyYXRpb24nLFxuICAgICAgICBsaW5lTGlua0ZuXG4gICAgICApLFxuICAgICAgYXV0aG9yaXplcjogand0QXV0aG9yaXplciwgLy8gQ29nbml0b+iqjeiovOOCkuacieWKueWMllxuICAgIH0pO1xuXG4gICAgLy8g44Kr44K544K/44Og44OJ44Oh44Kk44Oz6Kit5a6aXG4gICAgY29uc3QgY2VydEFybiA9IChjZmcuYWNtQ2VydEFybiBhcyBzdHJpbmcpID8/ICcnO1xuICAgIGlmICghY2VydEFybiB8fCBjZXJ0QXJuID09PSAnUExBQ0VIT0xERVJfUkVQTEFDRV9XSVRIX0FDVFVBTF9BUk4nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NmZy5hY21DZXJ0QXJuIGlzIHJlcXVpcmVkIChBQ00gY2VydGlmaWNhdGUgQVJOKS4gUGxlYXNlIHNldCBpdCBpbiBjb25maWcvcHJkLmpzb24nKTtcbiAgICB9XG4gICAgY29uc3QgY2VydCA9IGFjbS5DZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4odGhpcywgJ0FwaUNlcnQnLCBjZXJ0QXJuKTtcblxuICAgIGNvbnN0IGFwaURvbWFpbiA9IChjZmcuc3ViZG9tYWlucz8uYXBpIGFzIHN0cmluZykgPz8gYGFwaS4ke2NmZy5kb21haW59YDtcbiAgICBjb25zdCBhcGlEb21haW5OYW1lID0gbmV3IGFwaWd3djIuRG9tYWluTmFtZSh0aGlzLCAnQXBpRG9tYWluTmFtZScsIHtcbiAgICAgIGRvbWFpbk5hbWU6IGFwaURvbWFpbixcbiAgICAgIGNlcnRpZmljYXRlOiBjZXJ0LFxuICAgIH0pO1xuXG4gICAgbmV3IGFwaWd3djIuQXBpTWFwcGluZyh0aGlzLCAnQXBpTWFwcGluZycsIHtcbiAgICAgIGFwaSxcbiAgICAgIGRvbWFpbk5hbWU6IGFwaURvbWFpbk5hbWUsXG4gICAgICBzdGFnZTogYXBpLmRlZmF1bHRTdGFnZSEsXG4gICAgfSk7XG5cbiAgICBjb25zdCByb290RG9tYWluID0gKGNmZy5kb21haW4gYXMgc3RyaW5nKSA/PyAnb3VtYXNhbi5vcmcnO1xuICAgIGNvbnN0IGhvc3RlZFpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgIGRvbWFpbk5hbWU6IHJvb3REb21haW4sXG4gICAgfSk7XG5cbiAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdBcGlBUmVjb3JkJywge1xuICAgICAgem9uZTogaG9zdGVkWm9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGFwaURvbWFpbixcbiAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKFxuICAgICAgICBuZXcgcm91dGU1M190YXJnZXRzLkFwaUdhdGV3YXl2MkRvbWFpblByb3BlcnRpZXMoXG4gICAgICAgICAgYXBpRG9tYWluTmFtZS5yZWdpb25hbERvbWFpbk5hbWUsXG4gICAgICAgICAgYXBpRG9tYWluTmFtZS5yZWdpb25hbEhvc3RlZFpvbmVJZFxuICAgICAgICApXG4gICAgICApLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFMzICsgQ2xvdWRGcm9udCAoRnJvbnRlbmQpXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IHN0YXRpY1dlYkJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1N0YXRpY1dlYkJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGJhdGNoQ29kZUJ1Y2tldE5hbWUsIC8vIEVDMuOCpOODs+OCueOCv+ODs+OCueeUqOOBq+OCguS9v+eUqFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBFQzLjgqTjg7Pjgrnjgr/jg7PjgrnnlKhJQU3jg63jg7zjg6vjgatTM+OCouOCr+OCu+OCueaoqemZkOOCkui/veWKoFxuICAgIHN0YXRpY1dlYkJ1Y2tldC5ncmFudFJlYWQoYmF0Y2hFYzJSb2xlKTtcblxuICAgIGNvbnN0IGNsb3VkRnJvbnRDZXJ0QXJuID0gKGNmZy5hY21DZXJ0QXJuQ2xvdWRGcm9udCBhcyBzdHJpbmcpID8/ICcnO1xuICAgIGlmICghY2xvdWRGcm9udENlcnRBcm4gfHwgY2xvdWRGcm9udENlcnRBcm4gPT09ICdQTEFDRUhPTERFUl9SRVBMQUNFX1dJVEhfQUNUVUFMX0FSTicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ2NmZy5hY21DZXJ0QXJuQ2xvdWRGcm9udCBpcyByZXF1aXJlZCAoQUNNIGNlcnRpZmljYXRlIEFSTiBmb3IgQ2xvdWRGcm9udCwgdXMtZWFzdC0xKS4gUGxlYXNlIHNldCBpdCBpbiBjb25maWcvcHJkLmpzb24nXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBjbG91ZEZyb250Q2VydCA9IGFjbS5DZXJ0aWZpY2F0ZS5mcm9tQ2VydGlmaWNhdGVBcm4oXG4gICAgICB0aGlzLFxuICAgICAgJ0Nsb3VkRnJvbnRDZXJ0JyxcbiAgICAgIGNsb3VkRnJvbnRDZXJ0QXJuXG4gICAgKTtcblxuICAgIGNvbnN0IHdlYkRvbWFpbiA9IChjZmcuc3ViZG9tYWlucz8ud2ViIGFzIHN0cmluZykgPz8gYHdlYi4ke2NmZy5kb21haW59YDtcblxuICAgIC8vIENsb3VkRnJvbnQgRnVuY3Rpb246IC9ldmVudHMg44Gq44Gp44Gu44OH44Kj44Os44Kv44OI44Oq44OR44K544KSIGluZGV4Lmh0bWwg44Gr5aSJ5o+bXG4gICAgY29uc3QgcmV3cml0ZUZ1bmN0aW9uID0gbmV3IGNsb3VkZnJvbnQuRnVuY3Rpb24odGhpcywgJ1Jld3JpdGVGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYCR7cHJlZml4fS1yZXdyaXRlLWZ1bmN0aW9uYCxcbiAgICAgIGNvZGU6IGNsb3VkZnJvbnQuRnVuY3Rpb25Db2RlLmZyb21JbmxpbmUoYFxuZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICB2YXIgcmVxdWVzdCA9IGV2ZW50LnJlcXVlc3Q7XG4gIHZhciB1cmkgPSByZXF1ZXN0LnVyaTtcbiAgXG4gIC8vIOODh+OCo+ODrOOCr+ODiOODquODkeOCueOBruWgtOWQiO+8iOacq+WwvuOBjCAvIOOBp+OBquOBhOOAgeOBi+OBpOaLoeW8teWtkOOBjOOBquOBhO+8iVxuICBpZiAoIXVyaS5pbmNsdWRlcygnLicpICYmICF1cmkuZW5kc1dpdGgoJy8nKSkge1xuICAgIC8vIC9ldmVudHMgLT4gL2V2ZW50cy9pbmRleC5odG1sXG4gICAgcmVxdWVzdC51cmkgPSB1cmkgKyAnL2luZGV4Lmh0bWwnO1xuICB9IGVsc2UgaWYgKHVyaS5lbmRzV2l0aCgnLycpKSB7XG4gICAgLy8gL2V2ZW50cy8gLT4gL2V2ZW50cy9pbmRleC5odG1sXG4gICAgcmVxdWVzdC51cmkgPSB1cmkgKyAnaW5kZXguaHRtbCc7XG4gIH1cbiAgXG4gIHJldHVybiByZXF1ZXN0O1xufVxuICAgICAgYCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ0Nsb3VkRnJvbnREaXN0cmlidXRpb24nLCB7XG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBjbG91ZGZyb250X29yaWdpbnMuUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0NvbnRyb2woc3RhdGljV2ViQnVja2V0KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19HRVRfSEVBRF9PUFRJT05TLFxuICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uOiByZXdyaXRlRnVuY3Rpb24sXG4gICAgICAgICAgICBldmVudFR5cGU6IGNsb3VkZnJvbnQuRnVuY3Rpb25FdmVudFR5cGUuVklFV0VSX1JFUVVFU1QsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkb21haW5OYW1lczogW3dlYkRvbWFpbl0sXG4gICAgICBjZXJ0aWZpY2F0ZTogY2xvdWRGcm9udENlcnQsXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAgIGVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgIC8vIDQwNOOCqOODqeODvOOBr05leHQuanPjga7jgq/jg6njgqTjgqLjg7Pjg4jjgrXjgqTjg4njg6vjg7zjg4bjgqPjg7PjgrDjgavku7vjgZvjgotcbiAgICAgICAgLy8gNDAz44Ko44Op44O877yIUzPjgafjg5XjgqHjgqTjg6vjgYzopovjgaTjgYvjgonjgarjgYTloLTlkIjvvInjga/jgIFOZXh0Lmpz44Gu44Kv44Op44Kk44Ki44Oz44OI44K144Kk44OJ44Or44O844OG44Kj44Oz44Kw44Gr5Lu744Gb44KLXG4gICAgICAgIC8vIOOCqOODqeODvOODmuODvOOCuOioreWumuOCkuWJiumZpOOBl+OAgVMz44Gu44OH44Kj44Os44Kv44OI44Oq44Kk44Oz44OH44OD44Kv44K55qmf6IO944Gr5Lu744Gb44KLXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnV2ViQVJlY29yZCcsIHtcbiAgICAgIHpvbmU6IGhvc3RlZFpvbmUsXG4gICAgICByZWNvcmROYW1lOiB3ZWJEb21haW4sXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhuZXcgcm91dGU1M190YXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKSksXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gRXZlbnRCcmlkZ2Xjg6vjg7zjg6tcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3Qgd2Vla2x5SW5nZXN0UnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnV2Vla2x5SW5nZXN0UnVsZScsIHtcbiAgICAgIHJ1bGVOYW1lOiBgJHtwcmVmaXh9LXdlZWtseS1pbmdlc3QtcnVsZWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ1dlZWtseSBldmVudCBpbmdlc3Rpb24gYmF0Y2gnLFxuICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5jcm9uKHtcbiAgICAgICAgbWludXRlOiAnMCcsXG4gICAgICAgIGhvdXI6ICcxOCcsXG4gICAgICAgIHdlZWtEYXk6ICdNT04nLCAvLyDmnIjmm5zml6XvvIhVVEPvvIlcbiAgICAgICAgbW9udGg6ICcqJyxcbiAgICAgICAgeWVhcjogJyonLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICAvLyDmrrXpmo7nmoTnp7vooYw6IOOBvuOBmkVDMui1t+WLleeUqExhbWJkYemWouaVsOOCkuOCv+ODvOOCsuODg+ODiOOBq+i/veWKoO+8iOaXouWtmOOBrkxhbWJkYemWouaVsOOBr+aui+OBme+8iVxuICAgIHdlZWtseUluZ2VzdFJ1bGUuYWRkVGFyZ2V0KFxuICAgICAgbmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24oZWMyTGF1bmNoZXJMYW1iZGFXZWVrbHksIHtcbiAgICAgICAgcmV0cnlBdHRlbXB0czogMixcbiAgICAgIH0pXG4gICAgKTtcbiAgICBcbiAgICAvLyBUT0RPOiDli5XkvZznorroqo3lvozjgavml6LlrZjjga53ZWVrbHlJbmdlc3RGbuOCkuWJiumZpFxuICAgIC8vIHdlZWtseUluZ2VzdFJ1bGUuYWRkVGFyZ2V0KFxuICAgIC8vICAgbmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24od2Vla2x5SW5nZXN0Rm4sIHtcbiAgICAvLyAgICAgcmV0cnlBdHRlbXB0czogMixcbiAgICAvLyAgIH0pXG4gICAgLy8gKTtcblxuICAgIGNvbnN0IGZyaWRheU5vdGlmeVJ1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ0ZyaWRheU5vdGlmeVJ1bGUnLCB7XG4gICAgICBydWxlTmFtZTogYCR7cHJlZml4fS1mcmlkYXktbm90aWZ5LXJ1bGVgLFxuICAgICAgZGVzY3JpcHRpb246ICdGcmlkYXkgbm90aWZpY2F0aW9uIGJhdGNoJyxcbiAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUuY3Jvbih7XG4gICAgICAgIG1pbnV0ZTogJzAnLFxuICAgICAgICBob3VyOiAnMTAnLFxuICAgICAgICB3ZWVrRGF5OiAnRlJJJywgLy8g6YeR5puc5pel77yIVVRD77yJXG4gICAgICAgIG1vbnRoOiAnKicsXG4gICAgICAgIHllYXI6ICcqJyxcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgLy8g5q616ZqO55qE56e76KGMOiDjgb7jgZpFQzLotbfli5XnlKhMYW1iZGHplqLmlbDjgpLjgr/jg7zjgrLjg4Pjg4jjgavov73liqDvvIjml6LlrZjjga5MYW1iZGHplqLmlbDjga/mrovjgZnvvIlcbiAgICBmcmlkYXlOb3RpZnlSdWxlLmFkZFRhcmdldChcbiAgICAgIG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGVjMkxhdW5jaGVyTGFtYmRhTm90aWZ5LCB7XG4gICAgICAgIHJldHJ5QXR0ZW1wdHM6IDIsXG4gICAgICB9KVxuICAgICk7XG4gICAgXG4gICAgLy8gVE9ETzog5YuV5L2c56K66KqN5b6M44Gr5pei5a2Y44GuZnJpZGF5Tm90aWZ5Rm7jgpLliYrpmaRcbiAgICAvLyBmcmlkYXlOb3RpZnlSdWxlLmFkZFRhcmdldChcbiAgICAvLyAgIG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGZyaWRheU5vdGlmeUZuLCB7XG4gICAgLy8gICAgIHJldHJ5QXR0ZW1wdHM6IDIsXG4gICAgLy8gICB9KVxuICAgIC8vICk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gT3V0cHV0c1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpQmFzZVVybCcsIHsgdmFsdWU6IGFwaS5hcGlFbmRwb2ludCB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpQ3VzdG9tRG9tYWluJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7YXBpRG9tYWlufWAsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NvZ25pdG9Vc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NvZ25pdG9Vc2VyUG9vbENsaWVudElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NvZ25pdG9Eb21haW4nLCB7XG4gICAgICB2YWx1ZTogYCR7dXNlclBvb2xEb21haW4uZG9tYWluTmFtZX0uYXV0aC4ke3JlZ2lvbn0uYW1hem9uY29nbml0by5jb21gLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdGF0aWNXZWJCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHN0YXRpY1dlYkJ1Y2tldC5idWNrZXROYW1lLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250RGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250RGlzdHJpYnV0aW9uRG9tYWluTmFtZScsIHtcbiAgICAgIHZhbHVlOiBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZSxcbiAgICB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2ViRG9tYWluJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7d2ViRG9tYWlufWAsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0JhdGNoU2VjdXJpdHlHcm91cElkJywge1xuICAgICAgdmFsdWU6IGJhdGNoU2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IEdyb3VwIElEIGZvciBiYXRjaCBFQzIgaW5zdGFuY2VzJyxcbiAgICB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQmF0Y2hJbnN0YW5jZVByb2ZpbGVBcm4nLCB7XG4gICAgICB2YWx1ZTogYmF0Y2hJbnN0YW5jZVByb2ZpbGUuaW5zdGFuY2VQcm9maWxlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdJQU0gSW5zdGFuY2UgUHJvZmlsZSBBUk4gZm9yIGJhdGNoIEVDMiBpbnN0YW5jZXMnLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFYzJMYXVuY2hlckxhbWJkYVdlZWtseUFybicsIHtcbiAgICAgIHZhbHVlOiBlYzJMYXVuY2hlckxhbWJkYVdlZWtseS5mdW5jdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIEFSTiBmb3Igd2Vla2x5LWluZ2VzdCBFQzIgbGF1bmNoZXInLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFYzJMYXVuY2hlckxhbWJkYU5vdGlmeUFybicsIHtcbiAgICAgIHZhbHVlOiBlYzJMYXVuY2hlckxhbWJkYU5vdGlmeS5mdW5jdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIEFSTiBmb3IgZnJpZGF5LW5vdGlmeSBFQzIgbGF1bmNoZXInLFxuICAgIH0pO1xuICB9XG59XG4iXX0=