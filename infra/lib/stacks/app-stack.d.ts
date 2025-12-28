import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
export interface AppStackProps extends cdk.StackProps {
    cfg: any;
    vpc: ec2.IVpc;
    eventsTable: dynamodb.ITable;
    usersTable: dynamodb.ITable;
    summariesTable: dynamodb.ITable;
    cityGeoTable: dynamodb.ITable;
    lineSecret: secretsmanager.ISecret;
    alarmTopic: sns.ITopic;
    appLogGroup: logs.ILogGroup;
}
export declare class AppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: AppStackProps);
}
