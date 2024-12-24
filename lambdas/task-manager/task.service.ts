import {
    DynamoDBClient,
    PutItemCommand,
    ScanCommand,
    GetItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ReturnValue,
    AttributeValue
} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {Task, TaskPriority, TaskStatus} from "./models";

const TABLE_NAME = process.env.TABLE_NAME || "TaskTable";
const dynamodbClient = new DynamoDBClient({});
import {v4 as uuidv4} from "uuid";

// Helper functions for Base64 encoding/decoding
const base64Encode = (data: Record<string, any>) => Buffer.from(JSON.stringify(data)).toString("base64");
const base64Decode = (token: string) => JSON.parse(Buffer.from(token, "base64").toString("utf-8"));


export async function createTask(task: Partial<Task>, cognitoUserId: string) {
    console.log('Creating task with cognitoUserId:', cognitoUserId);

    if (!task.id) {
        task.id = uuidv4();
    }

    const newTask: Task = {
        userId: cognitoUserId,
        id: task.id,
        name: task.name || "",
        description: task.description || "",
        status: task.status || TaskStatus.InProgress,
        priority: task.priority || TaskPriority.Medium,
        dueDate: task.dueDate || new Date(),
        assignedUser: task.assignedUser
    };

    const params = {
        TableName: TABLE_NAME,
        Item: marshall(newTask),
    };

    await dynamodbClient.send(new PutItemCommand(params));
    return {
        statusCode: 201,
        body: JSON.stringify(newTask),
    };
}

export async function getAllTasks(limit?: number, nextToken?: string) {
    console.log('Fetching all tasks with pagination...');

    const params: any = {
        TableName: TABLE_NAME,
        Limit: limit,
        ExclusiveStartKey: nextToken ? base64Decode(nextToken) : undefined,
    };
    
    const result = await dynamodbClient.send(new ScanCommand(params));

    // Unmarshall the items
    const items = result.Items ? result.Items.map((item) => unmarshall(item)) : [];

    // Return items and the PaginationToken for the next page
    return {
        statusCode: 200,
        body: JSON.stringify({
            items,
            nextToken: result.LastEvaluatedKey ? base64Encode(result.LastEvaluatedKey) : null,
        }),
    };
}


export async function getTask(id: string) {
    console.log('Fetching task with id:', id);
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
            body: JSON.stringify({ message: "Task not found" }),
        };
}

export async function updateTask(id: string, updates: Partial<Task>) {
    console.log('Updating task with id:', id, 'with updates:', updates);

    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
        UpdateExpression:
            "set #name = :name, description = :description, #status = :status, priority = :priority, dueDate = :dueDate, assignedUser = :assignedUser",
        ExpressionAttributeNames: {
            "#name": "name",
            "#status": "status",
        },
        ExpressionAttributeValues: marshall({
            ":name": updates.name,
            ":description": updates.description,
            ":status": updates.status,
            ":priority": updates.priority,
            ":dueDate": updates.dueDate,
            ":assignedUser": updates.assignedUser,
        }),
        ReturnValues: ReturnValue.ALL_NEW,
    };

    const result = await dynamodbClient.send(new UpdateItemCommand(params));
    return {
        statusCode: 200,
        body: JSON.stringify(result.Attributes ? unmarshall(result.Attributes) : {}),
    };
}

export async function deleteTask(id: string) {
    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
    };
    await dynamodbClient.send(new DeleteItemCommand(params));
    return {
        statusCode: 204,
        body: "",
    };
}