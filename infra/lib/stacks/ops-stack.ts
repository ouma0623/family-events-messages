import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export interface OpsStackProps extends cdk.StackProps {
  cfg: any;
}

export class OpsStack extends cdk.Stack {
  public readonly alarmTopic: sns.Topic;
  public readonly appLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: OpsStackProps) {
    super(scope, id, props);

    const cfg = props.cfg;
    const prefix = `${cfg.org}-${cfg.short}-${cfg.envName}`;

    cdk.Tags.of(this).add('Org', cfg.org);
    cdk.Tags.of(this).add('System', cfg.system);
    cdk.Tags.of(this).add('Env', cfg.envName);
    cdk.Tags.of(this).add('Owner', 'ouma0623');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
    cdk.Tags.of(this).add('CostCenter', 'training');

    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${prefix}-alarm`,
    });

    const notifyEmail = (cfg.notifyEmail as string) ?? '';
    if (!notifyEmail || notifyEmail === 'PLACEHOLDER_REPLACE_WITH_ACTUAL_EMAIL') {
      throw new Error(
        'cfg.notifyEmail is required for OpsStack (SNS email subscription). Please set it in config/prd.json'
      );
    }
    this.alarmTopic.addSubscription(new subs.EmailSubscription(notifyEmail));

    const appLogGroupName = `/ouma/fe/${cfg.envName}/api`;

    this.appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: appLogGroupName,
      retention:
        cfg.logs?.retentionDays === 14
          ? logs.RetentionDays.TWO_WEEKS
          : logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // バッチ用LogGroupも作成
    const batchLogGroup = new logs.LogGroup(this, 'BatchLogGroup', {
      logGroupName: `/ouma/fe/${cfg.envName}/batch`,
      retention:
        cfg.logs?.retentionDays === 14
          ? logs.RetentionDays.TWO_WEEKS
          : logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
    });
    new cdk.CfnOutput(this, 'AppLogGroupName', {
      value: this.appLogGroup.logGroupName,
    });
    new cdk.CfnOutput(this, 'BatchLogGroupName', {
      value: batchLogGroup.logGroupName,
    });
  }
}

