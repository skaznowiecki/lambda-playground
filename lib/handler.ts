import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

import middy from "@middy/core";
import { Tracer, captureLambdaHandler } from "@aws-lambda-powertools/tracer";

import { getItem, getObject, putItem, putObject, scanItems } from "./lib";

const tracer = new Tracer();

tracer.captureAWSv3Client(new DynamoDBClient({}));
tracer.captureAWSv3Client(new S3Client({}));

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  await putItem();

  const items = await getItem();

  await getObject();

  await putObject();

  // const random = Math.floor(Math.random() * 10) + 1;

  // if (random > 5) {
  //   throw new Error("Random error");
  // }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": `max-age=10`,
    },
    body: JSON.stringify({
      items,
    }),
  };
};

export const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));
