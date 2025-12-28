import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
export interface DataStackProps extends cdk.StackProps {
    cfg: any;
    vpc: ec2.IVpc;
}
export declare class DataStack extends cdk.Stack {
    readonly eventsTable: dynamodb.Table;
    readonly usersTable: dynamodb.Table;
    readonly summariesTable: dynamodb.Table;
    readonly cityGeoTable: dynamodb.Table;
    readonly lineSecret: secretsmanager.Secret;
    constructor(scope: Construct, id: string, props: DataStackProps);
}
