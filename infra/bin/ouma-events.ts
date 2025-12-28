#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';

import { NetworkStack } from '../lib/stacks/network-stack';
import { DataStack } from '../lib/stacks/data-stack';
import { OpsStack } from '../lib/stacks/ops-stack';
import { AppStack } from '../lib/stacks/app-stack';

function loadConfig(path: string) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

const app = new cdk.App();

const envName = (app.node.tryGetContext('env') as string) ?? 'dev';
const cfg = loadConfig(`config/${envName}.json`);

const env = { account: cfg.account, region: cfg.region };

const network = new NetworkStack(app, `ouma-fe-${cfg.envName}-network`, {
  env,
  cfg,
});

const data = new DataStack(app, `ouma-fe-${cfg.envName}-data`, {
  env,
  cfg,
  vpc: network.vpc,
  // lambdaSgは削除（Lambda関数をVPC外に配置したため不要）
});

const ops = new OpsStack(app, `ouma-fe-${cfg.envName}-ops`, {
  env,
  cfg,
});

new AppStack(app, `ouma-fe-${cfg.envName}-app`, {
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

