import * as cdk from "aws-cdk-lib";

import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

import {
  HttpApi,
  CorsHttpMethod,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import { Construct } from "constructs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";

export class LambdaPlaygroundStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new Table(this, "Table", {
      tableName: "LambdaBenchmarkTable",
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const bucket = new Bucket(this, "Bucket", {
      bucketName: "lambda-benchmark-bucket",
    });

    const lambdaFunctionPlayground = new NodejsFunction(
      this,
      "LambdaFunctionPlayground",
      {
        functionName: "lambda-function-playground",
        entry: `${__dirname}/handler.ts`,
        handler: "handler",
        runtime: Runtime.NODEJS_18_X,
        environment: {
          TABLE: table.tableName,
          BUCKET: bucket.bucketName,
          POWERTOOLS_SERVICE_NAME: "lambda-playground",
          POWERTOOLS_TRACE_ENABLED: "true",
          POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: "true",
          POWERTOOLS_TRACER_CAPTURE_RESPONSE: "true",
          POWERTOOLS_TRACER_CAPTURE_ERROR: "true",
        },
        tracing: Tracing.ACTIVE,
        bundling: {
          minify: true,
        },
        timeout: cdk.Duration.seconds(30),
      }
    );

    lambdaFunctionPlayground.addToRolePolicy(
      new PolicyStatement({
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        effect: Effect.ALLOW,
        resources: ["*"],
      })
    );

    table.grantReadWriteData(lambdaFunctionPlayground);
    bucket.grantReadWrite(lambdaFunctionPlayground);

    // API GATEWAY

    const restApi = new RestApi(this, "RestApi", {
      restApiName: "lambda-playground-rest-api",
    });

    restApi.root
      .resourceForPath("/playground")
      .addMethod("GET", new LambdaIntegration(lambdaFunctionPlayground));

    const httpApi = new HttpApi(this, "HttpApi", {
      apiName: "lambda-playground-http-api",
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
        maxAge: cdk.Duration.seconds(30),
      },
    });

    httpApi.addRoutes({
      path: "/playground",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetPlayground",
        lambdaFunctionPlayground
      ),
    });
  }
}
