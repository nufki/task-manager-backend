import { handler } from "../../lambdas/task-manager/index"; // The Lambda function to test
import { createTask, getAllTasks, getTask, updateTask, deleteTask } from "../../lambdas/task-manager/task.service";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {Task, TaskPriority, TaskStatus} from "../../lambdas/task-manager/models";

jest.mock("../../lambdas/task-manager/task.service");

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

describe("Lambda Handler", () => {
    const mockEvent = (
        httpMethod: string,
        resource: string,
        pathParameters?: Record<string, string> | null,
        body?: Record<string, any> | null
    ): APIGatewayProxyEvent => ({
        body: body ? JSON.stringify(body) : null,
        headers: {},
        multiValueHeaders: {},
        httpMethod,
        isBase64Encoded: false,
        pathParameters: pathParameters || null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        resource,
        requestContext: {
            accountId: "testAccountId",
            apiId: "testApiId",
            authorizer: { claims: { sub: "test-user-id" } },
            httpMethod,
            identity: {
                accessKey: null,
                accountId: null,
                apiKey: null,
                apiKeyId: null,
                caller: null,
                clientCert: null,
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                sourceIp: "127.0.0.1",
                user: null,
                userAgent: null,
                userArn: null,
            },
            path: resource, // Updated to correctly reflect the resource
            protocol: "HTTP/1.1",
            requestId: "testRequestId",
            requestTime: "01/Jan/1970:00:00:00 +0000",
            requestTimeEpoch: 0,
            resourceId: "testResourceId",
            resourcePath: resource,
            stage: "test",
        },
        path: resource, // Moved here for compatibility with APIGatewayProxyEvent
    });

    const mockContext: Context = {
        functionName: "testFunction",
        functionVersion: "1",
        invokedFunctionArn: "testArn",
        memoryLimitInMB: "128",
        awsRequestId: "testRequestId",
        logGroupName: "/aws/lambda/testFunction",
        logStreamName: "testStream",
        callbackWaitsForEmptyEventLoop: true,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn(),
        getRemainingTimeInMillis: jest.fn(() => 10000),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a task on POST /tasks", async () => {
        const newTask: Omit<Task, "id" | "userId"> = {
            name: "New Task",
            description: "This is a new task",
            status: TaskStatus.NotStarted,
            priority: TaskPriority.Low,
            dueDate: new Date("2024-01-01T00:00:00.000Z"),
            assignedUser: "user-456",
        };

        const createdTask: Task = {
            id: "1",
            userId: "user-123",
            ...newTask,
        };

        // Ensure the mock resolves correctly
        (createTask as jest.Mock).mockResolvedValue({
            statusCode: 201,
            body: JSON.stringify(createdTask),
        });

        const event = mockEvent("POST", "/tasks", null, newTask);
        const result = await handler(event, mockContext, jest.fn());

        expect(createTask).toHaveBeenCalledWith(
            {
                ...newTask,
                dueDate: newTask.dueDate.toISOString(), // the mock will serialize the date into a string, this is why I have to convert it here...
            },
            "test-user-id"
        );

        // Validate the result
        expect(result).toEqual({
            statusCode: 201,
            headers,
            body: JSON.stringify(createdTask),
        });
    });

    it("should fetch all tasks on GET /tasks", async () => {
        const tasks: Task[] = [
            {
                id: "1",
                userId: "user-123",
                name: "Test Task",
                description: "This is a test task",
                status: TaskStatus.NotStarted,
                priority: TaskPriority.Medium,
                dueDate: new Date("2024-01-01T00:00:00.000Z"),
                assignedUser: "user-456",
            },
        ];

        (getAllTasks as jest.Mock).mockResolvedValue({
            statusCode: 200,
            body: JSON.stringify(tasks),
        });

        const event = mockEvent("GET", "/tasks");
        const result = await handler(event, mockContext, jest.fn());

        expect(getAllTasks).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 200,
            headers,
            body: JSON.stringify(tasks),
        });
    });

    it("should fetch a single task on GET /tasks/{id}", async () => {
        const task = { id: "1", name: "Test Task" };
        (getTask as jest.Mock).mockResolvedValue({ statusCode: 200, body: JSON.stringify(task) });

        const event = mockEvent("GET", "/tasks/{id}", { id: "1" });
        const result = await handler(event, mockContext, jest.fn());

        expect(getTask).toHaveBeenCalledWith("1");
        expect(result).toEqual({
            statusCode: 200,
            headers,
            body: JSON.stringify(task),
        });
    });

    it("should update a task on PATCH /tasks/{id}", async () => {
        const updates: Partial<Task> = {
            name: "Updated Task Name",
            priority: TaskPriority.High,
        };

        const updatedTask: Task = {
            id: "1",
            userId: "user-123",
            name: updates.name || "Old Task Name",
            description: "Old Description",
            status: TaskStatus.InProgress,
            priority: updates.priority || TaskPriority.Low,
            dueDate: new Date("2024-01-01T00:00:00.000Z"),
            assignedUser: "user-789",
        };

        (updateTask as jest.Mock).mockResolvedValue({
            statusCode: 200,
            body: JSON.stringify(updatedTask),
        });

        const event = mockEvent("PUT", "/tasks/{id}", { id: "1" }, updates);
        const result = await handler(event, mockContext, jest.fn());

        expect(updateTask).toHaveBeenCalledWith("1", updates);
        expect(result).toEqual({
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedTask),
        });
    });

    it("should delete a task on DELETE /tasks/{id}", async () => {
        (deleteTask as jest.Mock).mockResolvedValue({ statusCode: 204, body: "" });

        const event = mockEvent("DELETE", "/tasks/{id}", { id: "1" });
        const result = await handler(event, mockContext, jest.fn());

        expect(deleteTask).toHaveBeenCalledWith("1");
        expect(result).toEqual({
            statusCode: 204,
            headers,
            body: "",
        });
    });

    it("should return 400 for unsupported HTTP method", async () => {
        const event = mockEvent("PATCH", "/tasks");
        const result = await handler(event, mockContext, jest.fn());

        expect(result).toEqual({
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Unsupported HTTP method" }),
        });
    });

    it("should return 500 on internal server error", async () => {
        (getAllTasks as jest.Mock).mockRejectedValue(new Error("Database error"));

        const event = mockEvent("GET", "/tasks");
        const result = await handler(event, mockContext, jest.fn());

        expect(getAllTasks).toHaveBeenCalled();
        expect(result).toEqual({
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal server error" }),
        });
    });
});
