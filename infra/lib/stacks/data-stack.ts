import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface DataStackProps extends cdk.StackProps {
  cfg: any;
  vpc: ec2.IVpc;
  // lambdaSgは削除（Lambda関数をVPC外に配置したため不要）
}

export class DataStack extends cdk.Stack {
  public readonly eventsTable: dynamodb.Table;
  public readonly usersTable: dynamodb.Table;
  public readonly summariesTable: dynamodb.Table;
  public readonly cityGeoTable: dynamodb.Table;
  public readonly lineSecret: secretsmanager.Secret;
  // lambdaSgは削除（Lambda関数をVPC外に配置したため不要）

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const cfg = props.cfg;
    const prefix = `${cfg.org}-${cfg.short}-${cfg.envName}`;

    cdk.Tags.of(this).add('Org', cfg.org);
    cdk.Tags.of(this).add('System', cfg.system);
    cdk.Tags.of(this).add('Env', cfg.envName);
    cdk.Tags.of(this).add('Owner', 'ouma0623');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
    cdk.Tags.of(this).add('CostCenter', 'training');

    // Events Table
    this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
      tableName: `${prefix}-events`,
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // GSI-1: city-date-index
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'city-date-index',
      partitionKey: { name: 'venueCity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI-2: pref-date-index
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'pref-date-index',
      partitionKey: { name: 'venuePref', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startAt', type: dynamodb.AttributeType.STRING },
    });

    // GSI-3: category-date-index
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: 'category-date-index',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startAt', type: dynamodb.AttributeType.STRING },
    });

    // Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `${prefix}-users`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI-1: line-user-index
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'line-user-index',
      partitionKey: { name: 'lineUserId', type: dynamodb.AttributeType.STRING },
    });

    // GSI-2: notify-enabled-index
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'notify-enabled-index',
      partitionKey: { name: 'notifyEnabled', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // Summaries Table
    this.summariesTable = new dynamodb.Table(this, 'SummariesTable', {
      tableName: `${prefix}-summaries`,
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CityGeo Table
    this.cityGeoTable = new dynamodb.Table(this, 'CityGeoTable', {
      tableName: `${prefix}-citygeo`,
      partitionKey: { name: 'city', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'pref', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // LINE Secret
    this.lineSecret = new secretsmanager.Secret(this, 'LineSecret', {
      secretName: `${prefix}/line`,
      description: 'LINE authentication credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          channelAccessToken: 'PLACEHOLDER',
          channelSecret: 'PLACEHOLDER',
          lineLoginChannelId: 'PLACEHOLDER',
          lineLoginChannelSecret: 'PLACEHOLDER',
        }),
        generateStringKey: 'dummy',
        excludeCharacters: '',
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'EventsTableName', {
      value: this.eventsTable.tableName,
    });
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
    });
    new cdk.CfnOutput(this, 'SummariesTableName', {
      value: this.summariesTable.tableName,
    });
    new cdk.CfnOutput(this, 'CityGeoTableName', {
      value: this.cityGeoTable.tableName,
    });
    new cdk.CfnOutput(this, 'LineSecretName', {
      value: this.lineSecret.secretName,
    });
  }
}

