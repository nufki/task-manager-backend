import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TaskManagerBackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // DynamoDB Table
        const taskTable = new dynamodb.Table(this, 'TaskTable', {
            partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });


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

        // Output the User Pool ID and Client ID
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            description: 'The ID of the Cognito User Pool',
        });

        // Output the User Pool Client ID
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId,
            description: 'Client ID for Cognito User Pool (for frontend integration)',
        });


        /******************************************************
        /* Add Task API
        /******************************************************/

        // Create Task Manager lambda function
        const taskFunction = new NodejsFunction(this, 'TaskFunction', {
                entry: 'lambdas/task-manager/index.ts',
                handler: 'handler',
                runtime: lambda.Runtime.NODEJS_18_X,
                environment: {
                    TABLE_NAME: taskTable.tableName,
                },
            });
        taskTable.grantReadWriteData(taskFunction);

        // API Gateway
        const taskAPI = new apigateway.RestApi(this, 'TaskApi', {
            restApiName: 'Task Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
            },
        });

        const taskAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TaskApiAuthorizer', {
            cognitoUserPools: [userPool],
        });

        // Define the /tasks resource
        const tasks = taskAPI.root.addResource('tasks');
        const singleTask = tasks.addResource('{id}');

        // Protect endpoints with Cognito Authorizer
        tasks.addMethod('POST', new apigateway.LambdaIntegration(taskFunction), {
            authorizer: taskAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });

        tasks.addMethod('GET', new apigateway.LambdaIntegration(taskFunction), {
            authorizer: taskAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });

        singleTask.addMethod('GET', new apigateway.LambdaIntegration(taskFunction), {
            authorizer: taskAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });

        singleTask.addMethod('PUT', new apigateway.LambdaIntegration(taskFunction), {
            authorizer: taskAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });

        singleTask.addMethod('DELETE', new apigateway.LambdaIntegration(taskFunction), {
            authorizer: taskAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });



       /******************************************************
       /* dd ListUsers API resources:
       /******************************************************/

        // Create List user lambda function
        const listUserFunction = new NodejsFunction(this, 'ListUsersLambda', {
                entry: 'lambdas/list-users/index.ts',
                handler: 'handler',
                runtime: lambda.Runtime.NODEJS_18_X,
                environment: {
                    USER_POOL_ID: userPool.userPoolId,
                },
            });

        // Grant permissions to the Lambda function
        listUserFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['cognito-idp:ListUsers'],
                resources: ['*'], // Consider scoping to your User Pool ARN
            })
        );

        // Define API Gateway
        const userAPI = new apigateway.RestApi(this, 'ListUsersApi', {
            restApiName: 'User Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
            },
        });


        const userAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'UserApiAuthorizer', {
            cognitoUserPools: [userPool],
        });

        // Define the /users resource
        const users = userAPI.root.addResource('users');

        // List User APIs
        users.addMethod('GET', new apigateway.LambdaIntegration(listUserFunction), {
            authorizer: userAuthorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
    }
}
