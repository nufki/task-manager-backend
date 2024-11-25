# Welcome to your CDK TypeScript project

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

# Howto deploy

## Bootstrap the account (initial setup)
````
Bootstrapping is the process of setting up resources (like S3 buckets and IAM roles) in your AWS account that the AWS CDK requires to deploy your stacks. These resources are typically created once per account and region.
When deploying a stack, the CDK uses the deploy-role (cdk-hnb659fds-deploy-role) to execute deployment actions. If the environment isn't bootstrapped, the required resources won't exist, leading to the error you see.
`npx cdk bootstrap aws://YOUR-ACCOUNT-ID/eu-west-1`
````

## Run<<
`npx cdk deploy`

# Task API
This project implements a CRUD API for managing tasks using AWS services (API Gateway, Lambda, and DynamoDB) and is deployed using AWS CDK.

## Project Structure

- `cdk/`: Contains the CDK infrastructure code
- `lambda/`: Contains the Lambda function code
- `.github/workflows/`: Contains the GitHub Actions workflow for CI/CD

## Deployment

This project is automatically deployed using GitHub Actions when changes are pushed to the main branch. To deploy manually:

1. Install dependencies: `cd cdk && npm install`
2. Deploy the stack: `npm run cdk deploy`

## API Endpoints

- POST /tasks: Create a new task
- GET /tasks: List all tasks
- GET /tasks/{id}: Get a specific task
- PUT /tasks/{id}: Update a task
- DELETE /tasks/{id}: Delete a task

## Development

To run tests: `cd cdk && npm test`