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
exports.OpsStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const subs = __importStar(require("aws-cdk-lib/aws-sns-subscriptions"));
class OpsStack extends cdk.Stack {
    alarmTopic;
    appLogGroup;
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
        this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
            topicName: `${prefix}-alarm`,
        });
        const notifyEmail = cfg.notifyEmail ?? '';
        if (!notifyEmail || notifyEmail === 'PLACEHOLDER_REPLACE_WITH_ACTUAL_EMAIL') {
            throw new Error('cfg.notifyEmail is required for OpsStack (SNS email subscription). Please set it in config/prd.json');
        }
        this.alarmTopic.addSubscription(new subs.EmailSubscription(notifyEmail));
        const appLogGroupName = `/ouma/fe/${cfg.envName}/api`;
        this.appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
            logGroupName: appLogGroupName,
            retention: cfg.logs?.retentionDays === 14
                ? logs.RetentionDays.TWO_WEEKS
                : logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // バッチ用LogGroupも作成
        const batchLogGroup = new logs.LogGroup(this, 'BatchLogGroup', {
            logGroupName: `/ouma/fe/${cfg.envName}/batch`,
            retention: cfg.logs?.retentionDays === 14
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
exports.OpsStack = OpsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib3BzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQywyREFBNkM7QUFDN0MseURBQTJDO0FBQzNDLHdFQUEwRDtBQU0xRCxNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyQixVQUFVLENBQVk7SUFDdEIsV0FBVyxDQUFnQjtJQUUzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW9CO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsTUFBTSxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXhELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsU0FBUyxFQUFFLEdBQUcsTUFBTSxRQUFRO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFJLEdBQUcsQ0FBQyxXQUFzQixJQUFJLEVBQUUsQ0FBQztRQUN0RCxJQUFJLENBQUMsV0FBVyxJQUFJLFdBQVcsS0FBSyx1Q0FBdUMsRUFBRSxDQUFDO1lBQzVFLE1BQU0sSUFBSSxLQUFLLENBQ2IscUdBQXFHLENBQ3RHLENBQUM7UUFDSixDQUFDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUV6RSxNQUFNLGVBQWUsR0FBRyxZQUFZLEdBQUcsQ0FBQyxPQUFPLE1BQU0sQ0FBQztRQUV0RCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3hELFlBQVksRUFBRSxlQUFlO1lBQzdCLFNBQVMsRUFDUCxHQUFHLENBQUMsSUFBSSxFQUFFLGFBQWEsS0FBSyxFQUFFO2dCQUM1QixDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTO2dCQUM5QixDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRO1lBQ2pDLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sYUFBYSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzdELFlBQVksRUFBRSxZQUFZLEdBQUcsQ0FBQyxPQUFPLFFBQVE7WUFDN0MsU0FBUyxFQUNQLEdBQUcsQ0FBQyxJQUFJLEVBQUUsYUFBYSxLQUFLLEVBQUU7Z0JBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVM7Z0JBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDakMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRO1NBQ2hDLENBQUMsQ0FBQztRQUNILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWTtTQUNyQyxDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxhQUFhLENBQUMsWUFBWTtTQUNsQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1REQsNEJBNERDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgKiBhcyBzdWJzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9ucyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BzU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgY2ZnOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBPcHNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybVRvcGljOiBzbnMuVG9waWM7XG4gIHB1YmxpYyByZWFkb25seSBhcHBMb2dHcm91cDogbG9ncy5Mb2dHcm91cDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogT3BzU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgY2ZnID0gcHJvcHMuY2ZnO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke2NmZy5vcmd9LSR7Y2ZnLnNob3J0fS0ke2NmZy5lbnZOYW1lfWA7XG5cbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ09yZycsIGNmZy5vcmcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3lzdGVtJywgY2ZnLnN5c3RlbSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnYnLCBjZmcuZW52TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdPd25lcicsICdvdW1hMDYyMycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ2NkaycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29zdENlbnRlcicsICd0cmFpbmluZycpO1xuXG4gICAgdGhpcy5hbGFybVRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxhcm1Ub3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogYCR7cHJlZml4fS1hbGFybWAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBub3RpZnlFbWFpbCA9IChjZmcubm90aWZ5RW1haWwgYXMgc3RyaW5nKSA/PyAnJztcbiAgICBpZiAoIW5vdGlmeUVtYWlsIHx8IG5vdGlmeUVtYWlsID09PSAnUExBQ0VIT0xERVJfUkVQTEFDRV9XSVRIX0FDVFVBTF9FTUFJTCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ2NmZy5ub3RpZnlFbWFpbCBpcyByZXF1aXJlZCBmb3IgT3BzU3RhY2sgKFNOUyBlbWFpbCBzdWJzY3JpcHRpb24pLiBQbGVhc2Ugc2V0IGl0IGluIGNvbmZpZy9wcmQuanNvbidcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuYWxhcm1Ub3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnMuRW1haWxTdWJzY3JpcHRpb24obm90aWZ5RW1haWwpKTtcblxuICAgIGNvbnN0IGFwcExvZ0dyb3VwTmFtZSA9IGAvb3VtYS9mZS8ke2NmZy5lbnZOYW1lfS9hcGlgO1xuXG4gICAgdGhpcy5hcHBMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdBcHBMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogYXBwTG9nR3JvdXBOYW1lLFxuICAgICAgcmV0ZW50aW9uOlxuICAgICAgICBjZmcubG9ncz8ucmV0ZW50aW9uRGF5cyA9PT0gMTRcbiAgICAgICAgICA/IGxvZ3MuUmV0ZW50aW9uRGF5cy5UV09fV0VFS1NcbiAgICAgICAgICA6IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyDjg5Djg4Pjg4HnlKhMb2dHcm91cOOCguS9nOaIkFxuICAgIGNvbnN0IGJhdGNoTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQmF0Y2hMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogYC9vdW1hL2ZlLyR7Y2ZnLmVudk5hbWV9L2JhdGNoYCxcbiAgICAgIHJldGVudGlvbjpcbiAgICAgICAgY2ZnLmxvZ3M/LnJldGVudGlvbkRheXMgPT09IDE0XG4gICAgICAgICAgPyBsb2dzLlJldGVudGlvbkRheXMuVFdPX1dFRUtTXG4gICAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsYXJtVG9waWNBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hbGFybVRvcGljLnRvcGljQXJuLFxuICAgIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcHBMb2dHcm91cE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hcHBMb2dHcm91cC5sb2dHcm91cE5hbWUsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0JhdGNoTG9nR3JvdXBOYW1lJywge1xuICAgICAgdmFsdWU6IGJhdGNoTG9nR3JvdXAubG9nR3JvdXBOYW1lLFxuICAgIH0pO1xuICB9XG59XG5cbiJdfQ==