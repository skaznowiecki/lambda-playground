import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({});

export const putObject = async () => {
  const pk = uuid();

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET!,
    Key: `${pk}.json`,
    Body: JSON.stringify({
      pk,
    }),
  });

  await s3Client.send(putObjectCommand);
};

export const getObject = async () => {
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.BUCKET!,
    Key: "test-object",
  });

  await s3Client.send(getObjectCommand);
};

export const putItem = async () => {
  const putCommand = new PutCommand({
    TableName: process.env.TABLE!,
    Item: {
      pk: uuid(),
      value: uuid(),
    },
  });

  await documentClient.send(putCommand);
};

export const scanItems = async () => {
  const scanCommand = new ScanCommand({
    TableName: process.env.TABLE!,
  });

  const { Items } = await documentClient.send(scanCommand);

  return Items;
};

export const getItem = async () => {
  const scanCommand = new GetCommand({
    TableName: process.env.TABLE!,
    Key: {
      pk: `651cf6dc-c31f-4903-938b-9b8661542b8d`,
    },
  });

  const { Item } = await documentClient.send(scanCommand);

  return Item;
};
