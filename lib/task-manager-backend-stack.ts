import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class TaskManagerBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const taskTable = new dynamodb.Table(this, 'TaskTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create Task Manager Lambda
    const taskFunction = new NodejsFunction(this, 'TaskFunction', {
      entry: 'lambdas/task-manager/index.ts', // Path to your Lambda function code
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: taskTable.tableName,
      },
    });

    taskTable.grantReadWriteData(taskFunction);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'TaskManagerUserPool', {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email in my app!',
        emailBody: 'Thanks for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: {
        email: true,
        username: true
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'TaskManagerUserPoolClient', {
      userPool,
      generateSecret: false,
    });

    // Output the User Pool Client ID
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Client ID for Cognito User Pool (for frontend integration)',
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TaskApi', {
      restApiName: 'Task Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TaskApiAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const tasks = api.root.addResource('tasks');
    const singleTask = tasks.addResource('{id}');

    // Protect endpoints with Cognito Authorizer
    tasks.addMethod('POST', new apigateway.LambdaIntegration(taskFunction), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    tasks.addMethod('GET', new apigateway.LambdaIntegration(taskFunction), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    singleTask.addMethod('GET', new apigateway.LambdaIntegration(taskFunction), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    singleTask.addMethod('PUT', new apigateway.LambdaIntegration(taskFunction), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    singleTask.addMethod('DELETE', new apigateway.LambdaIntegration(taskFunction), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
  }
}
