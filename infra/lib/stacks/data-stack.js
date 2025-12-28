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
exports.DataStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
class DataStack extends cdk.Stack {
    eventsTable;
    usersTable;
    summariesTable;
    cityGeoTable;
    lineSecret;
    // lambdaSgは削除（Lambda関数をVPC外に配置したため不要）
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
exports.DataStack = DataStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLG1FQUFxRDtBQUNyRCwrRUFBaUU7QUFTakUsTUFBYSxTQUFVLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdEIsV0FBVyxDQUFpQjtJQUM1QixVQUFVLENBQWlCO0lBQzNCLGNBQWMsQ0FBaUI7SUFDL0IsWUFBWSxDQUFpQjtJQUM3QixVQUFVLENBQXdCO0lBQ2xELHNDQUFzQztJQUV0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXFCO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsTUFBTSxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXhELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFD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KiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcblxuZXhwb3J0IGludGVyZmFjZSBEYXRhU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgY2ZnOiBhbnk7XG4gIHZwYzogZWMyLklWcGM7XG4gIC8vIGxhbWJkYVNn44Gv5YmK6Zmk77yITGFtYmRh6Zai5pWw44KSVlBD5aSW44Gr6YWN572u44GX44Gf44Gf44KB5LiN6KaB77yJXG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgZXZlbnRzVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlcnNUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBzdW1tYXJpZXNUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBjaXR5R2VvVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgbGluZVNlY3JldDogc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuICAvLyBsYW1iZGFTZ+OBr+WJiumZpO+8iExhbWJkYemWouaVsOOCklZQQ+WkluOBq+mFjee9ruOBl+OBn+OBn+OCgeS4jeimge+8iVxuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBEYXRhU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgY2ZnID0gcHJvcHMuY2ZnO1xuICAgIGNvbnN0IHByZWZpeCA9IGAke2NmZy5vcmd9LSR7Y2ZnLnNob3J0fS0ke2NmZy5lbnZOYW1lfWA7XG5cbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ09yZycsIGNmZy5vcmcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnU3lzdGVtJywgY2ZnLnN5c3RlbSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnYnLCBjZmcuZW52TmFtZSk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdPd25lcicsICdvdW1hMDYyMycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnTWFuYWdlZEJ5JywgJ2NkaycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29zdENlbnRlcicsICd0cmFpbmluZycpO1xuXG4gICAgLy8gRXZlbnRzIFRhYmxlXG4gICAgdGhpcy5ldmVudHNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnRXZlbnRzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGAke3ByZWZpeH0tZXZlbnRzYCxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZXZlbnRJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIEdTSS0xOiBjaXR5LWRhdGUtaW5kZXhcbiAgICB0aGlzLmV2ZW50c1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ2NpdHktZGF0ZS1pbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3ZlbnVlQ2l0eScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdzdGFydEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vIEdTSS0yOiBwcmVmLWRhdGUtaW5kZXhcbiAgICB0aGlzLmV2ZW50c1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ3ByZWYtZGF0ZS1pbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3ZlbnVlUHJlZicsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdzdGFydEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vIEdTSS0zOiBjYXRlZ29yeS1kYXRlLWluZGV4XG4gICAgdGhpcy5ldmVudHNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdjYXRlZ29yeS1kYXRlLWluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY2F0ZWdvcnknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnc3RhcnRBdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgfSk7XG5cbiAgICAvLyBVc2VycyBUYWJsZVxuICAgIHRoaXMudXNlcnNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnVXNlcnNUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogYCR7cHJlZml4fS11c2Vyc2AsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gR1NJLTE6IGxpbmUtdXNlci1pbmRleFxuICAgIHRoaXMudXNlcnNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdsaW5lLXVzZXItaW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdsaW5lVXNlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vIEdTSS0yOiBub3RpZnktZW5hYmxlZC1pbmRleFxuICAgIHRoaXMudXNlcnNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdub3RpZnktZW5hYmxlZC1pbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ25vdGlmeUVuYWJsZWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAndXNlcklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vIFN1bW1hcmllcyBUYWJsZVxuICAgIHRoaXMuc3VtbWFyaWVzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1N1bW1hcmllc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBgJHtwcmVmaXh9LXN1bW1hcmllc2AsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2V2ZW50SWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICB9KTtcblxuICAgIC8vIENpdHlHZW8gVGFibGVcbiAgICB0aGlzLmNpdHlHZW9UYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQ2l0eUdlb1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBgJHtwcmVmaXh9LWNpdHlnZW9gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdjaXR5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3ByZWYnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICB9KTtcblxuICAgIC8vIExJTkUgU2VjcmV0XG4gICAgdGhpcy5saW5lU2VjcmV0ID0gbmV3IHNlY3JldHNtYW5hZ2VyLlNlY3JldCh0aGlzLCAnTGluZVNlY3JldCcsIHtcbiAgICAgIHNlY3JldE5hbWU6IGAke3ByZWZpeH0vbGluZWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0xJTkUgYXV0aGVudGljYXRpb24gY3JlZGVudGlhbHMnLFxuICAgICAgZ2VuZXJhdGVTZWNyZXRTdHJpbmc6IHtcbiAgICAgICAgc2VjcmV0U3RyaW5nVGVtcGxhdGU6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBjaGFubmVsQWNjZXNzVG9rZW46ICdQTEFDRUhPTERFUicsXG4gICAgICAgICAgY2hhbm5lbFNlY3JldDogJ1BMQUNFSE9MREVSJyxcbiAgICAgICAgICBsaW5lTG9naW5DaGFubmVsSWQ6ICdQTEFDRUhPTERFUicsXG4gICAgICAgICAgbGluZUxvZ2luQ2hhbm5lbFNlY3JldDogJ1BMQUNFSE9MREVSJyxcbiAgICAgICAgfSksXG4gICAgICAgIGdlbmVyYXRlU3RyaW5nS2V5OiAnZHVtbXknLFxuICAgICAgICBleGNsdWRlQ2hhcmFjdGVyczogJycsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFdmVudHNUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5ldmVudHNUYWJsZS50YWJsZU5hbWUsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJzVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1N1bW1hcmllc1RhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnN1bW1hcmllc1RhYmxlLnRhYmxlTmFtZSxcbiAgICB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2l0eUdlb1RhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmNpdHlHZW9UYWJsZS50YWJsZU5hbWUsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xpbmVTZWNyZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMubGluZVNlY3JldC5zZWNyZXROYW1lLFxuICAgIH0pO1xuICB9XG59XG5cbiJdfQ==