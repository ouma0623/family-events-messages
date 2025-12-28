import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface NetworkStackProps extends cdk.StackProps {
  cfg: any;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly endpointSg: ec2.SecurityGroup;
  public readonly lambdaSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const cfg = props.cfg;
    const prefix = `${cfg.org}-${cfg.short}-${cfg.envName}`;

    cdk.Tags.of(this).add('Org', cfg.org);
    cdk.Tags.of(this).add('System', cfg.system);
    cdk.Tags.of(this).add('Env', cfg.envName);
    cdk.Tags.of(this).add('Owner', 'ouma0623');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
    cdk.Tags.of(this).add('CostCenter', 'training');

    // VPC（既存VPCを活用する場合は、既存VPCを参照するように変更）
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-vpc`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Endpoint Security Group
    this.endpointSg = new ec2.SecurityGroup(this, 'EndpointSg', {
      vpc: this.vpc,
      allowAllOutbound: true,
      securityGroupName: `${prefix}-endpoint-sg`,
    });

    // Lambda Security Group（コスト削減のため、Lambda関数はVPC外に配置するため使用しないが、将来の拡張のために残す）
    // 説明を変更しない（既存リソースとの競合を避けるため）
    this.lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      allowAllOutbound: true,
      securityGroupName: `${prefix}-lambda-sg`,
      description: 'SecurityGroup for Lambda functions',
    });

    // コスト削減のため、VPC Interface EndpointsとGateway Endpointsを削除
    // Lambda関数はVPC外に配置し、インターネット経由でAWSサービスにアクセスする
    // これにより、月額約13,000円のコスト削減が可能
    //
    // 削除したエンドポイント:
    // - VPC Interface Endpoints (SSM, EC2_MESSAGES, SSM_MESSAGES, CLOUDWATCH_LOGS, SECRETS_MANAGER, KMS)
    // - VPC Gateway Endpoints (DynamoDB, S3)

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'EndpointSgId', {
      value: this.endpointSg.securityGroupId,
    });
    new cdk.CfnOutput(this, 'LambdaSgId', { value: this.lambdaSg.securityGroupId });
  }
}

