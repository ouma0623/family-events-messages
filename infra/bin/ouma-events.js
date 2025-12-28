#!/usr/bin/env node
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
const cdk = __importStar(require("aws-cdk-lib"));
const fs = __importStar(require("fs"));
const network_stack_1 = require("../lib/stacks/network-stack");
const data_stack_1 = require("../lib/stacks/data-stack");
const ops_stack_1 = require("../lib/stacks/ops-stack");
const app_stack_1 = require("../lib/stacks/app-stack");
function loadConfig(path) {
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
}
const app = new cdk.App();
const envName = app.node.tryGetContext('env') ?? 'dev';
const cfg = loadConfig(`config/${envName}.json`);
const env = { account: cfg.account, region: cfg.region };
const network = new network_stack_1.NetworkStack(app, `ouma-fe-${cfg.envName}-network`, {
    env,
    cfg,
});
const data = new data_stack_1.DataStack(app, `ouma-fe-${cfg.envName}-data`, {
    env,
    cfg,
    vpc: network.vpc,
    // lambdaSgは削除（Lambda関数をVPC外に配置したため不要）
});
const ops = new ops_stack_1.OpsStack(app, `ouma-fe-${cfg.envName}-ops`, {
    env,
    cfg,
});
new app_stack_1.AppStack(app, `ouma-fe-${cfg.envName}-app`, {
    env,
    cfg,
    vpc: network.vpc, // EC2インスタンス用にVPCが必要
    eventsTable: data.eventsTable,
    usersTable: data.usersTable,
    summariesTable: data.summariesTable,
    cityGeoTable: data.cityGeoTable,
    lineSecret: data.lineSecret,
    alarmTopic: ops.alarmTopic,
    appLogGroup: ops.appLogGroup,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3VtYS1ldmVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvdW1hLWV2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpREFBbUM7QUFDbkMsdUNBQXlCO0FBRXpCLCtEQUEyRDtBQUMzRCx5REFBcUQ7QUFDckQsdURBQW1EO0FBQ25ELHVEQUFtRDtBQUVuRCxTQUFTLFVBQVUsQ0FBQyxJQUFZO0lBQzlCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFNLE9BQU8sR0FBSSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQVksSUFBSSxLQUFLLENBQUM7QUFDbkUsTUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLFVBQVUsT0FBTyxPQUFPLENBQUMsQ0FBQztBQUVqRCxNQUFNLEdBQUcsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFekQsTUFBTSxPQUFPLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxXQUFXLEdBQUcsQ0FBQyxPQUFPLFVBQVUsRUFBRTtJQUN0RSxHQUFHO0lBQ0gsR0FBRztDQUNKLENBQUMsQ0FBQztBQUVILE1BQU0sSUFBSSxHQUFHLElBQUksc0JBQVMsQ0FBQyxHQUFHLEVBQUUsV0FBVyxHQUFHLENBQUMsT0FBTyxPQUFPLEVBQUU7SUFDN0QsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7SUFDaEIsc0NBQXNDO0NBQ3ZDLENBQUMsQ0FBQztBQUVILE1BQU0sR0FBRyxHQUFHLElBQUksb0JBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxHQUFHLENBQUMsT0FBTyxNQUFNLEVBQUU7SUFDMUQsR0FBRztJQUNILEdBQUc7Q0FDSixDQUFDLENBQUM7QUFFSCxJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLFdBQVcsR0FBRyxDQUFDLE9BQU8sTUFBTSxFQUFFO0lBQzlDLEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsb0JBQW9CO0lBRXRDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztJQUM3QixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7SUFDM0IsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO0lBQ25DLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtJQUMvQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7SUFFM0IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVO0lBQzFCLFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVztDQUM3QixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgeyBOZXR3b3JrU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL25ldHdvcmstc3RhY2snO1xuaW1wb3J0IHsgRGF0YVN0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9kYXRhLXN0YWNrJztcbmltcG9ydCB7IE9wc1N0YWNrIH0gZnJvbSAnLi4vbGliL3N0YWNrcy9vcHMtc3RhY2snO1xuaW1wb3J0IHsgQXBwU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2FwcC1zdGFjayc7XG5cbmZ1bmN0aW9uIGxvYWRDb25maWcocGF0aDogc3RyaW5nKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoLCAndXRmLTgnKSk7XG59XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IGVudk5hbWUgPSAoYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52JykgYXMgc3RyaW5nKSA/PyAnZGV2JztcbmNvbnN0IGNmZyA9IGxvYWRDb25maWcoYGNvbmZpZy8ke2Vudk5hbWV9Lmpzb25gKTtcblxuY29uc3QgZW52ID0geyBhY2NvdW50OiBjZmcuYWNjb3VudCwgcmVnaW9uOiBjZmcucmVnaW9uIH07XG5cbmNvbnN0IG5ldHdvcmsgPSBuZXcgTmV0d29ya1N0YWNrKGFwcCwgYG91bWEtZmUtJHtjZmcuZW52TmFtZX0tbmV0d29ya2AsIHtcbiAgZW52LFxuICBjZmcsXG59KTtcblxuY29uc3QgZGF0YSA9IG5ldyBEYXRhU3RhY2soYXBwLCBgb3VtYS1mZS0ke2NmZy5lbnZOYW1lfS1kYXRhYCwge1xuICBlbnYsXG4gIGNmZyxcbiAgdnBjOiBuZXR3b3JrLnZwYyxcbiAgLy8gbGFtYmRhU2fjga/liYrpmaTvvIhMYW1iZGHplqLmlbDjgpJWUEPlpJbjgavphY3nva7jgZfjgZ/jgZ/jgoHkuI3opoHvvIlcbn0pO1xuXG5jb25zdCBvcHMgPSBuZXcgT3BzU3RhY2soYXBwLCBgb3VtYS1mZS0ke2NmZy5lbnZOYW1lfS1vcHNgLCB7XG4gIGVudixcbiAgY2ZnLFxufSk7XG5cbm5ldyBBcHBTdGFjayhhcHAsIGBvdW1hLWZlLSR7Y2ZnLmVudk5hbWV9LWFwcGAsIHtcbiAgZW52LFxuICBjZmcsXG4gIHZwYzogbmV0d29yay52cGMsIC8vIEVDMuOCpOODs+OCueOCv+ODs+OCueeUqOOBq1ZQQ+OBjOW/heimgVxuXG4gIGV2ZW50c1RhYmxlOiBkYXRhLmV2ZW50c1RhYmxlLFxuICB1c2Vyc1RhYmxlOiBkYXRhLnVzZXJzVGFibGUsXG4gIHN1bW1hcmllc1RhYmxlOiBkYXRhLnN1bW1hcmllc1RhYmxlLFxuICBjaXR5R2VvVGFibGU6IGRhdGEuY2l0eUdlb1RhYmxlLFxuICBsaW5lU2VjcmV0OiBkYXRhLmxpbmVTZWNyZXQsXG5cbiAgYWxhcm1Ub3BpYzogb3BzLmFsYXJtVG9waWMsXG4gIGFwcExvZ0dyb3VwOiBvcHMuYXBwTG9nR3JvdXAsXG59KTtcblxuIl19