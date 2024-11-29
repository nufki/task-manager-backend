const { DynamoDBClient, PutItemCommand, ScanCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = process.env.TABLE_NAME;

// Initialize the DynamoDB client
const dynamodbClient = new DynamoDBClient();

//CORS headers to include in each response
const headers = {
    "Access-Control-Allow-Origin": "*", // Consider restricting this to your frontend URL in production
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

exports.handler = async (event) => {
    console.log("Request event:", event);

    // Extract user claims from Cognito authorizer
    const claims = event.requestContext.authorizer.claims;
    const userId = claims.sub; // Cognito User ID
    const userEmail = claims.email;

    console.log(`Authenticated user: ${userId}, Email: ${userEmail}`);

    const { httpMethod, resource, pathParameters } = event;

    let response;
    switch (httpMethod) {
        case 'POST':
            response = await createTask(JSON.parse(event.body), userId);
            break;
        case 'GET':
            response = resource === '/tasks/{id}' ? await getTask(pathParameters.id, userId) : await getAllTasks(userId);
            break;
        case 'PUT':
            response = await updateTask(pathParameters.id, JSON.parse(event.body), userId);
            break;
        case 'DELETE':
            response = await deleteTask(pathParameters.id, userId);
            break;
        default:
            response = { statusCode: 400, body: 'Unsupported HTTP method' };
            break;
    }

    // Add CORS headers to the response
    return {
        ...response,
        headers,
    }
};

async function createTask(task, userId) {
    task.id = task.id || uuidv4();
    task.userId = userId; // Associate task with the authenticated user

    const params = {
        TableName: TABLE_NAME,
        Item: marshall(task),
    };
    await dynamodbClient.send(new PutItemCommand(params));
    return {
        statusCode: 201,
        body: JSON.stringify(task),
    };
}

async function getAllTasks(userId) {
    const params = { TableName: TABLE_NAME };
    const result = await dynamodbClient.send(new ScanCommand(params));
    const items = result.Items.map(unmarshall);

    // Filter tasks by userId
    const userTasks = items.filter(item => item.userId === userId);
    return {
        statusCode: 200,
        body: JSON.stringify(userTasks),
    };
}

async function getTask(id, userId) {
    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
    };
    const result = await dynamodbClient.send(new GetItemCommand(params));
    const item = result.Item ? unmarshall(result.Item) : null;

    // Ensure the task belongs to the authenticated user
    if (item && item.userId === userId) {
        return {
            statusCode: 200,
            body: JSON.stringify(item),
        };
    } else {
        return {
            statusCode: 404,
            body: 'Task not found or access denied',
        };
    }
}

async function updateTask(id, task, userId) {
    const existingTask = await getTask(id, userId);
    if (existingTask.statusCode === 404) {
        return existingTask; // Return the 404 response if the task doesn't exist or access is denied
    }

    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
        UpdateExpression: 'set #name = :name, description = :description, #status = :status, priority = :priority, dueDate = :dueDate',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
            ':name': task.name,
            ':description': task.description,
            ':status': task.status,
            ':priority': task.priority,
            ':dueDate': task.dueDate,
        }),
        ReturnValues: 'ALL_NEW',
    };
    const result = await dynamodbClient.send(new UpdateItemCommand(params));
    return {
        statusCode: 200,
        body: JSON.stringify(unmarshall(result.Attributes)),
    };
}

async function deleteTask(id, userId) {
    const existingTask = await getTask(id, userId);
    if (existingTask.statusCode === 404) {
        return existingTask; // Return the 404 response if the task doesn't exist or access is denied
    }

    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
    };
    await dynamodbClient.send(new DeleteItemCommand(params));
    return {
        statusCode: 204,
        body: '',
    };
}
