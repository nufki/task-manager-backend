# Task manager backend
This is the backend part of the simple task manager application.
At present, the task manager allows you to create a new task (name, description) and give it a priority, a status, a due date and assigned it to another user to process
This project implements a CRUD API for managing tasks using AWS services (API Gateway, Lambda, DynamoDB and Cognito) and is deployed using AWS CDK.
The matching corresponding angular frontend for this task manager is available here:
https://github.com/nufki/task-manager-frontend

## Notes from my end
This is a silly app that just demonstrates how to develop AWS cloud native applications and is not meant to be
commercially used by any means. It shows how easy a serverless applications can be developed that is deployed 
and ready to be used by any frontend.
Also, it can serve as a good starting base to develop new applications

## Deployment
This project is automatically deployed using GitHub Actions when changes are pushed to the main branch. 
To deploy manually:

1. Install dependencies: `npm install`
2. Boostrap account (if not yet done for specific region)
3. Deploy the stack: `cdk deploy`
4. Once deployed, note the corresponding UserPoolClientId and the UserPoolId from the CDK Output:
   e.g.
   ````
   TaskManagerBackendStack.UserPoolClientId = 59mptj1rmhu4ehn08lohimm9ju
   TaskManagerBackendStack.UserPoolId = eu-west-1_ahTG77Ib9
   ````
5. Open the frontend application setting (environment variables and paste them accordingly)


## Note regarding bootstrapping: 
````
Bootstrapping is the process of setting up resources (like S3 buckets and IAM roles) in your AWS account that the AWS CDK requires to deploy your stacks. These resources are typically created ONCE PER ACCOUNT AND REGION!.
When deploying a stack, the CDK uses the deploy-role (cdk-hnb659fds-deploy-role) to execute deployment actions. If the environment isn't bootstrapped, the required resources won't exist, leading to the error you see.

`cdk bootstrap aws://YOUR-ACCOUNT-ID/eu-west-1`
````

## Available REST API Endpoints

- POST /tasks: Create a new task
- GET /tasks: List all tasks
- GET /tasks/{id}: Get a specific task
- PUT /tasks/{id}: Update a task
- DELETE /tasks/{id}: Delete a task
- GET /users: Get the list of available users (queries AWS Cognito for this and returns a list of usernames)

## Development

To run tests: `npm test`



# This project was created through:
`cdk init app --language=typescript`

More documentation on CDK:
https://www.npmjs.com/package/aws-cdk


This is a blank project for CDK development with TypeScript.
[README.md](../../rch/task-manager-backend/README.md)
The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template