#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LambdaPlaygroundStack } from "../lib/lambda-playground-stack";

const app = new cdk.App();
new LambdaPlaygroundStack(app, "LambdaPlaygroundStack", {
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION,
  },
});
