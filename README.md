# Simple Task Manager - AWS serverless backend
This is the backend part of the simple task manager application.
At present, the task manager allows you to create a new task (name, description) and give it a priority, a status, a due date and assigned the task to another user.
This project implements a CRUD API for managing tasks using AWS services (API Gateway, Lambda, DynamoDB and Cognito) and is deployed using AWS CDK.

This is a silly app that just demonstrates how to develop AWS cloud native applications and is not meant to be
commercially used by any means. It shows how easy a serverless applications can be developed that is deployed
and ready to be used by any frontend.
Also, it can serve as a good starting base to develop new applications. And of course it could have been developed
differently.

Demo Link: https://d1b07mtd9j77x2.cloudfront.net (uptime not ensured)

### **Technology Stack**
- **Backend**: (This repo) [Task Manager Backend](https://github.com/nufki/task-manager-backend).
- **Angular web frontend**: [Angular Frontend](https://github.com/nufki/task-manager-frontend) (version 18.2). 
- **Flutter app**: [Flutter App](https://github.com/nufki/task_manager_app)


## **Getting Started**
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


## Note regarding bootstrapping 
Bootstrapping is the process of setting up resources (like S3 buckets and IAM roles) in your AWS account that the AWS CDK requires to deploy your stacks. These resources are typically created ONCE PER ACCOUNT AND REGION!.
When deploying a stack, the CDK uses the deploy-role (cdk-hnb659fds-deploy-role) to execute deployment actions. If the environment isn't bootstrapped, the required resources won't exist, leading to the error you see.
````
cdk bootstrap aws://YOUR-ACCOUNT-ID/eu-west-1`
````

## Available REST API Endpoints

- POST /tasks: Create a new task
- GET /tasks: List all tasks
- GET /tasks/{id}: Get a specific task
- PUT /tasks/{id}: Update a task
- DELETE /tasks/{id}: Delete a task
- GET /users: Get the list of available users (queries AWS Cognito for this and returns a list of usernames)



## **Contributing**

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add a meaningful commit message"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.


