const { DynamoDBClient, PutItemCommand, ScanCommand, GetItemCommand, UpdateItemCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = process.env.TABLE_NAME;

// Initialize the DynamoDB client
const dynamodbClient = new DynamoDBClient();


// CORS headers to include in each response
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

exports.handler = async (event) => {
    const { httpMethod, resource, pathParameters } = event;

    let response;
    switch (httpMethod) {
        case 'POST':
            response = await createTask(JSON.parse(event.body));
            break;
        case 'GET':
            response = resource === '/tasks/{id}' ? await getTask(pathParameters.id) : await getAllTasks();
            break;
        case 'PUT':
            response = await updateTask(pathParameters.id, JSON.parse(event.body));
            break;
        case 'DELETE':
            response = await deleteTask(pathParameters.id);
            break;
        default:
            response = { statusCode: 400, body: 'Unsupported HTTP method' };
            break;
    }

    // Add CORS headers to the response
    return {
        ...response,
        headers,
    };
};

async function createTask(task) {
    if (!task.id) {
        task.id = uuidv4(); // Generate a new UUID if no ID is provided
    }

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

async function getAllTasks() {
    const params = { TableName: TABLE_NAME };
    const result = await dynamodbClient.send(new ScanCommand(params));
    const items = result.Items.map(unmarshall);
    return {
        statusCode: 200,
        body: JSON.stringify(items),
    };
}

async function getTask(id) {
    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
    };
    const result = await dynamodbClient.send(new GetItemCommand(params));
    return result.Item
        ? {
            statusCode: 200,
            body: JSON.stringify(unmarshall(result.Item)),
        }
        : {
            statusCode: 404,
            body: 'Task not found',
        };
}

async function updateTask(id, task) {
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

async function deleteTask(id) {
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
