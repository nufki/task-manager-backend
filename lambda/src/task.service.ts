import {
    DynamoDBClient,
    PutItemCommand,
    ScanCommand,
    GetItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ReturnValue
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Task, TaskPriority, TaskStatus } from "./models";

const TABLE_NAME = process.env.TABLE_NAME || "TaskTable";
const dynamodbClient = new DynamoDBClient({});
import { v4 as uuidv4 } from "uuid";

export async function createTask(task: Partial<Task>) {
    if (!task.id) {
        task.id = uuidv4();
    }

    const newTask: Task = {
        id: task.id,
        name: task.name || "",
        description: task.description || "",
        status: task.status || TaskStatus.Pending,
        priority: task.priority || TaskPriority.Medium,
        dueDate: task.dueDate || new Date().toISOString(),
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

export async function getAllTasks() {
    const params = { TableName: TABLE_NAME };
    const result = await dynamodbClient.send(new ScanCommand(params));
    const items = result.Items ? result.Items.map((item) => unmarshall(item)) : [];
    return {
        statusCode: 200,
        body: JSON.stringify(items),
    };
}

export async function getTask(id: string) {
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
    const params = {
        TableName: TABLE_NAME,
        Key: marshall({ id }),
        UpdateExpression:
            "set #name = :name, description = :description, #status = :status, priority = :priority, dueDate = :dueDate",
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