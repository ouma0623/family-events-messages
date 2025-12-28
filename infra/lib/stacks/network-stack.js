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
exports.NetworkStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
class NetworkStack extends cdk.Stack {
    vpc;
    endpointSg;
    lambdaSg;
    constructor(scope, id, props) {
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
exports.NetworkStack = NetworkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29yay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmstc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLHlEQUEyQztBQU0zQyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN6QixHQUFHLENBQVU7SUFDYixVQUFVLENBQW9CO0lBQzlCLFFBQVEsQ0FBb0I7SUFFNUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQ3RCLE1BQU0sTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUV4RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUVoRCxxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUNsQyxPQUFPLEVBQUUsR0FBRyxNQUFNLE1BQU07WUFDeEIsTUFBTSxFQUFFLENBQUM7WUFDVCxXQUFXLEVBQUUsQ0FBQztZQUNkLG1CQUFtQixFQUFFO2dCQUNuQixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUU7Z0JBQ25FO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtvQkFDM0MsUUFBUSxFQUFFLEVBQUU7aUJBQ2I7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzFELEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsaUJBQWlCLEVBQUUsR0FBRyxNQUFNLGNBQWM7U0FDM0MsQ0FBQyxDQUFDO1FBRUgseUVBQXlFO1FBQ3pFLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ3RELEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsaUJBQWlCLEVBQUUsR0FBRyxNQUFNLFlBQVk7WUFDeEMsV0FBVyxFQUFFLG9DQUFvQztTQUNsRCxDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsNkNBQTZDO1FBQzdDLDRCQUE0QjtRQUM1QixFQUFFO1FBQ0YsZUFBZTtRQUNmLHFHQUFxRztRQUNyRyx5Q0FBeUM7UUFFekMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzVELElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3RDLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWU7U0FDdkMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7Q0FDRjtBQS9ERCxvQ0ErREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGNmZzogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHZwYzogZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IGVuZHBvaW50U2c6IGVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhU2c6IGVjMi5TZWN1cml0eUdyb3VwO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBOZXR3b3JrU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgY2ZnID0gcHJvcHMuY2ZnO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke2NmZy5vcmd9LSR7Y2ZnLnNob3J0fS0ke2NmZy5lbnZOYW1lfWA7XG5cbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ09yZycsIGNmZy5vcmcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3lzdGVtJywgY2ZnLnN5c3RlbSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnYnLCBjZmcuZW52TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdPd25lcicsICdvdW1hMDYyMycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ2NkaycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29zdENlbnRlcicsICd0cmFpbmluZycpO1xuXG4gICAgLy8gVlBD77yI5pei5a2YVlBD44KS5rS755So44GZ44KL5aC05ZCI44Gv44CB5pei5a2YVlBD44KS5Y+C54Wn44GZ44KL44KI44GG44Gr5aSJ5pu077yJXG4gICAgdGhpcy52cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnVnBjJywge1xuICAgICAgdnBjTmFtZTogYCR7cHJlZml4fS12cGNgLFxuICAgICAgbWF4QXpzOiAyLFxuICAgICAgbmF0R2F0ZXdheXM6IDAsXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHsgbmFtZTogJ3B1YmxpYycsIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQywgY2lkck1hc2s6IDI0IH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAncHJpdmF0ZScsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCxcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gRW5kcG9pbnQgU2VjdXJpdHkgR3JvdXBcbiAgICB0aGlzLmVuZHBvaW50U2cgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0VuZHBvaW50U2cnLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZSxcbiAgICAgIHNlY3VyaXR5R3JvdXBOYW1lOiBgJHtwcmVmaXh9LWVuZHBvaW50LXNnYCxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBTZWN1cml0eSBHcm91cO+8iOOCs+OCueODiOWJiua4m+OBruOBn+OCgeOAgUxhbWJkYemWouaVsOOBr1ZQQ+WkluOBq+mFjee9ruOBmeOCi+OBn+OCgeS9v+eUqOOBl+OBquOBhOOBjOOAgeWwhuadpeOBruaLoeW8teOBruOBn+OCgeOBq+aui+OBme+8iVxuICAgIC8vIOiqrOaYjuOCkuWkieabtOOBl+OBquOBhO+8iOaXouWtmOODquOCveODvOOCueOBqOOBruertuWQiOOCkumBv+OBkeOCi+OBn+OCge+8iVxuICAgIHRoaXMubGFtYmRhU2cgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0xhbWJkYVNnJywge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICBzZWN1cml0eUdyb3VwTmFtZTogYCR7cHJlZml4fS1sYW1iZGEtc2dgLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eUdyb3VwIGZvciBMYW1iZGEgZnVuY3Rpb25zJyxcbiAgICB9KTtcblxuICAgIC8vIOOCs+OCueODiOWJiua4m+OBruOBn+OCgeOAgVZQQyBJbnRlcmZhY2UgRW5kcG9pbnRz44GoR2F0ZXdheSBFbmRwb2ludHPjgpLliYrpmaRcbiAgICAvLyBMYW1iZGHplqLmlbDjga9WUEPlpJbjgavphY3nva7jgZfjgIHjgqTjg7Pjgr/jg7zjg43jg4Pjg4jntYznlLHjgadBV1PjgrXjg7zjg5PjgrnjgavjgqLjgq/jgrvjgrnjgZnjgotcbiAgICAvLyDjgZPjgozjgavjgojjgorjgIHmnIjpoY3ntIQxMywwMDDlhobjga7jgrPjgrnjg4jliYrmuJvjgYzlj6/og71cbiAgICAvL1xuICAgIC8vIOWJiumZpOOBl+OBn+OCqOODs+ODieODneOCpOODs+ODiDpcbiAgICAvLyAtIFZQQyBJbnRlcmZhY2UgRW5kcG9pbnRzIChTU00sIEVDMl9NRVNTQUdFUywgU1NNX01FU1NBR0VTLCBDTE9VRFdBVENIX0xPR1MsIFNFQ1JFVFNfTUFOQUdFUiwgS01TKVxuICAgIC8vIC0gVlBDIEdhdGV3YXkgRW5kcG9pbnRzIChEeW5hbW9EQiwgUzMpXG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVnBjSWQnLCB7IHZhbHVlOiB0aGlzLnZwYy52cGNJZCB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRW5kcG9pbnRTZ0lkJywge1xuICAgICAgdmFsdWU6IHRoaXMuZW5kcG9pbnRTZy5zZWN1cml0eUdyb3VwSWQsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xhbWJkYVNnSWQnLCB7IHZhbHVlOiB0aGlzLmxhbWJkYVNnLnNlY3VyaXR5R3JvdXBJZCB9KTtcbiAgfVxufVxuXG4iXX0=