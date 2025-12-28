import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
export interface NetworkStackProps extends cdk.StackProps {
    cfg: any;
}
export declare class NetworkStack extends cdk.Stack {
    readonly vpc: ec2.Vpc;
    readonly endpointSg: ec2.SecurityGroup;
    readonly lambdaSg: ec2.SecurityGroup;
    constructor(scope: Construct, id: string, props: NetworkStackProps);
}
