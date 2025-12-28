import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
export interface OpsStackProps extends cdk.StackProps {
    cfg: any;
}
export declare class OpsStack extends cdk.Stack {
    readonly alarmTopic: sns.Topic;
    readonly appLogGroup: logs.LogGroup;
    constructor(scope: Construct, id: string, props: OpsStackProps);
}
