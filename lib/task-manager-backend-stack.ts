import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export class TaskManagerBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const taskTable = new dynamodb.Table(this, 'TaskTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create Lambda function
    const taskFunction = new lambda.Function(this, 'TaskFunction', {
      runtime: lambda.Runtime.NODEJS_18_X, // Ensure a supported runtime
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')), // Deploy only the lambda folder
      environment: {
        TABLE_NAME: taskTable.tableName,
      },
    });

    // Grant Lambda function read/write permissions to DynamoDB table
    taskTable.grantReadWriteData(taskFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'TaskApi', {
      restApiName: 'Task Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allows requests from any origin
        allowMethods: apigateway.Cors.ALL_METHODS, // Allows all HTTP methods
        allowHeaders: ['Content-Type', 'Authorization'], // Specifies allowed headers
      },
    });

    const tasks = api.root.addResource('tasks');
    const singleTask = tasks.addResource('{id}');

    // POST /tasks
    tasks.addMethod('POST', new apigateway.LambdaIntegration(taskFunction));

    // GET /tasks
    tasks.addMethod('GET', new apigateway.LambdaIntegration(taskFunction));

    // GET /tasks/{id}
    singleTask.addMethod('GET', new apigateway.LambdaIntegration(taskFunction));

    // PUT /tasks/{id}
    singleTask.addMethod('PUT', new apigateway.LambdaIntegration(taskFunction));

    // DELETE /tasks/{id}
    singleTask.addMethod('DELETE', new apigateway.LambdaIntegration(taskFunction));
  }
}